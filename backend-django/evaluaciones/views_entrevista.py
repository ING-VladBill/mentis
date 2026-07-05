# ==========================================
# evaluaciones/views_entrevista.py
# Sprint 4 — Endpoints de la entrevista IA por voz
#
# FLUJO DEL CANDIDATO (públicos, autenticados por token de acceso):
#   POST /api/entrevista/acceso/        {token} -> valida y devuelve contexto
#   POST /api/entrevista/iniciar/       {token} -> crea/retoma entrevista,
#                                                  devuelve system_prompt + token efímero Live
#   POST /api/entrevista/finalizar/     {token, transcripcion} -> guarda, analiza, notifica
#   POST /api/entrevista/captura/       {token, imagen, tipo} -> foto de auditoría
#
# RRHH (autenticados):
#   CRUD /api/evaluaciones/plantillas/
#   GET  /api/evaluaciones/entrevistas/{id}/  -> detalle con análisis dimensional
# ==========================================

import base64
import logging

from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from candidatos.models import Candidato, TokenAcceso
from .models import EntrevistaIA, PlantillaEvaluacion, CapturaAuditoria
from .serializers import PlantillaEvaluacionSerializer, EntrevistaDetalleSerializer
from .servicios.entrevista_ia import (
    DURACION_MAXIMA_MINUTOS,
    analizar_entrevista,
    construir_prompt_entrevista,
    elegir_plantilla_para_vacante,
    generar_token_efimero_live,
)

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Helper: validar el token de acceso tipo 'entrevista' (o código corto)
# ------------------------------------------------------------------
def _validar_token_entrevista(token_raw: str):
    if not token_raw:
        return None, 'Falta el token de acceso.'
    entrada = token_raw.strip()
    try:
        if entrada.upper().startswith('MENTIS-'):
            token = TokenAcceso.objects.select_related('candidato', 'candidato__vacante').get(
                codigo_corto=entrada.upper(), tipo='entrevista')
        else:
            limpio = entrada.replace('-', '').lower()
            token = TokenAcceso.objects.select_related('candidato', 'candidato__vacante').get(
                token=limpio, tipo='entrevista')
    except TokenAcceso.DoesNotExist:
        return None, 'El link o código no es válido. Verifica tu correo.'
    if token.usado:
        return None, 'Este acceso ya fue utilizado.'
    if token.fecha_expiracion and token.fecha_expiracion < timezone.now():
        return None, 'El link expiró. Contacta a RRHH para un nuevo acceso.'
    return token, None


# ------------------------------------------------------------------
# 1. ACCESO — valida el token y devuelve el contexto de bienvenida
# ------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def entrevista_acceso(request):
    token, error = _validar_token_entrevista(request.data.get('token', ''))
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    c = token.candidato
    duracion = min(c.vacante.duracion_minutos_entrevista or 30, DURACION_MAXIMA_MINUTOS)
    return Response({
        'candidato': {'nombre': c.nombre, 'apellidos': c.apellido_paterno},
        'vacante': {'titulo': c.vacante.titulo, 'nivel': c.vacante.nivel_experiencia},
        'duracion_minutos': duracion,
        'estado_entrevista': getattr(getattr(c, 'entrevista', None), 'estado', 'pendiente'),
    })


# ------------------------------------------------------------------
# 2. INICIAR — crea la entrevista, arma el prompt, entrega token Live
# ------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def entrevista_iniciar(request):
    token, error = _validar_token_entrevista(request.data.get('token', ''))
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    c = token.candidato
    if c.estado not in ('examen_aprobado', 'entrevista_pendiente', 'entrevista_en_curso'):
        return Response({'error': f'Tu proceso no está en etapa de entrevista (estado: {c.get_estado_display()}).'},
                        status=status.HTTP_400_BAD_REQUEST)

    duracion = min(c.vacante.duracion_minutos_entrevista or 30, DURACION_MAXIMA_MINUTOS)

    entrevista, creada = EntrevistaIA.objects.get_or_create(
        candidato=c,
        defaults={
            'plantilla': elegir_plantilla_para_vacante(c.vacante),
            'duracion_minutos': duracion,
            'estado': 'en_curso',
            'fecha_inicio': timezone.now(),
        },
    )
    if not creada:
        if entrevista.estado == 'finalizada':
            return Response({'error': 'Ya completaste tu entrevista. RRHH te contactará con los resultados.'},
                            status=status.HTTP_400_BAD_REQUEST)
        entrevista.estado = 'en_curso'
        if not entrevista.fecha_inicio:
            entrevista.fecha_inicio = timezone.now()
        entrevista.save()

    # El corazón: system prompt de personalidad único para este candidato
    system_prompt = construir_prompt_entrevista(c, entrevista)
    entrevista.prompt_utilizado = system_prompt
    entrevista.save(update_fields=['prompt_utilizado'])

    # Token efímero para que el navegador hable directo con Gemini Live
    try:
        live = generar_token_efimero_live()
    except Exception as e:
        logger.error(f'Error generando token efímero Live: {e}')
        return Response({'error': 'No se pudo iniciar la sesión de voz. Intenta de nuevo en unos segundos.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)

    c.estado = 'entrevista_en_curso'
    c.save(update_fields=['estado'])

    # Tiempo restante real (por si retoma una entrevista en curso)
    transcurrido = (timezone.now() - entrevista.fecha_inicio).total_seconds()
    restante = max(0, int(duracion * 60 - transcurrido))

    return Response({
        'entrevista_id': entrevista.id,
        'system_prompt': system_prompt,
        'live_token': live['token'],
        'live_model': live['modelo'],
        'duracion_minutos': duracion,
        'segundos_restantes': restante,
        'candidato_nombre': c.nombre,
    })


# ------------------------------------------------------------------
# 3. FINALIZAR — recibe la transcripción, corre el análisis y notifica
# ------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def entrevista_finalizar(request):
    token, error = _validar_token_entrevista(request.data.get('token', ''))
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    c = token.candidato
    entrevista = getattr(c, 'entrevista', None)
    if not entrevista or entrevista.estado == 'finalizada':
        return Response({'error': 'No hay una entrevista en curso.'}, status=status.HTTP_400_BAD_REQUEST)

    transcripcion = (request.data.get('transcripcion') or '').strip()
    if transcripcion:
        entrevista.transcripcion = transcripcion
    entrevista.save()

    # Audio opcional (base64) — S4-09
    audio_b64 = request.data.get('audio_base64')
    if audio_b64:
        try:
            entrevista.audio.save(
                f'entrevista_{c.id}.webm',
                ContentFile(base64.b64decode(audio_b64)),
                save=True,
            )
        except Exception as e:
            logger.warning(f'No se pudo guardar el audio de la entrevista {entrevista.id}: {e}')

    # Análisis multidimensional en background (no bloquear al candidato)
    import threading
    def _analizar():
        try:
            analizar_entrevista(entrevista)
            # Invalidar el token (una entrevista, un uso)
            token.usado = True
            token.save(update_fields=['usado'])
        except Exception as e:
            logger.error(f'Error analizando entrevista {entrevista.id}: {e}')
    threading.Thread(target=_analizar, daemon=True).start()

    # Política de silencio: no se revela nota
    return Response({
        'mensaje': '¡Entrevista completada! El equipo de RRHH revisará tu proceso y te contactará por correo.',
        'estado': 'finalizada',
    })


# ------------------------------------------------------------------
# 4. CAPTURA DE AUDITORÍA — foto identidad inicial + periódicas (S4-10/11)
# ------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def entrevista_captura(request):
    token, error = _validar_token_entrevista(request.data.get('token', ''))
    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    imagen_b64 = request.data.get('imagen_base64', '')
    tipo = request.data.get('tipo', 'periodica')
    if tipo not in ('identidad_inicial', 'periodica'):
        tipo = 'periodica'
    if not imagen_b64:
        return Response({'error': 'Falta la imagen.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if ',' in imagen_b64:  # quitar prefijo data:image/...;base64,
            imagen_b64 = imagen_b64.split(',', 1)[1]
        contenido = base64.b64decode(imagen_b64)
    except Exception:
        return Response({'error': 'Imagen inválida.'}, status=status.HTTP_400_BAD_REQUEST)

    captura = CapturaAuditoria(candidato=token.candidato, tipo=tipo, origen='entrevista')
    captura.imagen.save(
        f'{token.candidato.id}_{tipo}_{timezone.now().strftime("%H%M%S")}.jpg',
        ContentFile(contenido),
        save=True,
    )
    return Response({'registrado': True, 'tipo': tipo})


# ------------------------------------------------------------------
# RRHH: CRUD de plantillas de evaluación (S4-02)
# ------------------------------------------------------------------
class PlantillaEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = PlantillaEvaluacion.objects.prefetch_related('dimensiones').filter(activa=True)
    serializer_class = PlantillaEvaluacionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        plantilla = self.get_object()
        if plantilla.es_predefinida:
            return Response({'error': 'Las plantillas predefinidas del sistema no se pueden eliminar.'},
                            status=status.HTTP_400_BAD_REQUEST)
        # Borrado lógico
        plantilla.activa = False
        plantilla.save(update_fields=['activa'])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ------------------------------------------------------------------
# RRHH: detalle de una entrevista (análisis dimensional, transcripción, audio)
# ------------------------------------------------------------------
class EntrevistaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EntrevistaIA.objects.select_related('candidato', 'plantilla', 'candidato__vacante')
    serializer_class = EntrevistaDetalleSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='capturas')
    def capturas(self, request, pk=None):
        entrevista = self.get_object()
        capturas = entrevista.candidato.capturas_auditoria.filter(origen='entrevista')
        return Response([{
            'id': cap.id, 'tipo': cap.tipo,
            'url': cap.imagen.url if cap.imagen else None,
            'timestamp': cap.timestamp,
        } for cap in capturas])
