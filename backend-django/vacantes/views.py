# ==========================================
# vacantes/views.py
# ==========================================

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Vacante
from candidatos.serializers import (
    VacanteListSerializer,
    VacanteDetalleSerializer,
    VacanteCreateSerializer,
)
from mentis_backend.permissions import EsReclutadorOAdmin, EsGerenteOAdmin


class VacanteViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de vacantes con filtros y acciones extra.
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['titulo', 'codigo', 'departamento', 'descripcion']
    ordering_fields = ['fecha_creacion', 'titulo', 'prioridad', 'estado']
    ordering        = ['-fecha_creacion']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'abiertas', 'por_area']:
            return [EsReclutadorOAdmin()]
        if self.action == 'estadisticas':
            return [EsGerenteOAdmin()]
        return [EsReclutadorOAdmin()]

    def get_serializer_class(self):
        if self.action == 'list':
            return VacanteListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return VacanteCreateSerializer
        return VacanteDetalleSerializer

    def get_queryset(self):
        qs = Vacante.objects.select_related('creado_por').all()

        # Filtros opcionales
        area = self.request.query_params.get('area')
        if area:
            qs = qs.filter(area=area)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            qs = qs.filter(prioridad=prioridad)

        return qs

    def perform_create(self, serializer):
        serializer.save(
            creado_por = self.request.user,
            estado     = 'abierta',
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        # Si se abre la vacante, registrar fecha de publicación
        if instance.estado == 'abierta' and not instance.fecha_publicacion:
            instance.fecha_publicacion = timezone.now()
            instance.save(update_fields=['fecha_publicacion'])

    # ------------------------------------------
    # ACCIONES EXTRA
    # ------------------------------------------

    @action(detail=False, methods=['get'], url_path='abiertas')
    def abiertas(self, request):
        """GET /api/vacantes/abiertas/ — Solo vacantes con estado abierta."""
        vacantes = self.get_queryset().filter(estado='abierta')
        serializer = VacanteListSerializer(vacantes, many=True)
        return Response({
            'total': vacantes.count(),
            'vacantes': serializer.data,
        })

    @action(detail=False, methods=['get'], url_path='por-area')
    def por_area(self, request):
        """GET /api/vacantes/por-area/ — Agrupa vacantes por área."""
        from django.db.models import Count

        resumen = (
            self.get_queryset()
            .values('area')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        area_choices = dict(Vacante.AREA_CHOICES)
        resultado = [
            {
                'area': item['area'],
                'area_display': area_choices.get(item['area'], item['area']),
                'total': item['total'],
            }
            for item in resumen
        ]
        return Response(resultado)

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None):
        """POST /api/vacantes/{id}/cambiar-estado/ — Cambia el estado de la vacante."""
        vacante = self.get_object()
        nuevo_estado = request.data.get('estado')

        estados_validos = [s[0] for s in Vacante.ESTADO_CHOICES]
        if nuevo_estado not in estados_validos:
            return Response(
                {'error': f'Estado inválido. Opciones: {estados_validos}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vacante.estado = nuevo_estado
        if nuevo_estado == 'abierta' and not vacante.fecha_publicacion:
            vacante.fecha_publicacion = timezone.now()
        if nuevo_estado == 'cerrada' and not vacante.fecha_cierre:
            vacante.fecha_cierre = timezone.now()
        vacante.save()

        return Response({
            'mensaje': f'Estado cambiado a {vacante.get_estado_display()}.',
            'vacante': VacanteDetalleSerializer(vacante).data,
        })

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """GET /api/vacantes/estadisticas/ — Dashboard metrics."""
        from django.db.models import Count, Avg
        from candidatos.models import Candidato

        total_vacantes   = Vacante.objects.count()
        vacantes_abiertas = Vacante.objects.filter(estado='abierta').count()
        total_candidatos  = Candidato.objects.count()
        candidatos_activos = Candidato.objects.exclude(
            estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']
        ).count()
        finalistas = Candidato.objects.filter(es_finalista=True).count()

        return Response({
            'vacantes': {
                'total':   total_vacantes,
                'abiertas': vacantes_abiertas,
                'por_area': list(
                    Vacante.objects.values('area')
                    .annotate(total=Count('id'))
                    .order_by('-total')[:5]
                ),
            },
            'candidatos': {
                'total':    total_candidatos,
                'activos':  candidatos_activos,
                'finalistas': finalistas,
                'score_promedio': Candidato.objects.filter(
                    score_final__isnull=False
                ).aggregate(avg=Avg('score_final'))['avg'],
            },
        })
