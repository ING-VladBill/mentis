# ==========================================
# candidatos/serializers.py (Sprint 2 - completo)
# ==========================================

from rest_framework import serializers
from candidatos.models import Candidato, TokenAcceso, NotaCandidato, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ['id', 'nombre', 'color']


class NotaCandidatoSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.CharField(source='autor.nombre_completo', read_only=True)

    class Meta:
        model  = NotaCandidato
        fields = ['id', 'contenido', 'autor', 'autor_nombre', 'fecha', 'editado', 'fecha_edicion']
        read_only_fields = ['autor', 'fecha', 'editado', 'fecha_edicion']


class CandidatoListSerializer(serializers.ModelSerializer):
    nombre_completo      = serializers.ReadOnlyField()
    vacante_titulo       = serializers.CharField(source='vacante.titulo', read_only=True)
    vacante_area         = serializers.CharField(source='vacante.area.nombre', read_only=True)
    vacante_area_codigo  = serializers.CharField(source='vacante.area.codigo_corto', read_only=True)
    estado_display       = serializers.CharField(source='get_estado_display', read_only=True)
    source_display       = serializers.CharField(source='get_source_display', read_only=True)
    clasificacion_display = serializers.CharField(source='get_clasificacion_ia_display', read_only=True)
    tags                 = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Candidato
        fields = [
            'id', 'nombre_completo', 'email', 'telefono',
            'vacante', 'vacante_titulo', 'vacante_area', 'vacante_area_codigo',
            'estado', 'estado_display', 'source', 'source_display',
            'score_cv', 'score_examen', 'score_entrevista', 'score_final',
            'clasificacion_ia', 'clasificacion_display',
            'match_porcentaje', 'posicion_ranking', 'es_finalista',
            'pretension_salarial', 'disponibilidad',
            'tags', 'fecha_postulacion',
        ]


class CandidatoDetalleSerializer(serializers.ModelSerializer):
    nombre_completo  = serializers.ReadOnlyField()
    estado_display   = serializers.CharField(source='get_estado_display', read_only=True)
    vacante_titulo   = serializers.CharField(source='vacante.titulo', read_only=True)
    vacante_area     = serializers.CharField(source='vacante.area.nombre', read_only=True)
    tags             = TagSerializer(many=True, read_only=True)
    notas            = NotaCandidatoSerializer(many=True, read_only=True)

    class Meta:
        model  = Candidato
        fields = '__all__'
        read_only_fields = [
            'score_cv', 'score_examen', 'score_entrevista', 'score_final',
            'clasificacion_ia', 'resumen_cv', 'habilidades_detectadas',
            'habilidades_faltantes', 'inconsistencias_cv', 'analisis_detallado',
            'cv_analizado', 'fecha_analisis_cv', 'posicion_ranking',
        ]


class CandidatoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Candidato
        fields = [
            'vacante', 'nombre', 'apellido_paterno', 'apellido_materno',
            'email', 'telefono', 'ciudad', 'linkedin',
            'nivel_educativo', 'carrera', 'anios_experiencia',
            'cv', 'habilidades_declaradas',
            'pretension_salarial', 'disponibilidad', 'source',
        ]

    def validate(self, data):
        vacante = data.get('vacante')
        email   = data.get('email')
        if vacante and email:
            if Candidato.objects.filter(vacante=vacante, email=email).exists():
                raise serializers.ValidationError({'email': 'Ya existe un candidato con este email para esta vacante.'})
        return data


class CandidatoRankingSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model  = Candidato
        fields = [
            'id', 'nombre_completo', 'email',
            'score_cv', 'score_examen', 'score_entrevista', 'score_final',
            'clasificacion_ia', 'posicion_ranking', 'es_finalista',
            'estado', 'match_porcentaje', 'pretension_salarial',
        ]
