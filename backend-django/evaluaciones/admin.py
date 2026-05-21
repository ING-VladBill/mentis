from django.contrib import admin
from evaluaciones.models import Examen, PreguntaExamen, RespuestaExamen, EntrevistaIA, PreguntaEntrevista


class PreguntaExamenInline(admin.TabularInline):
    model = PreguntaExamen
    extra = 0
    readonly_fields = ['categoria', 'tipo', 'enunciado', 'respuesta_correcta', 'puntos']


class RespuestaExamenInline(admin.TabularInline):
    model = RespuestaExamen
    extra = 0
    readonly_fields = ['pregunta', 'respuesta_seleccionada', 'respuesta_texto', 'puntaje', 'feedback_ia']


@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display  = ['candidato', 'vacante', 'estado', 'nota_obtenida', 'aprobado', 'fecha_generacion']
    list_filter   = ['estado', 'aprobado']
    inlines       = [PreguntaExamenInline]
    readonly_fields = ['fecha_generacion', 'nota_obtenida', 'aprobado']


@admin.register(EntrevistaIA)
class EntrevistaIAAdmin(admin.ModelAdmin):
    list_display = ['candidato', 'estado', 'nota_final', 'modalidad', 'fecha_creacion']
    list_filter  = ['estado', 'modalidad']
    readonly_fields = ['nota_final', 'dim_claridad', 'dim_coherencia', 'dim_precision',
                       'dim_comunicacion', 'dim_seguridad']
