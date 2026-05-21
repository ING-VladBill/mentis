# ==========================================
# vacantes/models.py (Sprint 2 - actualizado)
# ==========================================

from django.db import models
from django.conf import settings


class Vacante(models.Model):

    # ------------------------------------------
    # ÁREA Y CATEGORIZACIÓN (NUEVO Sprint 2)
    # ------------------------------------------
    AREA_CHOICES = [
        ('tecnologia',       'Tecnología / IT'),
        ('ventas',           'Ventas / Comercial'),
        ('marketing',        'Marketing / Digital'),
        ('rrhh',             'Recursos Humanos'),
        ('finanzas',         'Finanzas / Contabilidad'),
        ('legal',            'Legal / Compliance'),
        ('operaciones',      'Operaciones'),
        ('atencion_cliente', 'Atención al Cliente'),
        ('administracion',   'Administración'),
        ('salud',            'Salud / Medicina'),
        ('educacion',        'Educación / Docencia'),
        ('diseno',           'Diseño / UX'),
        ('produccion',       'Producción / Manufactura'),
        ('logistica',        'Logística / Supply Chain'),
        ('investigacion',    'I+D / Investigación'),
        ('otro',             'Otro'),
    ]

    INDUSTRIA_CHOICES = [
        ('software',      'Software / SaaS'),
        ('banca',         'Banca y Finanzas'),
        ('retail',        'Retail / Comercio'),
        ('salud',         'Salud / Farmacia'),
        ('educacion',     'Educación'),
        ('manufactura',   'Manufactura / Industrial'),
        ('servicios',     'Servicios Profesionales'),
        ('gobierno',      'Gobierno / Sector Público'),
        ('telecomunicaciones', 'Telecomunicaciones'),
        ('construccion',  'Construcción / Inmobiliaria'),
        ('agricultura',   'Agricultura / Agroindustria'),
        ('ong',           'ONG / Sin fines de lucro'),
        ('otro',          'Otro'),
    ]

    NIVEL_CHOICES = [
        ('practicante', 'Practicante / Intern'),
        ('junior',      'Junior (0-2 años)'),
        ('semi_senior', 'Semi-Senior (2-4 años)'),
        ('senior',      'Senior (4+ años)'),
        ('lider',       'Líder / Tech Lead'),
        ('gerencial',   'Gerencial / C-Level'),
    ]

    MODALIDAD_CHOICES = [
        ('presencial', 'Presencial'),
        ('remoto',     'Remoto'),
        ('hibrido',    'Híbrido'),
    ]

    TIPO_CONTRATO_CHOICES = [
        ('indefinido',   'Contrato indefinido'),
        ('plazo_fijo',   'Plazo fijo'),
        ('por_obra',     'Por obra o servicio'),
        ('practicas',    'Prácticas profesionales'),
        ('freelance',    'Freelance / Honorarios'),
        ('part_time',    'Part-time'),
    ]

    ESTADO_CHOICES = [
        ('borrador',   'Borrador'),
        ('abierta',    'Abierta'),
        ('en_proceso', 'En proceso de selección'),
        ('pausada',    'Pausada'),
        ('cerrada',    'Cerrada'),
        ('cancelada',  'Cancelada'),
    ]

    PRIORIDAD_CHOICES = [
        ('baja',   'Baja'),
        ('media',  'Media'),
        ('alta',   'Alta'),
        ('urgente','Urgente'),
    ]

    # ------------------------------------------
    # IDENTIFICACIÓN
    # ------------------------------------------
    codigo         = models.CharField(max_length=20, unique=True, help_text='Ej: VAC-2025-001')
    titulo         = models.CharField(max_length=200)
    area           = models.CharField(max_length=30, choices=AREA_CHOICES)
    departamento   = models.CharField(max_length=100, blank=True, help_text='Departamento interno de la empresa')
    industria      = models.CharField(max_length=30, choices=INDUSTRIA_CHOICES, default='otro')

    # ------------------------------------------
    # DESCRIPCIÓN DEL PUESTO
    # ------------------------------------------
    descripcion            = models.TextField()
    responsabilidades      = models.TextField(blank=True)
    requisitos             = models.TextField(help_text='Requisitos obligatorios del puesto')
    requisitos_deseables   = models.TextField(blank=True, help_text='Requisitos deseables (no excluyentes)')

    # ------------------------------------------
    # HABILIDADES Y CONOCIMIENTOS
    # ------------------------------------------
    habilidades             = models.TextField(help_text='Habilidades requeridas separadas por coma')
    tecnologias             = models.TextField(blank=True, help_text='Tecnologías/herramientas (puede estar vacío para áreas no técnicas)')
    conocimientos_especificos = models.TextField(blank=True, help_text='Conocimientos teóricos específicos del puesto para el examen IA')

    # ------------------------------------------
    # EXPERIENCIA Y NIVEL
    # ------------------------------------------
    nivel_experiencia   = models.CharField(max_length=20, choices=NIVEL_CHOICES, default='semi_senior')
    anios_experiencia   = models.IntegerField(default=0, help_text='Años mínimos de experiencia')
    nivel_educativo     = models.CharField(max_length=100, blank=True, help_text='Ej: Universitario completo, Técnico, Maestría')
    carrera_afin        = models.CharField(max_length=200, blank=True, help_text='Carreras afines al puesto')

    # ------------------------------------------
    # CONDICIONES LABORALES
    # ------------------------------------------
    modalidad       = models.CharField(max_length=20, choices=MODALIDAD_CHOICES, default='presencial')
    tipo_contrato   = models.CharField(max_length=20, choices=TIPO_CONTRATO_CHOICES, default='indefinido')
    ubicacion       = models.CharField(max_length=200, blank=True)
    ciudad          = models.CharField(max_length=100, default='Lima')
    pais            = models.CharField(max_length=100, default='Perú')
    salario_minimo  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salario_maximo  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    moneda          = models.CharField(max_length=10, default='PEN')
    mostrar_salario = models.BooleanField(default=False)
    beneficios      = models.TextField(blank=True)

    # ------------------------------------------
    # ESTADO Y PRIORIDAD
    # ------------------------------------------
    estado    = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')

    # ------------------------------------------
    # CONFIGURACIÓN DEL PROCESO IA (NUEVO Sprint 2)
    # ------------------------------------------
    nota_minima_examen       = models.DecimalField(
        max_digits=4, decimal_places=2, default=13.00,
        help_text='Nota mínima para aprobar el examen teórico (escala 0-20)'
    )
    top_candidatos_finalistas = models.IntegerField(
        default=5,
        help_text='Cantidad de candidatos que pasan a entrevista presencial con RRHH'
    )
    score_cv_minimo = models.IntegerField(
        default=60,
        help_text='Score mínimo del CV para avanzar al examen (0-100)'
    )

    # ------------------------------------------
    # AUDITORÍA
    # ------------------------------------------
    creado_por         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='vacantes_creadas'
    )
    fecha_creacion     = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    fecha_publicacion  = models.DateTimeField(null=True, blank=True)
    fecha_cierre       = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table   = 'vacantes'
        verbose_name = 'Vacante'
        verbose_name_plural = 'Vacantes'
        ordering   = ['-fecha_creacion']

    def __str__(self):
        return f'[{self.codigo}] {self.titulo} - {self.get_area_display()}'

    def save(self, *args, **kwargs):
        # Auto-generar código si no tiene
        if not self.codigo:
            from django.utils import timezone
            año = timezone.now().year
            ultimo = Vacante.objects.filter(
                codigo__startswith=f'VAC-{año}-'
            ).order_by('-codigo').first()
            if ultimo:
                num = int(ultimo.codigo.split('-')[-1]) + 1
            else:
                num = 1
            self.codigo = f'VAC-{año}-{num:03d}'
        super().save(*args, **kwargs)

    @property
    def total_candidatos(self):
        return self.candidatos.count()

    @property
    def candidatos_activos(self):
        return self.candidatos.exclude(
            estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']
        ).count()
