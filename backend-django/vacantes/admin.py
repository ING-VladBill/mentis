from django.contrib import admin
from .models import Vacante

@admin.register(Vacante)
class VacanteAdmin(admin.ModelAdmin):
    list_display    = ['codigo', 'titulo', 'area', 'nivel_experiencia', 'estado', 'prioridad', 'fecha_creacion']
    list_filter     = ['area', 'estado', 'prioridad', 'nivel_experiencia', 'modalidad']
    search_fields   = ['codigo', 'titulo', 'descripcion']
    ordering        = ['-fecha_creacion']
    readonly_fields = ['codigo', 'fecha_creacion', 'fecha_modificacion']

    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'titulo', 'area', 'departamento', 'industria')
        }),
        ('Descripción', {
            'fields': ('descripcion', 'responsabilidades', 'requisitos', 'requisitos_deseables', 'beneficios')
        }),
        ('Habilidades', {
            'fields': ('habilidades', 'tecnologias', 'conocimientos_especificos')
        }),
        ('Nivel y Experiencia', {
            'fields': ('nivel_experiencia', 'anios_experiencia', 'nivel_educativo', 'carrera_afin')
        }),
        ('Condiciones', {
            'fields': ('modalidad', 'tipo_contrato', 'ciudad', 'pais', 'ubicacion')
        }),
        ('Salario', {
            'fields': ('salario_minimo', 'salario_maximo', 'moneda', 'mostrar_salario')
        }),
        ('Estado', {
            'fields': ('estado', 'prioridad', 'fecha_publicacion', 'fecha_cierre')
        }),
        ('Configuración IA', {
            'fields': ('score_cv_minimo', 'nota_minima_examen', 'top_candidatos_finalistas')
        }),
        ('Auditoría', {
            'fields': ('creado_por', 'fecha_creacion', 'fecha_modificacion')
        }),
    )