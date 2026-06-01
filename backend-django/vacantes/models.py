# ==========================================
# vacantes/models.py (Sprint 2 - completo)
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

    nombre       = models.CharField(max_length=100, unique=True)
    codigo_corto = models.CharField(
        max_length=10, unique=True,
        validators=[RegexValidator(r'^[A-Z0-9]+$', 'Solo letras mayúsculas y números.')],
        help_text='Ej: TI, VEN, MKT'
    )
    descripcion    = models.TextField(blank=True)
    icono          = models.CharField(max_length=30, choices=ICONO_CHOICES, default='star')
    color          = models.CharField(
        max_length=7, default='#2E75B6',
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$', 'Formato hex inválido. Ej: #2E75B6')]
    )
    instruccion_ia = models.TextField(blank=True, help_text='Instrucción para la IA al analizar CVs y generar preguntas')
    activa         = models.BooleanField(default=True)
    es_predefinida = models.BooleanField(default=False)
    orden          = models.IntegerField(default=0)

    creada_por         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='areas_creadas')
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
            'TI':   'Evalúa conocimientos técnicos: lenguajes, frameworks, arquitectura, bases de datos, DevOps y metodologías ágiles.',
            'VEN':  'Evalúa experiencia en ventas B2B/B2C, CRM, técnicas de cierre, manejo de objeciones y métricas de ventas.',
            'MKT':  'Evalúa marketing digital, SEO/SEM, redes sociales, analítica web y métricas (ROAS, CTR, CAC).',
            'RRHH': 'Evalúa legislación laboral, reclutamiento, gestión del desempeño y herramientas HRIS.',
            'FIN':  'Evalúa contabilidad, NIIF/IFRS, análisis financiero, modelado y herramientas como SAP o ERP.',
            'LEG':  'Evalúa formación jurídica, legislación aplicable, contratos, litigios y compliance.',
            'OPS':  'Evalúa gestión de procesos, KPIs, metodologías Lean/Six Sigma y mejora continua.',
            'ATC':  'Evalúa manejo de clientes, resolución de conflictos, métricas CSAT/NPS y herramientas de soporte.',
            'DIS':  'Evalúa dominio de Figma/Adobe Suite, principios UX/UI y sistemas de diseño.',
        }
        return instrucciones_default.get(
            self.codigo_corto,
            'Evalúa los conocimientos específicos del área según los requisitos de la vacante.'
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
        ('software',           'Software / SaaS'),
        ('banca',              'Banca y Finanzas'),
        ('retail',             'Retail / Comercio'),
        ('salud',              'Salud / Farmacia'),
        ('educacion',          'Educación'),
        ('manufactura',        'Manufactura / Industrial'),
        ('servicios',          'Servicios Profesionales'),
        ('gobierno',           'Gobierno / Sector Público'),
        ('telecomunicaciones', 'Telecomunicaciones'),
        ('construccion',       'Construcción / Inmobiliaria'),
        ('agricultura',        'Agricultura / Agroindustria'),
        ('ong',                'ONG / Sin fines de lucro'),
        ('otro',               'Otro'),
    ]

    MOTIVO_VACANTE_CHOICES = [
        ('nuevo_puesto', 'Nuevo puesto'),
        ('reemplazo',    'Reemplazo'),
        ('expansion',    'Expansión del equipo'),
        ('campana',      'Campaña / Temporal'),
    ]

    HORARIO_TIPO_CHOICES = [
        ('tiempo_completo', 'Tiempo completo'),
        ('medio_tiempo',    'Medio tiempo'),
        ('turnos',          'Turnos rotativos'),
        ('flexible',        'Horario flexible'),
        ('por_objetivos',   'Por objetivos'),
    ]

    # ------------------------------------------
    # IDENTIFICACIÓN
    # ------------------------------------------
    codigo       = models.CharField(max_length=30, unique=True, editable=False, help_text='Generado automáticamente. Ej: TI-2025-001')
    titulo       = models.CharField(max_length=200)
    area         = models.ForeignKey(Area, on_delete=models.PROTECT, related_name='vacantes')
    departamento = models.CharField(max_length=100, blank=True, help_text='Sub-departamento. Ej: Backend dentro de TI')
    industria    = models.CharField(max_length=30, choices=INDUSTRIA_CHOICES, default='otro')

    # ------------------------------------------
    # INFORMACIÓN DEL PUESTO (feedback RRHH)
    # ------------------------------------------
    motivo_vacante    = models.CharField(max_length=20, choices=MOTIVO_VACANTE_CHOICES, default='nuevo_puesto', help_text='¿Por qué se abre esta vacante?')
    nombre_reemplazado = models.CharField(max_length=200, blank=True, help_text='Nombre de la persona que ocupaba el puesto (solo si es reemplazo)')
    jefe_directo      = models.CharField(max_length=200, blank=True, help_text='Nombre y cargo del jefe directo del puesto')
    solicitante       = models.CharField(max_length=200, blank=True, help_text='Nombre y cargo de quien autorizó abrir la vacante')
    cantidad_posiciones = models.IntegerField(default=1, help_text='Número de personas a contratar para este perfil')
    posiciones_cubiertas = models.IntegerField(default=0, help_text='Cuántas posiciones ya fueron cubiertas')

    # ------------------------------------------
    # DESCRIPCIÓN DEL PUESTO
    # ------------------------------------------
    descripcion          = models.TextField()
    responsabilidades    = models.TextField(blank=True)
    requisitos           = models.TextField(help_text='Requisitos obligatorios del puesto')
    requisitos_deseables = models.TextField(blank=True)

    # ------------------------------------------
    # HABILIDADES Y CONOCIMIENTOS
    # ------------------------------------------
    habilidades               = models.TextField(help_text='Habilidades requeridas separadas por coma')
    tecnologias               = models.TextField(blank=True, help_text='Tecnologías/herramientas')
    conocimientos_especificos = models.TextField(blank=True, help_text='Temas para el examen IA')

    # ------------------------------------------
    # EXPERIENCIA Y NIVEL
    # ------------------------------------------
    nivel_experiencia = models.CharField(max_length=20, choices=NIVEL_CHOICES, default='semi_senior')
    anios_experiencia = models.IntegerField(default=0)
    nivel_educativo   = models.CharField(max_length=100, blank=True)
    carrera_afin      = models.CharField(max_length=200, blank=True)

    # ------------------------------------------
    # CONDICIONES LABORALES
    # ------------------------------------------
    modalidad       = models.CharField(max_length=20, choices=MODALIDAD_CHOICES, default='presencial')
    tipo_contrato   = models.CharField(max_length=20, choices=TIPO_CONTRATO_CHOICES, default='indefinido')
    horario         = models.CharField(max_length=200, blank=True, help_text='Ej: Lunes a viernes 8am-6pm, Turnos rotativos, etc.')
    horario_tipo    = models.CharField(max_length=20, choices=HORARIO_TIPO_CHOICES, default='tiempo_completo')
    ubicacion       = models.CharField(max_length=200, blank=True)
    ciudad          = models.CharField(max_length=100, default='Lima')
    pais            = models.CharField(max_length=100, default='Perú')
    salario_minimo  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salario_maximo  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    moneda          = models.CharField(max_length=10, default='PEN')
    mostrar_salario = models.BooleanField(default=False)
    beneficios      = models.TextField(blank=True)

    # ------------------------------------------
    # ESTADO, PRIORIDAD Y CONFIDENCIALIDAD
    # ------------------------------------------
    estado        = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    prioridad     = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    confidencial  = models.BooleanField(
        default=False,
        help_text='Si está activo: no se publica en canales externos. Solo carga manual y banco de talento.'
    )
    fecha_limite  = models.DateField(null=True, blank=True, help_text='Fecha objetivo para cubrir la vacante')

    # ------------------------------------------
    # CONFIGURACIÓN DEL PROCESO IA
    # ------------------------------------------
    score_cv_minimo           = models.IntegerField(default=60, help_text='Score mínimo del CV para avanzar al examen (0-100)')
    nota_minima_examen        = models.DecimalField(max_digits=4, decimal_places=2, default=13.00)
    top_candidatos_finalistas = models.IntegerField(default=5)

    # ------------------------------------------
    # AUDITORÍA
    # ------------------------------------------
    creado_por         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='vacantes_creadas')
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
        from django.utils import timezone
        año         = timezone.now().year
        cod_area    = self.area.codigo_corto if self.area_id else 'GEN'
        prefijo     = f'{cod_area}-{año}-'
        ultimo = Vacante.objects.filter(codigo__startswith=prefijo).order_by('-codigo').first()
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

    @property
    def posiciones_disponibles(self):
        return max(0, self.cantidad_posiciones - self.posiciones_cubiertas)

    @property
    def esta_completa(self):
        return self.posiciones_cubiertas >= self.cantidad_posiciones

    def get_email_postulaciones(self):
        """Email único para recibir CVs de esta vacante por correo."""
        from django.conf import settings
        dominio = settings.MENTIS.get('EMAIL_POSTULACIONES_DOMINIO', 'mentis.com')
        return f'postulaciones-{self.codigo.lower()}@{dominio}'

    def get_url_formulario_publico(self):
        """URL del formulario público de postulación."""
        from django.conf import settings
        base = settings.MENTIS['FRONTEND_URL']
        return f'{base}/postular/{self.codigo}'

    def canales_activos(self) -> dict:
        """
        Determina qué canales están disponibles según confidencialidad.
        Confidencial = solo carga manual, sin publicación externa.
        """
        if self.confidencial:
            return {
                'carga_manual': True,
                'formulario_publico': False,
                'buzon_imap': False,
                'indeed': False,
                'google_jobs': False,
                'textos_publicacion': 'confidencial',
            }
        return {
            'carga_manual': True,
            'formulario_publico': True,
            'buzon_imap': True,
            'indeed': True,
            'google_jobs': True,
            'textos_publicacion': 'completo',
        }

    def generar_textos_publicacion(self) -> dict:
        """
        Genera textos optimizados para publicar en distintos portales.
        Solo disponible si la vacante no es confidencial.
        """
        if self.confidencial:
            return {'error': 'Vacante confidencial. No se generan textos de publicación.'}

        email     = self.get_email_postulaciones()
        link      = self.get_url_formulario_publico()
        salario   = ''
        if self.mostrar_salario and self.salario_minimo and self.salario_maximo:
            salario = f'\n💰 Salario: {self.moneda} {self.salario_minimo:,.0f} - {self.salario_maximo:,.0f}'

        linkedin = f"""🚀 ¡Estamos buscando {self.titulo}!

📍 {self.get_modalidad_display()} | {self.ciudad}
🏢 {self.area.nombre} | {self.get_nivel_experiencia_display()}
📄 {self.get_tipo_contrato_display()}{salario}

✅ Requisitos clave:
{self.requisitos[:300]}...

📩 Postula enviando tu CV a: {email}
🔗 O directamente en: {link}

#{self.area.nombre.replace(' ', '').replace('/', '')} #{self.get_nivel_experiencia_display().replace(' ', '').replace('(', '').replace(')', '').replace('+', '')} #Empleo #Lima #Peru"""

        computrabajo = f"""PUESTO: {self.titulo}
ÁREA: {self.area.nombre}
NIVEL: {self.get_nivel_experiencia_display()}
MODALIDAD: {self.get_modalidad_display()}
CIUDAD: {self.ciudad}
CONTRATO: {self.get_tipo_contrato_display()}{salario}

DESCRIPCIÓN DEL PUESTO:
{self.descripcion[:500]}

REQUISITOS OBLIGATORIOS:
{self.requisitos}

HABILIDADES REQUERIDAS:
{self.habilidades}

BENEFICIOS:
{self.beneficios or 'A convenir'}

CÓMO POSTULAR:
• Envía tu CV a: {email}
• O postula en línea: {link}
• Código de vacante: {self.codigo}"""

        whatsapp = f"""*{self.titulo}* — {self.area.nombre}
📍 {self.ciudad} | {self.get_modalidad_display()}
📋 {self.get_tipo_contrato_display()}{salario}

Requisitos: {self.requisitos[:200]}...

Postula aquí 👇
{link}

O envía tu CV a:
{email}"""

        indeed = f"""{self.titulo}

{self.descripcion[:600]}

Requisitos:
{self.requisitos}

Modalidad: {self.get_modalidad_display()}
Ubicación: {self.ciudad}, {self.pais}
Tipo: {self.get_tipo_contrato_display()}

Postula en: {link}"""

        return {
            'linkedin':     linkedin,
            'computrabajo': computrabajo,
            'whatsapp':     whatsapp,
            'indeed':       indeed,
            'email_postulaciones': email,
            'link_formulario':    link,
        }

    def schema_org(self) -> dict:
        """
        Genera el markup schema.org/JobPosting para Google for Jobs.
        """
        from django.utils import timezone
        data = {
            '@context':    'https://schema.org/',
            '@type':       'JobPosting',
            'title':       self.titulo,
            'description': self.descripcion,
            'datePosted':  (self.fecha_publicacion or timezone.now()).strftime('%Y-%m-%d'),
            'jobLocation': {
                '@type':   'Place',
                'address': {
                    '@type':           'PostalAddress',
                    'addressLocality': self.ciudad,
                    'addressCountry':  'PE',
                },
            },
            'employmentType':    self._employment_type(),
            'hiringOrganization': {
                '@type': 'Organization',
                'name':  'MENTIS',
            },
            'applicantLocationRequirements': {
                '@type': 'Country',
                'name':  self.pais,
            },
        }
        if self.mostrar_salario and self.salario_minimo and self.salario_maximo:
            data['baseSalary'] = {
                '@type':    'MonetaryAmount',
                'currency': self.moneda,
                'value': {
                    '@type':    'QuantitativeValue',
                    'minValue': float(self.salario_minimo),
                    'maxValue': float(self.salario_maximo),
                    'unitText': 'MONTH',
                },
            }
        if self.fecha_limite:
            data['validThrough'] = self.fecha_limite.strftime('%Y-%m-%dT00:00:00')
        return data

    def _employment_type(self) -> str:
        mapping = {
            'indefinido':  'FULL_TIME',
            'plazo_fijo':  'FULL_TIME',
            'por_obra':    'CONTRACTOR',
            'practicas':   'INTERN',
            'freelance':   'CONTRACTOR',
            'part_time':   'PART_TIME',
        }
        return mapping.get(self.tipo_contrato, 'FULL_TIME')
