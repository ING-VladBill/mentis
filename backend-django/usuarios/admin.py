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
