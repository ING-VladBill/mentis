# ==========================================
# candidatos/views.py 
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
from .servicios.correos import enviar_correo_avance_cv, enviar_correo_avance_examen, enviar_correo_finalista
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

from django.conf import settings as django_settings
from rest_framework.decorators import api_view, permission_classes as drf_permission_classes
from rest_framework.permissions import AllowAny


@api_view(['POST'])
@drf_permission_classes([AllowAny])
def notificar_avance_examen(request, candidato_id):
    """
    Endpoint interno llamado por el Spring Boot justo después de calificar un examen.
    Envía automáticamente el correo correspondiente (entrevista si aprobó).
    Protegido con una clave compartida (lo llama otro backend, no un navegador).
    """
    clave_recibida = request.headers.get('X-Internal-Key', '')
    clave_esperada = getattr(django_settings, 'INTERNAL_SERVICE_KEY', '')
    if not clave_esperada or clave_recibida != clave_esperada:
        return Response({'error': 'No autorizado.'}, status=401)

    try:
        candidato = Candidato.objects.get(id=candidato_id)
    except Candidato.DoesNotExist:
        return Response({'error': 'Candidato no encontrado.'}, status=404)

    if candidato.estado != 'examen_aprobado':
        return Response({'mensaje': f'Sin acción: estado actual es "{candidato.estado}".'})

    from .servicios.correos import enviar_correo_avance_examen, enviar_correo_alerta_riesgo_rrhh
    from .models import Notificacion

    # --- Regla de negocio: si el examen tuvo RIESGO ALTO de auditoría, NO se
    # envía la entrevista automáticamente. Queda en revisión manual de RRHH. ---
    puntaje_riesgo = _calcular_riesgo_examen(candidato)

    if puntaje_riesgo is not None and puntaje_riesgo > 18:  # umbral 'rojo'
        # 1) Notificación interna (campana del sistema)
        Notificacion.objects.create(
            tipo='riesgo_examen',
            titulo=f'Revisar examen de {candidato.nombre_completo}',
            mensaje=(f'{candidato.nombre_completo} aprobó el examen de "{candidato.vacante.titulo}", '
                     f'pero la auditoría detectó RIESGO ALTO (puntaje {puntaje_riesgo}). '
                     'La entrevista NO se envió automáticamente: revisa el examen y, si procede, '
                     'reenvía la etapa manualmente desde su ficha.'),
            candidato=candidato,
        )
        # 2) Correo a los reclutadores/admins
        try:
            enviar_correo_alerta_riesgo_rrhh(candidato, puntaje_riesgo)
        except Exception as e:
            logging.getLogger(__name__).warning(f'No se pudo enviar alerta de riesgo a RRHH: {e}')

        return Response({
            'mensaje': 'Examen aprobado con riesgo alto. Retenido para revisión manual de RRHH.',
            'riesgo': puntaje_riesgo,
            'correo_entrevista_enviado': False,
        })

    # Riesgo aceptable -> flujo normal: enviar la entrevista
    enviado = enviar_correo_avance_examen(candidato)
    if not enviado:
        return Response({'error': 'No se pudo enviar el correo de entrevista.'}, status=500)

    return Response({
        'mensaje': f'Correo de entrevista enviado a {candidato.email}.',
        'correo_entrevista_enviado': True,
    })


def _calcular_riesgo_examen(candidato):
    """
    Suma el puntaje de riesgo de auditoría del examen del candidato.
    Mismo criterio que el endpoint de auditoría (baja=1, media=3, alta=6).
    Devuelve None si no hay examen con eventos.
    """
    PESOS = {'baja': 1, 'media': 3, 'alta': 6}
    examen = getattr(candidato, 'examen', None)
    if not examen:
        return None
    total = 0
    for e in examen.eventos.all():
        total += PESOS.get(e.severidad or 'baja', 1)
    return total


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

        # Si RRHH marcó "analizar al crear", se dispara el análisis IA en background.
        # Por defecto NO se analiza (registro unitario manual da control a RRHH).
        analizar_flag = str(self.request.data.get('analizar_al_crear', '')).lower() in ('true', '1', 'yes')
        if analizar_flag and candidato.cv_texto_extraido:
            import threading

            def _analizar(candidato_id=candidato.id):
                try:
                    from candidatos.models import Candidato as _C
                    from candidatos.servicios.correos import enviar_correo_avance_cv
                    c = _C.objects.get(id=candidato_id)
                    resultado = analizar_cv(c, c.vacante)
                    if resultado.get('pasa_filtro'):
                        enviar_correo_avance_cv(c)
                except Exception as e:
                    logger.error(f'Error analizando CV (registro unitario) candidato {candidato_id}: {e}')

            threading.Thread(target=_analizar, daemon=True).start()

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
            try:
                res = procesar_cv_individual(archivo, vacante_id, request.user)
            except Exception as e:
                # Defensa final: un fallo inesperado en un archivo NO debe tumbar
                # el resto de la carga masiva.
                res = {'exito': False, 'error': f'Error inesperado: {e}', 'archivo': archivo.name}
            resultados.append(res)
            if res['exito']:
                exitosos += 1
            else:
                fallidos += 1

        # IMPORTANTE: el lote SIEMPRE se "procesó" exitosamente como petición HTTP,
        # incluso si todos los archivos individuales fallaron (ej: CVs corruptos).
        # Por eso usamos siempre un status 2xx: así el frontend (axios) entra al
        # camino de "éxito" y muestra el detalle por archivo en todos los casos,
        # en vez de perder esa información en un manejo de error genérico.
        # Un 400 real queda reservado para peticiones mal formadas (sin vacante_id,
        # sin archivos, archivos no-PDF), que ya se validan más arriba.
        return Response({
            'total': len(archivos), 'exitosos': exitosos, 'fallidos': fallidos,
            'detalle': resultados,
            'mensaje': f'Se procesaron {exitosos} CVs correctamente. {fallidos} tuvieron errores.',
        }, status=201 if fallidos == 0 else 200)

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
    # REENVIAR CORREO SEGÚN ETAPA ACTUAL
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='reenviar-correo-etapa')
    def reenviar_correo_etapa(self, request, pk=None):
        """
        Reenvía el correo correspondiente a la etapa ACTUAL del candidato.
        Solo disponible si el candidato superó al menos el filtro de CV.
        - cv_aprobado / examen_pendiente / examen_en_curso  -> correo de examen
        - examen_aprobado / entrevista_pendiente / entrevista_en_curso -> correo de entrevista IA
        - entrevista_completada / finalista -> correo de finalista
        """
        candidato = self.get_object()

        # Mapeo estado -> (función de correo, etiqueta legible)
        mapa_estados = {
            'cv_aprobado':           (enviar_correo_avance_cv,      'examen escrito'),
            'examen_pendiente':      (enviar_correo_avance_cv,      'examen escrito'),
            'examen_en_curso':       (enviar_correo_avance_cv,      'examen escrito'),

            'examen_aprobado':       (enviar_correo_avance_examen,  'entrevista con IA'),
            'entrevista_pendiente':  (enviar_correo_avance_examen,  'entrevista con IA'),
            'entrevista_en_curso':   (enviar_correo_avance_examen,  'entrevista con IA'),

            'entrevista_completada': (enviar_correo_finalista,      'resultado de finalista'),
            'finalista':             (enviar_correo_finalista,      'resultado de finalista'),
        }

        if candidato.estado not in mapa_estados:
            return Response({
                'error': f'No hay un correo de reenvío disponible para el estado actual "{candidato.get_estado_display()}".'
            }, status=400)

        funcion_correo, etiqueta_etapa = mapa_estados[candidato.estado]

        enviado = funcion_correo(candidato)

        if not enviado:
            return Response({
                'error': 'No se pudo enviar el correo. Revisa los logs del servidor.'
            }, status=500)

        return Response({
            'mensaje': f'Correo de "{etiqueta_etapa}" reenviado a {candidato.email}.',
            'etapa':   etiqueta_etapa,
        })


    # ------------------------------------------
    # BANCO DE TALENTO (S4-18)
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='banco-talento')
    def toggle_banco_talento(self, request, pk=None):
        """Agrega o quita al candidato del banco de talento."""
        candidato = self.get_object()
        candidato.en_banco_talento = not candidato.en_banco_talento
        candidato.save(update_fields=['en_banco_talento'])
        return Response({
            'en_banco_talento': candidato.en_banco_talento,
            'mensaje': ('Agregado al banco de talento.' if candidato.en_banco_talento
                        else 'Retirado del banco de talento.'),
        })

    @action(detail=False, methods=['get'], url_path='banco-talento')
    def listar_banco_talento(self, request):
        """
        Lista el banco de talento con filtros por score:
        ?score_min=70&habilidad=python&area_id=2
        """
        qs = Candidato.objects.filter(en_banco_talento=True).select_related('vacante', 'vacante__area')
        score_min = request.query_params.get('score_min')
        if score_min:
            qs = qs.filter(score_cv__gte=int(score_min))
        habilidad = request.query_params.get('habilidad')
        if habilidad:
            qs = qs.filter(habilidades_detectadas__icontains=habilidad)
        area_id = request.query_params.get('area_id')
        if area_id:
            qs = qs.filter(vacante__area_id=area_id)
        data = [{
            'id': c.id, 'nombre_completo': c.nombre_completo, 'email': c.email,
            'vacante_original': c.vacante.titulo if c.vacante else None,
            'score_cv': c.score_cv, 'score_examen': float(c.score_examen) if c.score_examen else None,
            'score_entrevista': float(c.score_entrevista) if c.score_entrevista else None,
            'score_final': float(c.score_final) if c.score_final else None,
            'habilidades': c.habilidades_detectadas, 'estado': c.estado,
        } for c in qs.order_by('-score_final', '-score_cv')]
        return Response({'total': len(data), 'candidatos': data})

    # ------------------------------------------
    # MOTIVO DE DESCARTE (S4-20)
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='descartar')
    def descartar(self, request, pk=None):
        """Descarta al candidato registrando el motivo (obligatorio)."""
        candidato = self.get_object()
        motivo = (request.data.get('motivo') or '').strip()
        if not motivo:
            return Response({'error': 'El motivo de descarte es obligatorio.'}, status=400)
        candidato.motivo_descarte = motivo
        candidato.estado = 'descartado'
        candidato.save(update_fields=['motivo_descarte', 'estado'])
        return Response({'mensaje': f'Candidato descartado. Motivo registrado.', 'estado': 'descartado'})

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


# ==========================================================
# NOTIFICACIONES INTERNAS (campana del sistema para RRHH)
# ==========================================================
from rest_framework import serializers as _serializers
from .models import Notificacion


class NotificacionSerializer(_serializers.ModelSerializer):
    candidato_nombre = _serializers.CharField(source='candidato.nombre_completo', read_only=True, default=None)
    tipo_display     = _serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model  = Notificacion
        fields = ['id', 'tipo', 'tipo_display', 'titulo', 'mensaje',
                  'candidato', 'candidato_nombre', 'leida', 'creada']


class NotificacionViewSet(viewsets.ModelViewSet):
    """Notificaciones para RRHH: listar, marcar como leídas."""
    serializer_class = NotificacionSerializer
    queryset = Notificacion.objects.select_related('candidato').all()

    def get_permissions(self):
        return [EsReclutadorOAdmin()]

    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        qs = self.get_queryset().filter(leida=False)
        return Response({
            'total': qs.count(),
            'notificaciones': NotificacionSerializer(qs[:20], many=True).data,
        })

    @action(detail=True, methods=['post'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notif = self.get_object()
        notif.leida = True
        notif.save(update_fields=['leida'])
        return Response({'ok': True})

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        self.get_queryset().filter(leida=False).update(leida=True)
        return Response({'ok': True})