# ==========================================
# usuarios/models.py
# ==========================================

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('rol', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Usuario del sistema de administración (RRHH).
    Sustituye al User de Django con roles propios.
    """

    ROL_CHOICES = [
        ('admin',      'Administrador'),
        ('reclutador', 'Reclutador'),
        ('evaluador',  'Evaluador'),
        ('gerente',    'Gerente'),
    ]

    email            = models.EmailField(unique=True, verbose_name='Correo electrónico')
    nombre           = models.CharField(max_length=100)
    apellidos        = models.CharField(max_length=100)
    rol              = models.CharField(max_length=20, choices=ROL_CHOICES, default='reclutador')
    area_responsable = models.CharField(max_length=100, blank=True, help_text='Área de la empresa que gestiona')
    telefono         = models.CharField(max_length=20, blank=True)
    foto             = models.ImageField(upload_to='usuarios/fotos/', null=True, blank=True)

    # Django internos
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)

    fecha_creacion     = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    ultimo_login       = models.DateTimeField(null=True, blank=True)

    objects = UsuarioManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellidos']

    class Meta:
        db_table            = 'usuarios'
        verbose_name        = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering            = ['apellidos', 'nombre']

    def __str__(self):
        return f'{self.nombre} {self.apellidos} ({self.get_rol_display()})'

    @property
    def nombre_completo(self):
        return f'{self.nombre} {self.apellidos}'

    @property
    def es_admin(self):
        return self.rol == 'admin'

    @property
    def es_reclutador(self):
        return self.rol in ('admin', 'reclutador')

    @property
    def es_evaluador(self):
        return self.rol in ('admin', 'evaluador')

    @property
    def es_gerente(self):
        return self.rol in ('admin', 'gerente')


class Empresa(models.Model):
    """
    Configuración de la empresa (single-tenant para el MVP).
    Solo existe un registro en esta tabla.
    """
    nombre      = models.CharField(max_length=200)
    ruc         = models.CharField(max_length=11, blank=True)
    logo        = models.ImageField(upload_to='empresa/', null=True, blank=True)
    sector      = models.CharField(max_length=100, blank=True)
    descripcion = models.TextField(blank=True)

    # ------------------------------------------
    # PRESENCIA WEB (usados en feed Indeed y Google for Jobs)
    # ------------------------------------------
    sitio_web = models.URLField(
        blank=True,
        help_text='URL pública de la empresa. Ej: https://miempresa.com',
    )
    direccion = models.CharField(
        max_length=300,
        blank=True,
        help_text='Dirección física. Ej: Av. Javier Prado 1234, San Isidro, Lima',
    )

    # ------------------------------------------
    # CONFIGURACIÓN SMTP (override global)
    # ------------------------------------------
    smtp_host     = models.CharField(max_length=200, blank=True)
    smtp_port     = models.IntegerField(default=587)
    smtp_usuario  = models.EmailField(blank=True)
    smtp_password = models.CharField(max_length=200, blank=True)

    # ------------------------------------------
    # CONFIGURACIÓN DEL PROCESO DE SELECCIÓN
    # ------------------------------------------
    score_cv_minimo    = models.IntegerField(default=60, help_text='Score mínimo CV para avanzar (0-100)')
    nota_examen_minima = models.DecimalField(max_digits=4, decimal_places=2, default=13.00)
    top_finalistas     = models.IntegerField(default=5)

    fecha_creacion     = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table     = 'empresa'
        verbose_name = 'Empresa'

    def __str__(self):
        return self.nombre

    @classmethod
    def get_instancia(cls):
        """Devuelve la única instancia de la empresa (singleton)."""
        empresa, _ = cls.objects.get_or_create(id=1, defaults={'nombre': 'Mi Empresa'})
        return empresa