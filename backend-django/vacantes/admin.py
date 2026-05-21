from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import Area, Vacante


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_corto', 'nombre', 'color_preview',
        'total_vacantes', 'vacantes_abiertas',
        'activa', 'es_predefinida', 'orden'
    ]
    list_filter   = ['activa', 'es_predefinida']
    search_fields = ['nombre', 'codigo_corto', 'descripcion']
    ordering      = ['orden', 'nombre']
    readonly_fields = ['fecha_creacion', 'fecha_modificacion', 'creada_por', 'color_preview']

    fieldsets = (
        ('Identificación', {
            'fields': ('nombre', 'codigo_corto', 'descripcion')
        }),
        ('Apariencia', {
            'fields': ('icono', 'color', 'color_preview', 'orden')
        }),
        ('Configuración IA', {
            'fields': ('instruccion_ia',),
            'description': 'Instrucción que la IA usará al generar exámenes para vacantes de esta área.',
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('activa', 'es_predefinida')
        }),
        ('Auditoría', {
            'fields': ('creada_por', 'fecha_creacion', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
    )

    actions = ['activar_areas', 'desactivar_areas']

    def color_preview(self, obj):
        return format_html(
            '<div style="width:24px;height:24px;border-radius:50%;'
            'background:{};display:inline-block;border:1px solid #ccc;"></div> {}',
            obj.color, obj.color
        )
    color_preview.short_description = 'Color'

    def total_vacantes(self, obj):
        return obj.total_vacantes
    total_vacantes.short_description = 'Total vacantes'

    def vacantes_abiertas(self, obj):
        count = obj.vacantes_abiertas
        color = 'green' if count > 0 else 'gray'
        return format_html('<span style="color:{};font-weight:bold;">{}</span>', color, count)
    vacantes_abiertas.short_description = 'Abiertas'

    def activar_areas(self, request, queryset):
        queryset.update(activa=True)
        self.message_user(request, f'{queryset.count()} áreas activadas.')
    activar_areas.short_description = 'Activar áreas seleccionadas'

    def desactivar_areas(self, request, queryset):
        # No desactivar predefinidas
        predefinidas = queryset.filter(es_predefinida=True).count()
        queryset.filter(es_predefinida=False).update(activa=False)
        msg = f'{queryset.filter(es_predefinida=False).count()} áreas desactivadas.'
        if predefinidas:
            msg += f' {predefinidas} áreas predefinidas no fueron modificadas.'
        self.message_user(request, msg)
    desactivar_areas.short_description = 'Desactivar áreas seleccionadas'

    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar áreas predefinidas
        if obj and obj.es_predefinida:
            return False
        return super().has_delete_permission(request, obj)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.creada_por = request.user
        super().save_model(request, obj, form, change)


@admin.register(Vacante)
class VacanteAdmin(admin.ModelAdmin):
    list_display    = [
        'codigo', 'titulo', 'area', 'nivel_experiencia',
        'estado', 'prioridad', 'total_candidatos', 'fecha_creacion'
    ]
    list_filter     = ['area', 'estado', 'prioridad', 'nivel_experiencia', 'modalidad']
    search_fields   = ['codigo', 'titulo', 'descripcion']
    ordering        = ['-fecha_creacion']
    readonly_fields = ['codigo', 'fecha_creacion', 'fecha_modificacion', 'total_candidatos']

    fieldsets = (
        ('Identificación', {
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
            'fields': ('score_cv_minimo', 'nota_minima_examen', 'top_candidatos_finalistas'),
            'description': 'Parámetros que controlan el proceso de selección automatizado.'
        }),
        ('Auditoría', {
            'fields': ('creado_por', 'total_candidatos', 'fecha_creacion', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
    )

    actions = ['abrir_vacantes', 'pausar_vacantes', 'cerrar_vacantes']

    def total_candidatos(self, obj):
        return obj.total_candidatos
    total_candidatos.short_description = 'Candidatos'

    def abrir_vacantes(self, request, queryset):
        queryset.update(estado='abierta')
        self.message_user(request, f'{queryset.count()} vacantes abiertas.')
    abrir_vacantes.short_description = 'Abrir vacantes seleccionadas'

    def pausar_vacantes(self, request, queryset):
        queryset.update(estado='pausada')
        self.message_user(request, f'{queryset.count()} vacantes pausadas.')
    pausar_vacantes.short_description = 'Pausar vacantes seleccionadas'

    def cerrar_vacantes(self, request, queryset):
        from django.utils import timezone
        queryset.update(estado='cerrada', fecha_cierre=timezone.now())
        self.message_user(request, f'{queryset.count()} vacantes cerradas.')
    cerrar_vacantes.short_description = 'Cerrar vacantes seleccionadas'

    def save_model(self, request, obj, form, change):
        if not change:
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)
