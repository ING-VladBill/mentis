# ==========================================
# vacantes/models.py - COMPLETO Y ACTUALIZADO
# Area + Vacante con código dinámico
# ==========================================

from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator


class Area(models.Model):
    """
    Áreas/Departamentos de la empresa.
    Configurable por el administrador desde el panel.
    """

    ICONO_CHOICES = [
        ('monitor',     '💻 Tecnología'),
        ('trending-up', '📈 Ventas'),
        ('megaphone',   '📣 Marketing'),
        ('users',       '👥 Recursos Humanos'),
        ('dollar-sign', '💰 Finanzas'),
        ('briefcase',   '⚖️ Legal'),
        ('settings',    '⚙️ Operaciones'),
        ('headphones',  '🎧 Atención al Cliente'),
        ('clipboard',   '📋 Administración'),
        ('heart',       '❤️ Salud'),
        ('book-open',   '📚 Educación'),
        ('pen-tool',    '🎨 Diseño'),
        ('package',     '📦 Producción'),
        ('truck',       '🚚 Logística'),
        ('flask',       '🔬 Investigación'),
        ('star',        '⭐ Otro'),
    ]

    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre del área'
    )
    codigo_corto = models.CharField(
        max_length=10,
        unique=True,
        verbose_name='Código corto',
        help_text='Máximo 10 caracteres, solo letras mayúsculas y números. Ej: TI, VEN, MKT',
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9]+$',
                message='Solo letras mayúsculas y números. Sin espacios ni caracteres especiales.'
            )
        ]
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción del área y sus funciones dentro de la empresa'
    )
    icono = models.CharField(
        max_length=50,
        default='star',
        verbose_name='Ícono'
    )
    color = models.CharField(
        max_length=7,
        default='#2E75B6',
        verbose_name='Color (hex)',
        help_text='Formato hexadecimal. Ej: #2E75B6',
        validators=[
            RegexValidator(
                regex=r'^#[0-9A-Fa-f]{6}$',
                message='Formato inválido. Use formato hexadecimal. Ej: #2E75B6'
            )
        ]
    )
    instruccion_ia = models.TextField(
        blank=True,
        verbose_name='Instrucción para IA',
        help_text=(
            'Instrucción que la IA usará al generar exámenes y entrevistas para esta área. '
            'Si se deja vacío, el sistema usará una instrucción genérica.'
        )
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa',
        help_text='Las áreas inactivas no aparecen al crear nuevas vacantes'
    )
    es_predefinida = models.BooleanField(
        default=False,
        verbose_name='Predefinida por el sistema',
        help_text='Las áreas predefinidas del sistema no pueden eliminarse'
    )
    orden = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Menor número = aparece primero en los listados'
    )

    # Auditoría
    creada_por         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='areas_creadas'
    )
    fecha_creacion     = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'areas'
        verbose_name        = 'Área'
        verbose_name_plural = 'Áreas'
        ordering            = ['orden', 'nombre']

    def __str__(self):
        estado = '' if self.activa else ' [INACTIVA]'
        return f'[{self.codigo_corto}] {self.nombre}{estado}'

    def save(self, *args, **kwargs):
        self.codigo_corto = self.codigo_corto.upper()
        super().save(*args, **kwargs)

    def desactivar(self):
        self.activa = False
        self.save(update_fields=['activa'])

    def activar(self):
        self.activa = True
        self.save(update_fields=['activa'])

    @property
    def total_vacantes(self):
        return self.vacantes.count()

    @property
    def vacantes_abiertas(self):
        return self.vacantes.filter(estado='abierta').count()

    def get_instruccion_ia(self) -> str:
        if self.instruccion_ia:
            return self.instruccion_ia

        instrucciones_default = {
            'TI': (
                'Evalúa conocimientos técnicos: lenguajes de programación, frameworks, '
                'arquitectura de software, bases de datos, herramientas DevOps y metodologías ágiles. '
                'Para roles senior, valora liderazgo técnico y decisiones de arquitectura.'
            ),
            'VEN': (
                'Evalúa experiencia en ventas B2B/B2C, manejo de CRM, técnicas de cierre, '
                'manejo de objeciones y métricas. Valora logros con números concretos: '
                'porcentaje de cuota alcanzada, tamaño de cartera.'
            ),
            'MKT': (
                'Evalúa marketing digital, SEO/SEM, redes sociales, analítica web, '
                'gestión de campañas y métricas (ROAS, CTR, CAC). '
                'Valora portfolio de campañas y casos de éxito medibles.'
            ),
            'RRHH': (
                'Evalúa legislación laboral, procesos de reclutamiento, gestión del desempeño, '
                'desarrollo organizacional y herramientas HRIS.'
            ),
            'FIN': (
                'Evalúa conocimientos contables, NIIF/IFRS, análisis financiero, '
                'modelado financiero y herramientas como Excel avanzado, SAP o ERP.'
            ),
            'LEG': (
                'Evalúa formación jurídica, especialidad legal, legislación aplicable, '
                'experiencia en contratos, litigios o compliance.'
            ),
            'OPS': (
                'Evalúa gestión de procesos, KPIs operativos, metodologías Lean/Six Sigma '
                'y experiencia en mejora continua.'
            ),
            'ATC': (
                'Evalúa manejo de clientes, resolución de conflictos, métricas CSAT/NPS '
                'y herramientas de soporte.'
            ),
            'DIS': (
                'Evalúa dominio de herramientas de diseño (Figma, Adobe Suite), '
                'principios de diseño UX/UI y experiencia con sistemas de diseño.'
            ),
        }
        return instrucciones_default.get(
            self.codigo_corto,
            'Evalúa los conocimientos específicos del área según los requisitos de la vacante. '
            'Considera la experiencia práctica, formación académica y logros concretos.'
        )


class Vacante(models.Model):

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
        ('indefinido',  'Contrato indefinido'),
        ('plazo_fijo',  'Plazo fijo'),
        ('por_obra',    'Por obra o servicio'),
        ('practicas',   'Prácticas profesionales'),
        ('freelance',   'Freelance / Honorarios'),
        ('part_time',   'Part-time'),
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
        ('baja',    'Baja'),
        ('media',   'Media'),
        ('alta',    'Alta'),
        ('urgente', 'Urgente'),
    ]

    INDUSTRIA_CHOICES = [
        ('software',          'Software / SaaS'),
        ('banca',             'Banca y Finanzas'),
        ('retail',            'Retail / Comercio'),
        ('salud',             'Salud / Farmacia'),
        ('educacion',         'Educación'),
        ('manufactura',       'Manufactura / Industrial'),
        ('servicios',         'Servicios Profesionales'),
        ('gobierno',          'Gobierno / Sector Público'),
        ('telecomunicaciones','Telecomunicaciones'),
        ('construccion',      'Construcción / Inmobiliaria'),
        ('agricultura',       'Agricultura / Agroindustria'),
        ('ong',               'ONG / Sin fines de lucro'),
        ('otro',              'Otro'),
    ]

    # ------------------------------------------
    # IDENTIFICACIÓN
    # ------------------------------------------
    codigo      = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        verbose_name='Código',
        help_text='Generado automáticamente. Ej: TI-2025-001'
    )
    titulo      = models.CharField(max_length=200, verbose_name='Título del puesto')

    # ForeignKey a Area (dinámico)
    area        = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name='vacantes',
        verbose_name='Área / Departamento',
        help_text='Área de la empresa a la que pertenece esta vacante'
    )
    departamento = models.CharField(
        max_length=100, blank=True,
        verbose_name='Sub-departamento',
        help_text='Opcional. Ej: Backend, Frontend, Data dentro de TI'
    )
    industria   = models.CharField(
        max_length=30,
        choices=INDUSTRIA_CHOICES,
        default='otro',
        verbose_name='Industria'
    )

    # ------------------------------------------
    # DESCRIPCIÓN DEL PUESTO
    # ------------------------------------------
    descripcion          = models.TextField(verbose_name='Descripción del puesto')
    responsabilidades    = models.TextField(blank=True, verbose_name='Responsabilidades')
    requisitos           = models.TextField(verbose_name='Requisitos obligatorios')
    requisitos_deseables = models.TextField(blank=True, verbose_name='Requisitos deseables')

    # ------------------------------------------
    # HABILIDADES Y CONOCIMIENTOS
    # ------------------------------------------
    habilidades              = models.TextField(
        verbose_name='Habilidades requeridas',
        help_text='Separadas por coma. Ej: Java, Spring Boot, MySQL'
    )
    tecnologias              = models.TextField(
        blank=True,
        verbose_name='Tecnologías / Herramientas',
        help_text='Puede estar vacío para áreas no técnicas'
    )
    conocimientos_especificos = models.TextField(
        blank=True,
        verbose_name='Conocimientos específicos para examen IA',
        help_text='Temas que la IA debe evaluar en el examen teórico'
    )

    # ------------------------------------------
    # EXPERIENCIA Y NIVEL
    # ------------------------------------------
    nivel_experiencia = models.CharField(
        max_length=20, choices=NIVEL_CHOICES,
        default='semi_senior', verbose_name='Nivel de experiencia'
    )
    anios_experiencia = models.IntegerField(
        default=0, verbose_name='Años mínimos de experiencia'
    )
    nivel_educativo   = models.CharField(
        max_length=100, blank=True,
        verbose_name='Nivel educativo requerido',
        help_text='Ej: Universitario completo, Técnico, Maestría'
    )
    carrera_afin      = models.CharField(
        max_length=200, blank=True,
        verbose_name='Carreras afines'
    )

    # ------------------------------------------
    # CONDICIONES LABORALES
    # ------------------------------------------
    modalidad      = models.CharField(
        max_length=20, choices=MODALIDAD_CHOICES,
        default='presencial', verbose_name='Modalidad'
    )
    tipo_contrato  = models.CharField(
        max_length=20, choices=TIPO_CONTRATO_CHOICES,
        default='indefinido', verbose_name='Tipo de contrato'
    )
    ubicacion      = models.CharField(max_length=200, blank=True, verbose_name='Dirección/Ubicación')
    ciudad         = models.CharField(max_length=100, default='Lima', verbose_name='Ciudad')
    pais           = models.CharField(max_length=100, default='Perú', verbose_name='País')
    salario_minimo = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True, verbose_name='Salario mínimo'
    )
    salario_maximo = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True, verbose_name='Salario máximo'
    )
    moneda         = models.CharField(max_length=10, default='PEN', verbose_name='Moneda')
    mostrar_salario = models.BooleanField(
        default=False,
        verbose_name='Mostrar salario al candidato'
    )
    beneficios     = models.TextField(blank=True, verbose_name='Beneficios')

    # ------------------------------------------
    # ESTADO Y PRIORIDAD
    # ------------------------------------------
    estado    = models.CharField(
        max_length=20, choices=ESTADO_CHOICES,
        default='borrador', verbose_name='Estado'
    )
    prioridad = models.CharField(
        max_length=10, choices=PRIORIDAD_CHOICES,
        default='media', verbose_name='Prioridad'
    )

    # ------------------------------------------
    # CONFIGURACIÓN DEL PROCESO IA
    # ------------------------------------------
    score_cv_minimo          = models.IntegerField(
        default=60,
        verbose_name='Score mínimo de CV',
        help_text='Score mínimo (0-100) para que el candidato avance al examen'
    )
    nota_minima_examen       = models.DecimalField(
        max_digits=4, decimal_places=2, default=13.00,
        verbose_name='Nota mínima del examen',
        help_text='Nota mínima (0-20) para aprobar el examen teórico'
    )
    top_candidatos_finalistas = models.IntegerField(
        default=5,
        verbose_name='Top candidatos finalistas',
        help_text='Cantidad de candidatos que pasan a entrevista presencial con RRHH'
    )

    # ------------------------------------------
    # AUDITORÍA
    # ------------------------------------------
    creado_por         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='vacantes_creadas',
        verbose_name='Creado por'
    )
    fecha_creacion     = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    fecha_publicacion  = models.DateTimeField(null=True, blank=True)
    fecha_cierre       = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table            = 'vacantes'
        verbose_name        = 'Vacante'
        verbose_name_plural = 'Vacantes'
        ordering            = ['-fecha_creacion']

    def __str__(self):
        return f'[{self.codigo}] {self.titulo} — {self.area.nombre}'

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)

    def _generar_codigo(self) -> str:
        """
        Genera código automático con formato: {AREA}-{AÑO}-{NNN}
        Ejemplos: TI-2025-001, VEN-2025-003, MKT-2025-001
        """
        from django.utils import timezone
        año          = timezone.now().year
        codigo_area  = self.area.codigo_corto if self.area_id else 'GEN'
        prefijo      = f'{codigo_area}-{año}-'

        ultimo = (
            Vacante.objects
            .filter(codigo__startswith=prefijo)
            .order_by('-codigo')
            .first()
        )

        if ultimo:
            try:
                num = int(ultimo.codigo.split('-')[-1]) + 1
            except (ValueError, IndexError):
                num = 1
        else:
            num = 1

        return f'{prefijo}{num:03d}'

    @property
    def total_candidatos(self):
        return self.candidatos.count()

    @property
    def candidatos_activos(self):
        return self.candidatos.exclude(
            estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']
        ).count()
