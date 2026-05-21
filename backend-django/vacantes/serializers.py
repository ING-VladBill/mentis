# ==========================================
# vacantes/serializers.py - ACTUALIZADO
# ==========================================

from rest_framework import serializers
from .models import Area, Vacante


class AreaSerializer(serializers.ModelSerializer):
    """Serializer completo para áreas."""
    total_vacantes   = serializers.ReadOnlyField()
    vacantes_abiertas = serializers.ReadOnlyField()

    class Meta:
        model  = Area
        fields = [
            'id', 'nombre', 'codigo_corto', 'descripcion',
            'icono', 'color', 'activa', 'es_predefinida', 'orden',
            'total_vacantes', 'vacantes_abiertas',
            'fecha_creacion',
        ]
        read_only_fields = ['es_predefinida', 'fecha_creacion']

    def validate_codigo_corto(self, value):
        return value.upper()


class AreaSimpleSerializer(serializers.ModelSerializer):
    """Serializer compacto para usar en dropdowns del frontend."""
    class Meta:
        model  = Area
        fields = ['id', 'nombre', 'codigo_corto', 'icono', 'color', 'activa']


class VacanteListSerializer(serializers.ModelSerializer):
    area_nombre         = serializers.CharField(source='area.nombre', read_only=True)
    area_codigo         = serializers.CharField(source='area.codigo_corto', read_only=True)
    area_color          = serializers.CharField(source='area.color', read_only=True)
    area_icono          = serializers.CharField(source='area.icono', read_only=True)
    nivel_display       = serializers.CharField(source='get_nivel_experiencia_display', read_only=True)
    estado_display      = serializers.CharField(source='get_estado_display', read_only=True)
    total_candidatos    = serializers.ReadOnlyField()
    candidatos_activos  = serializers.ReadOnlyField()
    creado_por_nombre   = serializers.CharField(source='creado_por.nombre_completo', read_only=True)

    class Meta:
        model  = Vacante
        fields = [
            'id', 'codigo', 'titulo',
            'area', 'area_nombre', 'area_codigo', 'area_color', 'area_icono',
            'nivel_experiencia', 'nivel_display',
            'modalidad', 'ciudad',
            'estado', 'estado_display', 'prioridad',
            'total_candidatos', 'candidatos_activos',
            'creado_por_nombre', 'fecha_creacion',
            'nota_minima_examen', 'top_candidatos_finalistas',
        ]


class VacanteDetalleSerializer(serializers.ModelSerializer):
    area_detalle  = AreaSimpleSerializer(source='area', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_experiencia_display', read_only=True)
    total_candidatos = serializers.ReadOnlyField()

    class Meta:
        model  = Vacante
        fields = '__all__'
        read_only_fields = ['codigo', 'fecha_creacion', 'fecha_modificacion']


class VacanteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear y editar vacantes."""

    class Meta:
        model  = Vacante
        exclude = ['codigo', 'creado_por', 'fecha_creacion', 'fecha_modificacion']

    def validate_area(self, value):
        if not value.activa:
            raise serializers.ValidationError(
                f'El área "{value.nombre}" está inactiva. Selecciona otra área.'
            )
        return value

    def validate_nota_minima_examen(self, value):
        if value < 0 or value > 20:
            raise serializers.ValidationError('La nota mínima debe estar entre 0 y 20.')
        return value

    def validate_score_cv_minimo(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('El score mínimo del CV debe estar entre 0 y 100.')
        return value
