from django.contrib import admin
from evaluaciones.models import Examen, PreguntaExamen, EventoAuditoria, EntrevistaIA


class PreguntaExamenInline(admin.TabularInline):
    model = PreguntaExamen
    extra = 0
    readonly_fields = ['orden', 'categoria', 'tipo', 'enunciado', 'puntos', 'puntos_obtenidos', 'es_correcta']


class EventoAuditoriaInline(admin.TabularInline):
    model = EventoAuditoria
    extra = 0
    readonly_fields = ['tipo', 'severidad', 'detalle', 'timestamp']


@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display    = ['candidato', 'vacante', 'estado', 'nota', 'aprobado', 'fecha_generacion']
    list_filter     = ['estado', 'aprobado']
    inlines         = [PreguntaExamenInline, EventoAuditoriaInline]
    readonly_fields = ['fecha_generacion', 'fecha_inicio', 'fecha_fin', 'nota', 'aprobado']


@admin.register(EntrevistaIA)
class EntrevistaIAAdmin(admin.ModelAdmin):
    list_display  = ['candidato', 'estado', 'nota', 'fecha_inicio']
    list_filter   = ['estado']
    readonly_fields = ['nota', 'fecha_inicio', 'fecha_fin']