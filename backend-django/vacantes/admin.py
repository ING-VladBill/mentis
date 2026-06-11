from django.contrib import admin
from .models import Vacante

@admin.register(Vacante)
class VacanteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'titulo', 'area', 'nivel_experiencia', 'estado', 'fecha_creacion']
    list_filter = ['estado', 'nivel_experiencia', 'modalidad', 'area']
    search_fields = ['titulo', 'codigo', 'area', 'tecnologias']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'titulo', 'area', 'departamento')
        }),
        ('Descripción', {
            'fields': ('descripcion', 'requisitos', 'responsabilidades', 'beneficios')
        }),
        ('Habilidades', {
            'fields': ('habilidades', 'tecnologias', 'idiomas')
        }),
        ('Detalles del Puesto', {
            'fields': ('nivel_experiencia', 'modalidad', 'tipo_contrato', 'numero_vacantes', 'prioridad')
        }),
        ('Ubicación', {
            'fields': ('pais', 'ciudad', 'direccion')
        }),
        ('Salario', {
            'fields': ('salario_minimo', 'salario_maximo', 'moneda')
        }),
        ('Estado y Fechas', {
            'fields': ('estado', 'fecha_cierre', 'fecha_creacion', 'fecha_actualizacion')
        }),
        ('Auditoría', {
            'fields': ('creado_por',)
        }),
    )