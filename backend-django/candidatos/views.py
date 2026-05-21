# ==========================================
# candidatos/views.py
# ==========================================

import os
import threading
import logging

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.conf import settings
from django.db import transaction

from .models import Candidato, TokenAcceso
from .serializers import (
    CandidatoListSerializer,
    CandidatoDetalleSerializer,
    CandidatoCreateSerializer,
    CandidatoRankingSerializer,
)
from .servicios.analisis_cv import analizar_cv, extraer_texto_pdf, procesar_cv_individual
from .servicios.correos import enviar_correo_avance_cv
from mentis_backend.permissions import EsReclutadorOAdmin, EsAdmin

logger = logging.getLogger(__name__)


class CandidatoViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de candidatos + acciones de análisis IA.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'apellido_paterno', 'email', 'vacante__titulo']
    ordering_fields = ['fecha_postulacion', 'score_final', 'score_cv', 'estado']
    ordering = ['-score_final']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy',
                           'analizar', 'aprobar', 'carga_masiva']:
            return [EsReclutadorOAdmin()]
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
        qs = Candidato.objects.select_related('vacante', 'registrado_por').all()

        # Filtros por query params
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

        return qs

    def perform_create(self, serializer):
        candidato = serializer.save(registrado_por=self.request.user)

        # Extraer texto del PDF automáticamente al subir
        if candidato.cv:
            try:
                with candidato.cv.open('rb') as f:
                    texto = extraer_texto_pdf(f)
                candidato.cv_texto_extraido = texto
                candidato.save(update_fields=['cv_texto_extraido'])
            except Exception as e:
                logger.warning(f'No se pudo extraer texto del CV: {e}')

    # ------------------------------------------
    # ACCIÓN: Analizar CV con IA
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='analizar')
    def analizar(self, request, pk=None):
        """
        POST /api/candidatos/{id}/analizar/
        Lanza el análisis IA del CV contra la vacante.
        """
        candidato = self.get_object()

        if not candidato.cv_texto_extraido:
            # Intentar extraer ahora
            if candidato.cv:
                try:
                    with candidato.cv.open('rb') as f:
                        texto = extraer_texto_pdf(f)
                    candidato.cv_texto_extraido = texto
                    candidato.save(update_fields=['cv_texto_extraido'])
                except Exception:
                    pass

        if not candidato.cv_texto_extraido or len(candidato.cv_texto_extraido.strip()) < 50:
            return Response(
                {'error': 'No hay texto suficiente en el CV para analizar. Verifica que el PDF sea legible.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Marcar como analizando
        candidato.estado = 'cv_analizando'
        candidato.save(update_fields=['estado'])

        try:
            resultado = analizar_cv(candidato, candidato.vacante)

            # Si pasó el filtro, enviar correo automáticamente
            if resultado['pasa_filtro']:
                _enviar_correo_async(candidato)

            return Response({
                'mensaje': 'Análisis completado.',
                'pasa_filtro': resultado['pasa_filtro'],
                'score': resultado['score'],
                'clasificacion': resultado['clasificacion'],
                'candidato': CandidatoDetalleSerializer(candidato).data,
            })

        except Exception as e:
            candidato.estado = 'postulado'
            candidato.save(update_fields=['estado'])
            logger.error(f'Error analizando CV candidato {pk}: {e}')
            return Response(
                {'error': f'Error en el análisis: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ------------------------------------------
    # ACCIÓN: Aprobar manualmente (override IA)
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """
        POST /api/candidatos/{id}/aprobar/
        El reclutador aprueba manualmente al candidato aunque la IA lo haya rechazado.
        """
        candidato = self.get_object()
        nota = request.data.get('nota', '')

        candidato.aprobado_manualmente = True
        candidato.aprobado_por         = request.user
        candidato.nota_aprobacion      = nota
        candidato.estado               = 'cv_aprobado'
        candidato.save(update_fields=[
            'aprobado_manualmente', 'aprobado_por', 'nota_aprobacion', 'estado'
        ])

        # Enviar correo de avance
        _enviar_correo_async(candidato)

        return Response({
            'mensaje': f'Candidato aprobado manualmente por {request.user.nombre_completo}.',
            'candidato': CandidatoDetalleSerializer(candidato).data,
        })

    # ------------------------------------------
    # ACCIÓN: Carga masiva de CVs
    # ------------------------------------------
    @action(detail=False, methods=['post'], url_path='carga-masiva',
            parser_classes=[MultiPartParser])
    def carga_masiva(self, request):
        """
        POST /api/candidatos/carga-masiva/
        Recibe múltiples PDFs y los procesa automáticamente.
        Body: archivos (múltiples PDFs), vacante_id
        """
        vacante_id = request.data.get('vacante_id')
        if not vacante_id:
            return Response(
                {'error': 'Se requiere vacante_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        archivos = request.FILES.getlist('archivos')
        if not archivos:
            return Response(
                {'error': 'No se recibieron archivos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que todos sean PDFs
        no_pdf = [f.name for f in archivos if not f.name.lower().endswith('.pdf')]
        if no_pdf:
            return Response(
                {'error': f'Solo se aceptan PDFs. Archivos inválidos: {", ".join(no_pdf)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        resultados = []
        exitosos = 0
        fallidos = 0

        for archivo in archivos:
            resultado = procesar_cv_individual(
                archivo_pdf  = archivo,
                vacante_id   = vacante_id,
                usuario_rrhh = request.user,
            )
            resultados.append(resultado)
            if resultado['exito']:
                exitosos += 1
            else:
                fallidos += 1

        return Response({
            'total': len(archivos),
            'exitosos': exitosos,
            'fallidos': fallidos,
            'detalle': resultados,
            'mensaje': f'Se procesaron {exitosos} CVs correctamente. {fallidos} tuvieron errores.',
        }, status=status.HTTP_201_CREATED if exitosos > 0 else status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------
    # ACCIÓN: Ranking por vacante
    # ------------------------------------------
    @action(detail=False, methods=['get'], url_path='ranking')
    def ranking(self, request):
        """
        GET /api/candidatos/ranking/?vacante_id=1
        Ranking de candidatos ordenados por score final.
        """
        vacante_id = request.query_params.get('vacante_id')
        if not vacante_id:
            return Response(
                {'error': 'Se requiere vacante_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        candidatos = Candidato.objects.filter(
            vacante_id=vacante_id
        ).exclude(
            estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']
        ).order_by('-score_final', '-score_cv')

        serializer = CandidatoRankingSerializer(candidatos, many=True)

        # Actualizar posición en ranking
        for idx, candidato in enumerate(candidatos, start=1):
            if candidato.posicion_ranking != idx:
                candidato.posicion_ranking = idx
                candidato.save(update_fields=['posicion_ranking'])

        return Response({
            'total': candidatos.count(),
            'ranking': serializer.data,
        })

    # ------------------------------------------
    # ACCIÓN: Marcar finalistas
    # ------------------------------------------
    @action(detail=False, methods=['post'], url_path='marcar-finalistas')
    def marcar_finalistas(self, request):
        """
        POST /api/candidatos/marcar-finalistas/
        Marca el top N como finalistas y envía correos.
        """
        vacante_id = request.data.get('vacante_id')
        if not vacante_id:
            return Response({'error': 'Se requiere vacante_id.'}, status=400)

        from vacantes.models import Vacante
        try:
            vacante = Vacante.objects.get(id=vacante_id)
        except Vacante.DoesNotExist:
            return Response({'error': 'Vacante no encontrada.'}, status=404)

        top_n = vacante.top_candidatos_finalistas

        # Limpiar finalistas anteriores
        Candidato.objects.filter(vacante=vacante).update(es_finalista=False)

        # Seleccionar top N
        finalistas = Candidato.objects.filter(
            vacante=vacante,
            estado='entrevista_completada'
        ).order_by('-score_final')[:top_n]

        from candidatos.servicios.correos import enviar_correo_finalista
        enviados = 0
        for candidato in finalistas:
            candidato.es_finalista = True
            candidato.estado       = 'finalista'
            candidato.save(update_fields=['es_finalista', 'estado'])
            if enviar_correo_finalista(candidato):
                enviados += 1

        return Response({
            'mensaje': f'{finalistas.count()} finalistas marcados. {enviados} correos enviados.',
            'finalistas': CandidatoListSerializer(finalistas, many=True).data,
        })


# ------------------------------------------
# HELPER: Envío de correo en background
# ------------------------------------------
def _enviar_correo_async(candidato):
    """Envía el correo en un thread separado para no bloquear la respuesta."""
    def _enviar():
        try:
            enviar_correo_avance_cv(candidato)
        except Exception as e:
            logger.error(f'Error enviando correo en background: {e}')

    thread = threading.Thread(target=_enviar)
    thread.daemon = True
    thread.start()
