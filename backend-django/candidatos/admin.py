from django.contrib import admin
from .models import Candidato

@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'email', 'vacante', 'estado', 'score_final', 'fecha_registro']
    list_filter = ['estado', 'clasificacion_ia', 'nivel_educacion', 'fuente', 'vacante']
    search_fields = ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'numero_documento']
    readonly_fields = ['fecha_registro', 'fecha_actualizacion', 'nombre_completo']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'apellido_paterno', 'apellido_materno', 'tipo_documento', 
                      'numero_documento', 'fecha_nacimiento', 'genero')
        }),
        ('Contacto', {
            'fields': ('email', 'telefono', 'telefono_alternativo')
        }),
        ('Ubicación', {
            'fields': ('pais', 'ciudad', 'direccion')
        }),
        ('Educación y Experiencia', {
            'fields': ('nivel_educacion', 'institucion_educativa', 'carrera', 'años_experiencia')
        }),
        ('Redes Sociales', {
            'fields': ('linkedin_url', 'github_url', 'portfolio_url')
        }),
        ('Documentos', {
            'fields': ('cv', 'carta_presentacion')
        }),
        ('Postulación', {
            'fields': ('vacante', 'fuente', 'estado')
        }),
        ('Análisis IA', {
            'fields': ('cv_analizado', 'resumen_cv', 'score_cv', 'clasificacion_ia', 'observaciones_ia'),
            'classes': ('collapse',)
        }),
        ('Evaluaciones', {
            'fields': ('score_tecnico', 'fecha_evaluacion_tecnica', 'score_entrevista', 
                      'fecha_entrevista_ia', 'feedback_entrevista'),
            'classes': ('collapse',)
        }),
        ('Score Final', {
            'fields': ('score_final',)
        }),
        ('Observaciones RRHH', {
            'fields': ('observaciones_rrhh', 'motivo_rechazo')
        }),
        ('Fechas', {
            'fields': ('fecha_registro', 'fecha_actualizacion')
        }),
    )
    
    actions = ['marcar_como_aprobado', 'marcar_como_rechazado']
    
    def marcar_como_aprobado(self, request, queryset):
        queryset.update(estado='aprobado')
    marcar_como_aprobado.short_description = "Marcar seleccionados como Aprobado"
    
    def marcar_como_rechazado(self, request, queryset):
        queryset.update(estado='rechazado')
    marcar_como_rechazado.short_description = "Marcar seleccionados como Rechazado"