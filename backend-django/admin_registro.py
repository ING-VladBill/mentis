# ==========================================
# usuarios/admin.py
# ==========================================

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Empresa


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display  = ['email', 'nombre', 'apellidos', 'rol', 'is_active', 'ultimo_login']
    list_filter   = ['rol', 'is_active']
    search_fields = ['email', 'nombre', 'apellidos']
    ordering      = ['apellidos']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('nombre', 'apellidos', 'telefono', 'foto')}),
        ('Rol y área', {'fields': ('rol', 'area_responsable')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('ultimo_login', 'fecha_creacion')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'apellidos', 'rol', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['fecha_creacion', 'ultimo_login']


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'ruc', 'sector']


# ==========================================
# vacantes/admin.py
# ==========================================

from django.contrib import admin
from vacantes.models import Vacante


@admin.register(Vacante)
class VacanteAdmin(admin.ModelAdmin):
    list_display  = ['codigo', 'titulo', 'area', 'nivel_experiencia', 'estado', 'prioridad', 'fecha_creacion']
    list_filter   = ['area', 'estado', 'prioridad', 'nivel_experiencia', 'modalidad']
    search_fields = ['codigo', 'titulo', 'descripcion']
    ordering      = ['-fecha_creacion']
    readonly_fields = ['codigo', 'fecha_creacion', 'fecha_modificacion']

    fieldsets = (
        ('Identificación', {'fields': ('codigo', 'titulo', 'area', 'departamento', 'industria')}),
        ('Descripción', {'fields': ('descripcion', 'responsabilidades', 'requisitos', 'requisitos_deseables')}),
        ('Habilidades', {'fields': ('habilidades', 'tecnologias', 'conocimientos_especificos')}),
        ('Nivel', {'fields': ('nivel_experiencia', 'anios_experiencia', 'nivel_educativo', 'carrera_afin')}),
        ('Condiciones', {'fields': ('modalidad', 'tipo_contrato', 'ubicacion', 'ciudad', 'salario_minimo', 'salario_maximo', 'moneda', 'mostrar_salario', 'beneficios')}),
        ('Estado', {'fields': ('estado', 'prioridad')}),
        ('Configuración IA', {'fields': ('score_cv_minimo', 'nota_minima_examen', 'top_candidatos_finalistas')}),
        ('Auditoría', {'fields': ('creado_por', 'fecha_creacion', 'fecha_modificacion', 'fecha_publicacion', 'fecha_cierre')}),
    )


# ==========================================
# candidatos/admin.py
# ==========================================

from django.contrib import admin
from candidatos.models import Candidato, TokenAcceso


@admin.register(Candidato)
class CandidatoAdmin(admin.ModelAdmin):
    list_display  = ['nombre_completo', 'email', 'vacante', 'estado', 'score_cv', 'score_final', 'es_finalista']
    list_filter   = ['estado', 'clasificacion_ia', 'es_finalista', 'cv_analizado']
    search_fields = ['nombre', 'apellido_paterno', 'email']
    ordering      = ['-score_final', '-fecha_postulacion']
    readonly_fields = [
        'cv_texto_extraido', 'score_cv', 'score_examen', 'score_entrevista', 'score_final',
        'clasificacion_ia', 'resumen_cv', 'habilidades_detectadas', 'habilidades_faltantes',
        'inconsistencias_cv', 'analisis_detallado', 'posicion_ranking', 'fecha_postulacion',
    ]


@admin.register(TokenAcceso)
class TokenAccesoAdmin(admin.ModelAdmin):
    list_display = ['candidato', 'tipo', 'usado', 'fecha_creacion', 'fecha_expiracion']
    list_filter  = ['tipo', 'usado']
    readonly_fields = ['token', 'fecha_creacion', 'fecha_uso']


# ==========================================
# evaluaciones/admin.py
# ==========================================

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
