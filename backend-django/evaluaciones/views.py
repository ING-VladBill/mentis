# ==========================================
# evaluaciones/views.py (Sprint 3 - RRHH)
# Vistas para que RRHH consulte resultados de examen y auditoría.
# El candidato NO usa estos endpoints (él va por Spring Boot).
# ==========================================

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Examen, EventoAuditoria
from .serializers import (
    ExamenDetalleSerializer,
    ExamenListaSerializer,
    EventoAuditoriaSerializer,
)
from mentis_backend.permissions import EsReclutadorOAdmin


# Peso de cada severidad para el puntaje de riesgo del examen.
PESO_SEVERIDAD = {'baja': 1, 'media': 3, 'alta': 6}


class ExamenViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Solo lectura. RRHH consulta los exámenes y su detalle calificado.
    Los exámenes los crea Spring Boot, no se crean desde aquí.
    """
    permission_classes = [EsReclutadorOAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_fin', 'nota', 'estado']
    ordering = ['-fecha_fin']

    def get_serializer_class(self):
        if self.action == 'list':
            return ExamenListaSerializer
        return ExamenDetalleSerializer

    def get_queryset(self):
        qs = Examen.objects.select_related('candidato', 'vacante').prefetch_related('preguntas')

        vacante_id = self.request.query_params.get('vacante_id')
        if vacante_id:
            qs = qs.filter(vacante_id=vacante_id)

        candidato_id = self.request.query_params.get('candidato_id')
        if candidato_id:
            qs = qs.filter(candidato_id=candidato_id)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        return qs

    @action(detail=True, methods=['get'], url_path='por-candidato')
    def por_candidato(self, request, pk=None):
        """
        GET /api/evaluaciones/examenes/{candidato_id}/por-candidato/
        Atajo: trae el examen de un candidato por su ID de candidato.
        """
        examen = Examen.objects.select_related('candidato', 'vacante') \
            .prefetch_related('preguntas').filter(candidato_id=pk).first()
        if not examen:
            return Response({'error': 'Este candidato no tiene examen.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(ExamenDetalleSerializer(examen).data)

    @action(detail=True, methods=['get'], url_path='auditoria')
    def auditoria(self, request, pk=None):
        """
        GET /api/evaluaciones/examenes/{id}/auditoria/
        Resumen de integridad del examen con semáforo verde/amarillo/rojo.
        """
        examen = self.get_object()
        eventos = examen.eventos.all().order_by('timestamp')

        puntaje_riesgo = 0
        por_tipo = {}
        por_severidad = {'baja': 0, 'media': 0, 'alta': 0}

        for e in eventos:
            sev = e.severidad or 'baja'
            puntaje_riesgo += PESO_SEVERIDAD.get(sev, 1)
            por_tipo[e.tipo] = por_tipo.get(e.tipo, 0) + 1
            por_severidad[sev] = por_severidad.get(sev, 0) + 1

        # Semáforo según puntaje acumulado
        if puntaje_riesgo <= 6:
            semaforo = 'verde'
            veredicto = 'Comportamiento dentro de lo normal.'
        elif puntaje_riesgo <= 18:
            semaforo = 'amarillo'
            veredicto = 'Se detectaron algunas conductas a revisar.'
        else:
            semaforo = 'rojo'
            veredicto = 'Múltiples conductas sospechosas. Se recomienda revisar el examen.'

        return Response({
            'examen_id': examen.id,
            'candidato': examen.candidato.nombre_completo,
            'total_eventos': eventos.count(),
            'puntaje_riesgo': puntaje_riesgo,
            'semaforo': semaforo,
            'veredicto': veredicto,
            'por_severidad': por_severidad,
            'por_tipo': por_tipo,
            'eventos': EventoAuditoriaSerializer(eventos, many=True).data,
        })
