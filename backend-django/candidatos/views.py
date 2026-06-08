# ==========================================
# candidatos/views.py (Sprint 2 - completo)
# ==========================================

import threading
import logging

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.conf import settings
from django.utils import timezone

from .models import Candidato, TokenAcceso, NotaCandidato, Tag
from .serializers import (
    CandidatoListSerializer,
    CandidatoDetalleSerializer,
    CandidatoCreateSerializer,
    CandidatoRankingSerializer,
    NotaCandidatoSerializer,
    TagSerializer,
)
from .servicios.analisis_cv import analizar_cv, extraer_texto_pdf, procesar_cv_individual
from .servicios.correos import enviar_correo_avance_cv
from mentis_backend.permissions import EsReclutadorOAdmin, EsAdmin

logger = logging.getLogger(__name__)


# ==========================================
# TAG VIEWSET
# ==========================================

class TagViewSet(viewsets.ModelViewSet):
    """CRUD de tags para etiquetar candidatos."""
    serializer_class = TagSerializer
    permission_classes = [EsReclutadorOAdmin]
 
    def get_queryset(self):
        return Tag.objects.all()
 
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
 
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/tags/{id}/
        No permite eliminar un tag si tiene candidatos asociados.
        Primero hay que desasociarlo de todos los candidatos.
        """
        tag = self.get_object()
        total = tag.candidatos.count()
        if total > 0:
            return Response(
                {'error': f'No puedes eliminar este tag porque está asignado a {total} candidato(s). Quítalo de ellos primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
# ==========================================
# CANDIDATO VIEWSET
# ==========================================

class CandidatoViewSet(viewsets.ModelViewSet):
    parser_classes  = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['nombre', 'apellido_paterno', 'email', 'vacante__titulo']
    ordering_fields = ['fecha_postulacion', 'score_final', 'score_cv', 'estado']
    ordering        = ['-score_final']

    def get_permissions(self):
        return [EsReclutadorOAdmin()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CandidatoListSerializer
        if self.action in ['retrieve', 'analizar', 'aprobar']:
            return CandidatoDetalleSerializer
        if self.action == 'create':
            return CandidatoCreateSerializer
        if self.action == 'ranking':
            return CandidatoRankingSerializer
        return CandidatoDetalleSerializer

    def get_queryset(self):
        qs = Candidato.objects.select_related('vacante', 'vacante__area', 'registrado_por').prefetch_related('tags').all()

        vacante_id = self.request.query_params.get('vacante_id')
        if vacante_id:
            qs = qs.filter(vacante_id=vacante_id)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        clasificacion = self.request.query_params.get('clasificacion')
        if clasificacion:
            qs = qs.filter(clasificacion_ia=clasificacion)

        solo_finalistas = self.request.query_params.get('finalistas')
        if solo_finalistas == 'true':
            qs = qs.filter(es_finalista=True)

        tag_id = self.request.query_params.get('tag')
        if tag_id:
            qs = qs.filter(tags__id=tag_id)

        source = self.request.query_params.get('source')
        if source:
            qs = qs.filter(source=source)

        return qs

    def perform_create(self, serializer):
        candidato = serializer.save(registrado_por=self.request.user)
        if candidato.cv:
            try:
                with candidato.cv.open('rb') as f:
                    texto = extraer_texto_pdf(f)
                candidato.cv_texto_extraido = texto
                candidato.save(update_fields=['cv_texto_extraido'])
            except Exception as e:
                logger.warning(f'No se pudo extraer texto del CV: {e}')

    # ------------------------------------------
    # ANALIZAR CV CON IA
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='analizar')
    def analizar(self, request, pk=None):
        candidato = self.get_object()

        if not candidato.cv_texto_extraido and candidato.cv:
            try:
                with candidato.cv.open('rb') as f:
                    candidato.cv_texto_extraido = extraer_texto_pdf(f)
                candidato.save(update_fields=['cv_texto_extraido'])
            except Exception:
                pass

        if not candidato.cv_texto_extraido or len(candidato.cv_texto_extraido.strip()) < 50:
            return Response({'error': 'No hay texto suficiente en el CV para analizar.'}, status=400)

        candidato.estado = 'cv_analizando'
        candidato.save(update_fields=['estado'])

        try:
            resultado = analizar_cv(candidato, candidato.vacante)
            if resultado['pasa_filtro']:
                _enviar_correo_async(candidato)
            return Response({
                'mensaje':       'Análisis completado.',
                'pasa_filtro':   resultado['pasa_filtro'],
                'score':         resultado['score'],
                'clasificacion': resultado['clasificacion'],
                'candidato':     CandidatoDetalleSerializer(candidato).data,
            })
        except Exception as e:
            candidato.estado = 'postulado'
            candidato.save(update_fields=['estado'])
            logger.error(f'Error analizando CV {pk}: {e}')
            return Response({'error': str(e)}, status=500)

    # ------------------------------------------
    # APROBAR MANUALMENTE
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        candidato = self.get_object()
        candidato.aprobado_manualmente = True
        candidato.aprobado_por         = request.user
        candidato.nota_aprobacion      = request.data.get('nota', '')
        candidato.estado               = 'cv_aprobado'
        candidato.save(update_fields=['aprobado_manualmente', 'aprobado_por', 'nota_aprobacion', 'estado'])
        _enviar_correo_async(candidato)
        return Response({
            'mensaje':   f'Candidato aprobado manualmente por {request.user.nombre_completo}.',
            'candidato': CandidatoDetalleSerializer(candidato).data,
        })

    # ------------------------------------------
    # CARGA MASIVA
    # ------------------------------------------
    @action(detail=False, methods=['post'], url_path='carga-masiva', parser_classes=[MultiPartParser])
    def carga_masiva(self, request):
        vacante_id = request.data.get('vacante_id')
        if not vacante_id:
            return Response({'error': 'Se requiere vacante_id.'}, status=400)

        archivos = request.FILES.getlist('archivos')
        if not archivos:
            return Response({'error': 'No se recibieron archivos.'}, status=400)

        no_pdf = [f.name for f in archivos if not f.name.lower().endswith('.pdf')]
        if no_pdf:
            return Response({'error': f'Solo se aceptan PDFs. Inválidos: {", ".join(no_pdf)}'}, status=400)

        resultados = []
        exitosos = fallidos = 0
        for archivo in archivos:
            res = procesar_cv_individual(archivo, vacante_id, request.user)
            resultados.append(res)
            if res['exito']:
                exitosos += 1
            else:
                fallidos += 1

        return Response({
            'total': len(archivos), 'exitosos': exitosos, 'fallidos': fallidos,
            'detalle': resultados,
            'mensaje': f'Se procesaron {exitosos} CVs correctamente. {fallidos} tuvieron errores.',
        }, status=201 if exitosos > 0 else 400)

    # ------------------------------------------
    # RANKING
    # ------------------------------------------
    @action(detail=False, methods=['get'], url_path='ranking')
    def ranking(self, request):
        vacante_id = request.query_params.get('vacante_id')
        if not vacante_id:
            return Response({'error': 'Se requiere vacante_id.'}, status=400)

        candidatos = Candidato.objects.filter(
            vacante_id=vacante_id
        ).exclude(
            estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']
        ).order_by('-score_final', '-score_cv')

        for idx, c in enumerate(candidatos, start=1):
            if c.posicion_ranking != idx:
                c.posicion_ranking = idx
                c.save(update_fields=['posicion_ranking'])

        return Response({'total': candidatos.count(), 'ranking': CandidatoRankingSerializer(candidatos, many=True).data})

    # ------------------------------------------
    # MARCAR FINALISTAS
    # ------------------------------------------
    @action(detail=False, methods=['post'], url_path='marcar-finalistas')
    def marcar_finalistas(self, request):
        vacante_id = request.data.get('vacante_id')
        if not vacante_id:
            return Response({'error': 'Se requiere vacante_id.'}, status=400)

        from vacantes.models import Vacante
        try:
            vacante = Vacante.objects.get(id=vacante_id)
        except Vacante.DoesNotExist:
            return Response({'error': 'Vacante no encontrada.'}, status=404)

        Candidato.objects.filter(vacante=vacante).update(es_finalista=False)

        finalistas = Candidato.objects.filter(
            vacante=vacante, estado='entrevista_completada'
        ).order_by('-score_final')[:vacante.top_candidatos_finalistas]

        from candidatos.servicios.correos import enviar_correo_finalista
        enviados = 0
        for c in finalistas:
            c.es_finalista = True
            c.estado       = 'finalista'
            c.save(update_fields=['es_finalista', 'estado'])
            if enviar_correo_finalista(c):
                enviados += 1

        return Response({
            'mensaje':    f'{finalistas.count()} finalistas marcados. {enviados} correos enviados.',
            'finalistas': CandidatoListSerializer(finalistas, many=True).data,
        })

    # ------------------------------------------
    # NOTAS / COMENTARIOS INTERNOS
    # ------------------------------------------
    @action(detail=True, methods=['get'], url_path='notas')
    def listar_notas(self, request, pk=None):
        """GET /api/candidatos/{id}/notas/"""
        candidato = self.get_object()
        notas = candidato.notas.select_related('autor').all()
        return Response(NotaCandidatoSerializer(notas, many=True).data)

    @action(detail=True, methods=['post'], url_path='notas/agregar')
    def agregar_nota(self, request, pk=None):
        """POST /api/candidatos/{id}/notas/agregar/"""
        candidato = self.get_object()
        contenido = request.data.get('contenido', '').strip()
        if not contenido:
            return Response({'error': 'El contenido de la nota no puede estar vacío.'}, status=400)

        nota = NotaCandidato.objects.create(
            candidato = candidato,
            autor     = request.user,
            contenido = contenido,
        )
        return Response(NotaCandidatoSerializer(nota).data, status=201)

    @action(detail=True, methods=['patch'], url_path='notas/(?P<nota_id>[0-9]+)/editar')
    def editar_nota(self, request, pk=None, nota_id=None):
        """PATCH /api/candidatos/{id}/notas/{nota_id}/editar/"""
        try:
            nota = NotaCandidato.objects.get(id=nota_id, candidato_id=pk)
        except NotaCandidato.DoesNotExist:
            return Response({'error': 'Nota no encontrada.'}, status=404)

        if nota.autor != request.user and not request.user.es_admin:
            return Response({'error': 'Solo puedes editar tus propias notas.'}, status=403)

        nota.contenido    = request.data.get('contenido', nota.contenido)
        nota.editado      = True
        nota.fecha_edicion = timezone.now()
        nota.save()
        return Response(NotaCandidatoSerializer(nota).data)

    @action(detail=True, methods=['delete'], url_path='notas/(?P<nota_id>[0-9]+)/eliminar')
    def eliminar_nota(self, request, pk=None, nota_id=None):
        """DELETE /api/candidatos/{id}/notas/{nota_id}/eliminar/"""
        try:
            nota = NotaCandidato.objects.get(id=nota_id, candidato_id=pk)
        except NotaCandidato.DoesNotExist:
            return Response({'error': 'Nota no encontrada.'}, status=404)

        if nota.autor != request.user and not request.user.es_admin:
            return Response({'error': 'Solo puedes eliminar tus propias notas.'}, status=403)

        nota.delete()
        return Response({'mensaje': 'Nota eliminada.'})

    # ------------------------------------------
    # TAGS
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='tags/agregar')
    def agregar_tag(self, request, pk=None):
        """POST /api/candidatos/{id}/tags/agregar/ — Body: {tag_id: 1}"""
        candidato = self.get_object()
        tag_id    = request.data.get('tag_id')
        try:
            tag = Tag.objects.get(id=tag_id)
        except Tag.DoesNotExist:
            return Response({'error': 'Tag no encontrado.'}, status=404)
        candidato.tags.add(tag)
        return Response({'mensaje': f'Tag "{tag.nombre}" agregado.', 'tags': TagSerializer(candidato.tags.all(), many=True).data})

    @action(detail=True, methods=['post'], url_path='tags/quitar')
    def quitar_tag(self, request, pk=None):
        """POST /api/candidatos/{id}/tags/quitar/ — Body: {tag_id: 1}"""
        candidato = self.get_object()
        tag_id    = request.data.get('tag_id')
        try:
            tag = Tag.objects.get(id=tag_id)
        except Tag.DoesNotExist:
            return Response({'error': 'Tag no encontrado.'}, status=404)
        candidato.tags.remove(tag)
        return Response({'mensaje': f'Tag "{tag.nombre}" quitado.', 'tags': TagSerializer(candidato.tags.all(), many=True).data})


# ------------------------------------------
# HELPER
# ------------------------------------------
def _enviar_correo_async(candidato):
    def _enviar():
        try:
            enviar_correo_avance_cv(candidato)
        except Exception as e:
            logger.error(f'Error enviando correo: {e}')
    threading.Thread(target=_enviar, daemon=True).start()
