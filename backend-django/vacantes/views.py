# ==========================================
# vacantes/views.py - ACTUALIZADO con Area
# ==========================================

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from .models import Area, Vacante
from .serializers import (
    AreaSerializer,
    AreaSimpleSerializer,
    VacanteListSerializer,
    VacanteDetalleSerializer,
    VacanteCreateSerializer,
)
from mentis_backend.permissions import EsReclutadorOAdmin, EsGerenteOAdmin, EsAdmin


class AreaViewSet(viewsets.ModelViewSet):
    """
    CRUD de áreas. Solo admin puede crear/editar/desactivar.
    Todos los roles pueden listar para usar en formularios.
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['nombre', 'codigo_corto', 'descripcion']
    ordering_fields = ['orden', 'nombre']
    ordering        = ['orden', 'nombre']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'activas']:
            return [EsReclutadorOAdmin()]
        return [EsAdmin()]

    def get_serializer_class(self):
        if self.action == 'activas':
            return AreaSimpleSerializer
        return AreaSerializer

    def get_queryset(self):
        qs = Area.objects.all()
        solo_activas = self.request.query_params.get('activas')
        if solo_activas == 'true':
            qs = qs.filter(activa=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        area = self.get_object()
        if area.es_predefinida:
            return Response(
                {'error': 'Las áreas predefinidas del sistema no pueden eliminarse. Puedes desactivarla.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if area.total_vacantes > 0:
            return Response(
                {
                    'error': f'No puedes eliminar esta área porque tiene {area.total_vacantes} vacante(s) asociada(s). Desactívala en su lugar.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='activas')
    def activas(self, request):
        """
        GET /api/areas/activas/
        Lista solo áreas activas. Usado por el frontend para poblar dropdowns.
        """
        areas = Area.objects.filter(activa=True).order_by('orden', 'nombre')
        serializer = AreaSimpleSerializer(areas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='desactivar')
    def desactivar(self, request, pk=None):
        """POST /api/areas/{id}/desactivar/"""
        area = self.get_object()
        if area.vacantes_abiertas > 0:
            return Response(
                {
                    'error': f'Esta área tiene {area.vacantes_abiertas} vacante(s) abiertas. '
                             'Ciérralas antes de desactivar el área.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        area.desactivar()
        return Response({
            'mensaje': f'Área "{area.nombre}" desactivada correctamente.',
            'area': AreaSerializer(area).data,
        })

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        """POST /api/areas/{id}/activar/"""
        area = self.get_object()
        area.activar()
        return Response({
            'mensaje': f'Área "{area.nombre}" activada correctamente.',
            'area': AreaSerializer(area).data,
        })


class VacanteViewSet(viewsets.ModelViewSet):
    """CRUD completo de vacantes."""
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['titulo', 'codigo', 'descripcion', 'area__nombre']
    ordering_fields = ['fecha_creacion', 'titulo', 'prioridad', 'estado']
    ordering        = ['-fecha_creacion']

    def get_permissions(self):
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
        qs = Vacante.objects.select_related('area', 'creado_por').all()

        area_id = self.request.query_params.get('area_id')
        if area_id:
            qs = qs.filter(area_id=area_id)

        area_codigo = self.request.query_params.get('area')
        if area_codigo:
            qs = qs.filter(area__codigo_corto=area_codigo.upper())

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            qs = qs.filter(prioridad=prioridad)

        return qs

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user, estado='abierta')

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.estado == 'abierta' and not instance.fecha_publicacion:
            instance.fecha_publicacion = timezone.now()
            instance.save(update_fields=['fecha_publicacion'])

    @action(detail=False, methods=['get'], url_path='abiertas')
    def abiertas(self, request):
        vacantes = self.get_queryset().filter(estado='abierta')
        serializer = VacanteListSerializer(vacantes, many=True)
        return Response({'total': vacantes.count(), 'vacantes': serializer.data})

    @action(detail=False, methods=['get'], url_path='por-area')
    def por_area(self, request):
        from django.db.models import Count
        resumen = (
            self.get_queryset()
            .values('area__id', 'area__nombre', 'area__codigo_corto', 'area__color')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        return Response([
            {
                'area_id':     item['area__id'],
                'area':        item['area__nombre'],
                'codigo':      item['area__codigo_corto'],
                'color':       item['area__color'],
                'total':       item['total'],
            }
            for item in resumen
        ])

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None):
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
        from django.db.models import Count, Avg
        from candidatos.models import Candidato

        return Response({
            'vacantes': {
                'total':    Vacante.objects.count(),
                'abiertas': Vacante.objects.filter(estado='abierta').count(),
                'por_area': list(
                    Vacante.objects
                    .values('area__nombre', 'area__color', 'area__codigo_corto')
                    .annotate(total=Count('id'))
                    .order_by('-total')[:8]
                ),
            },
            'candidatos': {
                'total':    Candidato.objects.count(),
                'activos':  Candidato.objects.exclude(
                    estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']
                ).count(),
                'finalistas': Candidato.objects.filter(es_finalista=True).count(),
                'score_promedio': Candidato.objects.filter(
                    score_final__isnull=False
                ).aggregate(avg=Avg('score_final'))['avg'],
            },
        })
