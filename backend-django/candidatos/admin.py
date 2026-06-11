from django.contrib import admin
from .models import Candidato, TokenAcceso


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display    = ['nombre_completo', 'email', 'vacante', 'estado', 'score_cv', 'score_final', 'es_finalista']
    list_filter     = ['estado', 'clasificacion_ia', 'es_finalista', 'cv_analizado', 'vacante']
    search_fields   = ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'numero_documento']
    ordering        = ['-score_final', '-fecha_postulacion']
    readonly_fields = [
        'nombre_completo', 'fecha_postulacion', 'fecha_modificacion',
        'cv_texto_extraido', 'score_cv', 'score_examen', 'score_entrevista', 'score_final',
        'clasificacion_ia', 'resumen_cv', 'habilidades_detectadas', 'habilidades_faltantes',
        'inconsistencias_cv', 'analisis_detallado', 'posicion_ranking',
    ]

    fieldsets = (
        ('Información Personal', {
            'fields': ('nombre', 'apellido_paterno', 'apellido_materno', 'tipo_documento',
                       'numero_documento', 'fecha_nacimiento', 'genero')
        }),
        ('Contacto', {
            'fields': ('email', 'telefono', 'ciudad', 'pais')
        }),
        ('Redes y Portfolio', {
            'fields': ('linkedin', 'github', 'portfolio')
        }),
        ('Educación y Experiencia', {
            'fields': ('nivel_educativo', 'carrera', 'universidad',
                       'anios_experiencia', 'cargo_actual', 'empresa_actual')
        }),
        ('Documentos', {
            'fields': ('cv', 'cv_texto_extraido')
        }),
        ('Postulación', {
            'fields': ('vacante', 'estado', 'es_finalista', 'usuario_cuenta')
        }),
        ('Análisis IA — CV', {
            'fields': (
                'cv_analizado', 'fecha_analisis_cv', 'score_cv', 'clasificacion_ia',
                'match_porcentaje', 'resumen_cv', 'habilidades_detectadas',
                'habilidades_faltantes', 'inconsistencias_cv',
            ),
            'classes': ('collapse',)
        }),
        ('Aprobación Manual', {
            'fields': ('aprobado_manualmente', 'aprobado_por', 'nota_aprobacion'),
            'classes': ('collapse',)
        }),
        ('Evaluaciones', {
            'fields': (
                'score_examen', 'examen_aprobado', 'fecha_examen',
                'score_entrevista', 'fecha_entrevista',
                'dimension_claridad', 'dimension_coherencia', 'dimension_precision',
                'dimension_comunicacion', 'dimension_seguridad',
                'feedback_entrevista',
            ),
            'classes': ('collapse',)
        }),
        ('Score Final', {
            'fields': ('score_final', 'posicion_ranking')
        }),
        ('Observaciones RRHH', {
            'fields': ('observaciones_rrhh',)
        }),
        ('Auditoría', {
            'fields': ('registrado_por', 'fecha_postulacion', 'fecha_modificacion')
        }),
    )

    actions = ['marcar_cv_aprobado', 'marcar_como_finalista', 'marcar_como_descartado']

    def marcar_cv_aprobado(self, request, queryset):
        queryset.update(estado='cv_aprobado')
    marcar_cv_aprobado.short_description = 'Marcar CV como aprobado'

    def marcar_como_finalista(self, request, queryset):
        queryset.update(estado='finalista', es_finalista=True)
    marcar_como_finalista.short_description = 'Marcar como finalista'

    def marcar_como_descartado(self, request, queryset):
        queryset.update(estado='descartado')
    marcar_como_descartado.short_description = 'Marcar como descartado'


@admin.register(TokenAcceso)
class TokenAccesoAdmin(admin.ModelAdmin):
    list_display    = ['candidato', 'tipo', 'usado', 'fecha_creacion', 'fecha_expiracion']
    list_filter     = ['tipo', 'usado']
    readonly_fields = ['token', 'fecha_creacion', 'fecha_uso']