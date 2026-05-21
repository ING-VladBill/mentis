# ==========================================
# candidatos/serializers.py
# ==========================================

from rest_framework import serializers
from .models import Candidato, TokenAcceso


class CandidatoListSerializer(serializers.ModelSerializer):
    """Serializer compacto para listados."""
    nombre_completo = serializers.ReadOnlyField()
    vacante_titulo  = serializers.CharField(source='vacante.titulo', read_only=True)
    vacante_area    = serializers.CharField(source='vacante.get_area_display', read_only=True)
    estado_display  = serializers.CharField(source='get_estado_display', read_only=True)
    clasificacion_display = serializers.CharField(
        source='get_clasificacion_ia_display', read_only=True
    )

    class Meta:
        model = Candidato
        fields = [
            'id', 'nombre_completo', 'email', 'telefono',
            'vacante', 'vacante_titulo', 'vacante_area',
            'estado', 'estado_display',
            'score_cv', 'score_examen', 'score_entrevista', 'score_final',
            'clasificacion_ia', 'clasificacion_display',
            'match_porcentaje', 'posicion_ranking', 'es_finalista',
            'fecha_postulacion',
        ]


class CandidatoDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo para vista detalle."""
    nombre_completo = serializers.ReadOnlyField()
    estado_display  = serializers.CharField(source='get_estado_display', read_only=True)
    vacante_titulo  = serializers.CharField(source='vacante.titulo', read_only=True)
    vacante_area    = serializers.CharField(source='vacante.get_area_display', read_only=True)

    class Meta:
        model = Candidato
        fields = '__all__'
        read_only_fields = [
            'score_cv', 'score_examen', 'score_entrevista', 'score_final',
            'clasificacion_ia', 'resumen_cv', 'habilidades_detectadas',
            'habilidades_faltantes', 'inconsistencias_cv', 'analisis_detallado',
            'cv_analizado', 'fecha_analisis_cv', 'posicion_ranking',
        ]


class CandidatoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear candidatos manualmente."""

    class Meta:
        model = Candidato
        fields = [
            'vacante', 'nombre', 'apellido_paterno', 'apellido_materno',
            'email', 'telefono', 'ciudad', 'linkedin',
            'nivel_educativo', 'carrera', 'anios_experiencia',
            'cv', 'habilidades_declaradas',
        ]

    def validate(self, data):
        # Verificar que no exista el mismo email para la misma vacante
        vacante = data.get('vacante')
        email   = data.get('email')
        if vacante and email:
            if Candidato.objects.filter(vacante=vacante, email=email).exists():
                raise serializers.ValidationError(
                    {'email': 'Ya existe un candidato con este email para esta vacante.'}
                )
        return data


class CandidatoRankingSerializer(serializers.ModelSerializer):
    """Serializer para el ranking."""
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Candidato
        fields = [
            'id', 'nombre_completo', 'email',
            'score_cv', 'score_examen', 'score_entrevista', 'score_final',
            'clasificacion_ia', 'posicion_ranking', 'es_finalista',
            'estado', 'match_porcentaje',
        ]


# ==========================================
# vacantes/serializers.py
# ==========================================

from vacantes.models import Vacante


class VacanteListSerializer(serializers.ModelSerializer):
    """Serializer compacto para listados."""
    area_display        = serializers.CharField(source='get_area_display', read_only=True)
    nivel_display       = serializers.CharField(source='get_nivel_experiencia_display', read_only=True)
    estado_display      = serializers.CharField(source='get_estado_display', read_only=True)
    total_candidatos    = serializers.ReadOnlyField()
    candidatos_activos  = serializers.ReadOnlyField()
    creado_por_nombre   = serializers.CharField(source='creado_por.nombre_completo', read_only=True)

    class Meta:
        model = Vacante
        fields = [
            'id', 'codigo', 'titulo', 'area', 'area_display',
            'nivel_experiencia', 'nivel_display',
            'modalidad', 'ciudad',
            'estado', 'estado_display', 'prioridad',
            'total_candidatos', 'candidatos_activos',
            'creado_por_nombre', 'fecha_creacion',
            'nota_minima_examen', 'top_candidatos_finalistas',
        ]


class VacanteDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo."""
    area_display  = serializers.CharField(source='get_area_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_experiencia_display', read_only=True)
    total_candidatos = serializers.ReadOnlyField()

    class Meta:
        model = Vacante
        fields = '__all__'
        read_only_fields = ['codigo', 'fecha_creacion', 'fecha_modificacion']


class VacanteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/editar vacantes."""

    class Meta:
        model = Vacante
        exclude = ['codigo', 'creado_por', 'fecha_creacion', 'fecha_modificacion']

    def validate_nota_minima_examen(self, value):
        if value < 0 or value > 20:
            raise serializers.ValidationError('La nota mínima debe estar entre 0 y 20.')
        return value

    def validate_score_cv_minimo(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('El score mínimo del CV debe estar entre 0 y 100.')
        return value
