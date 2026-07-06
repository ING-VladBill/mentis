# ==========================================
# evaluaciones/serializers.py (Sprint 3 - RRHH)
# ==========================================

import json
from rest_framework import serializers
from .models import Examen, PreguntaExamen, EventoAuditoria, EntrevistaIA


class PreguntaExamenSerializer(serializers.ModelSerializer):
    """Detalle de cada pregunta, para que RRHH vea qué respondió el candidato."""
    opciones_lista = serializers.SerializerMethodField()

    class Meta:
        model = PreguntaExamen
        fields = [
            'id', 'orden', 'tipo', 'categoria', 'enunciado',
            'opciones_lista', 'respuesta_correcta', 'respuesta_candidato',
            'es_correcta', 'puntos', 'puntos_obtenidos', 'feedback_ia',
            'respondida_en',
        ]

    def get_opciones_lista(self, obj):
        try:
            return json.loads(obj.opciones) if obj.opciones else []
        except (json.JSONDecodeError, TypeError):
            return []


class ExamenDetalleSerializer(serializers.ModelSerializer):
    """Examen calificado con todas sus preguntas. Vista completa para RRHH."""
    preguntas       = PreguntaExamenSerializer(many=True, read_only=True)
    candidato_nombre = serializers.CharField(source='candidato.nombre_completo', read_only=True)
    vacante_titulo   = serializers.CharField(source='vacante.titulo', read_only=True)
    nota_minima      = serializers.DecimalField(source='vacante.nota_minima_examen',
                                                max_digits=4, decimal_places=2, read_only=True)
    total_respondidas = serializers.SerializerMethodField()
    total_correctas   = serializers.SerializerMethodField()

    class Meta:
        model = Examen
        fields = [
            'id', 'estado', 'duracion_minutos', 'total_preguntas',
            'fecha_generacion', 'fecha_inicio', 'fecha_fin',
            'nota', 'aprobado', 'nota_minima',
            'candidato_nombre', 'vacante_titulo',
            'total_respondidas', 'total_correctas',
            'preguntas',
        ]

    def get_total_respondidas(self, obj):
        return obj.preguntas.filter(respondida_en__isnull=False).count()

    def get_total_correctas(self, obj):
        return obj.preguntas.filter(es_correcta=True).count()


class ExamenListaSerializer(serializers.ModelSerializer):
    """Versión resumida para listar exámenes."""
    candidato_nombre = serializers.CharField(source='candidato.nombre_completo', read_only=True)
    vacante_titulo   = serializers.CharField(source='vacante.titulo', read_only=True)

    class Meta:
        model = Examen
        fields = [
            'id', 'estado', 'nota', 'aprobado',
            'fecha_inicio', 'fecha_fin',
            'candidato_nombre', 'vacante_titulo',
        ]


class EventoAuditoriaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = EventoAuditoria
        fields = ['id', 'tipo', 'tipo_display', 'severidad', 'detalle', 'timestamp']
