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
    # TEXTOS DE PUBLICACIÓN EDITADOS
    # ------------------------------------------
    textos_editados = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            'Textos de publicación editados manualmente por RRHH. '
            'Si está vacío, el sistema genera los textos automáticamente.'
        ),
    )

    publicado_en = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            'Registro de cuándo se publicó la vacante en cada canal. '
            'Ej: {"sistema": "2026-06-12T10:00:00", "linkedin": "2026-06-12"}'
        ),
    )
 
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

    def puede_publicarse(self) -> dict:
        """
        Valida si la vacante tiene los datos mínimos para publicarse.
        Devuelve {'ok': bool, 'faltan': [campos]}.
        """
        faltan = []
        if not self.titulo:
            faltan.append('título')
        if not self.descripcion:
            faltan.append('descripción')
        if not self.requisitos:
            faltan.append('requisitos')
        if not self.area_id:
            faltan.append('área')
        if not self.ciudad:
            faltan.append('ciudad')
        if self.cantidad_posiciones < 1:
            faltan.append('cantidad de posiciones')
        return {'ok': len(faltan) == 0, 'faltan': faltan}

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
        Genera textos ricos y completos para publicar en distintos portales.
        Usa todos los campos disponibles de la vacante.
        Solo disponible si la vacante no es confidencial.
        """
        if self.confidencial:
            return {'error': 'Vacante confidencial. No se generan textos de publicación.'}

        email = self.get_email_postulaciones()
        link  = self.get_url_formulario_publico()

        # ── Bloques reutilizables ─────────────────────────────────────

        def _salario_str(simbolo='💰 '):
            if self.mostrar_salario and self.salario_minimo and self.salario_maximo:
                return f'\n{simbolo}Salario: {self.moneda} {self.salario_minimo:,.0f} – {self.salario_maximo:,.0f}'
            return ''

        def _lista_con_bullets(texto, bullet='• '):
            """Convierte texto separado por comas o saltos de línea en lista con bullets."""
            if not texto:
                return ''
            items = [i.strip() for i in texto.replace('\n', ',').split(',') if i.strip()]
            return '\n'.join(f'{bullet}{i}' for i in items)

        def _nivel_educativo_str():
            partes = []
            if self.nivel_educativo:
                partes.append(self.nivel_educativo)
            if self.carrera_afin:
                partes.append(f'carrera afín a {self.carrera_afin}')
            return ', '.join(partes) if partes else ''

        def _experiencia_str():
            nivel = self.get_nivel_experiencia_display()
            if self.anios_experiencia:
                return f'{nivel} ({self.anios_experiencia}+ años de experiencia)'
            return nivel

        def _fecha_limite_str(prefijo='📅 Fecha límite: '):
            if self.fecha_limite:
                return f'\n{prefijo}{self.fecha_limite.strftime("%d/%m/%Y")}'
            return ''

        def _modalidad_lugar():
            partes = [self.get_modalidad_display(), self.ciudad]
            if self.ubicacion:
                partes.append(self.ubicacion)
            return ' | '.join(p for p in partes if p)

        # ── LINKEDIN ─────────────────────────────────────────────────
        # Tono: profesional, narrativo, con emojis moderados.
        # Estructura: hook → quiénes somos → qué harás → buscamos → beneficios → CTA

        responsabilidades_li = _lista_con_bullets(self.responsabilidades, '✅ ') if self.responsabilidades else ''
        tecnologias_li       = _lista_con_bullets(self.tecnologias, '🔧 ') if self.tecnologias else ''
        beneficios_li        = _lista_con_bullets(self.beneficios, '🎁 ') if self.beneficios else ''
        req_deseables_li     = _lista_con_bullets(self.requisitos_deseables, '⭐ ') if self.requisitos_deseables else ''

        linkedin_secciones = []

        # Hook + cabecera
        linkedin_secciones.append(
            f"🚀 ¡Estamos buscando {self.titulo}!\n\n"
            f"📍 {_modalidad_lugar()} | 🏢 {self.area.nombre}\n"
            f"📄 {self.get_tipo_contrato_display()} · {_experiencia_str()}"
            f"{_salario_str()}"
            f"{_fecha_limite_str()}"
        )

        # Descripción del puesto
        if self.descripcion:
            linkedin_secciones.append(f"Sobre el puesto:\n{self.descripcion}")

        # Responsabilidades
        if responsabilidades_li:
            linkedin_secciones.append(f"¿Qué harás?\n{responsabilidades_li}")

        # Requisitos obligatorios
        req_li = _lista_con_bullets(self.requisitos, '✔️ ')
        linkedin_secciones.append(f"Buscamos a alguien con:\n{req_li}")

        # Educación y experiencia
        edu = _nivel_educativo_str()
        if edu:
            linkedin_secciones.append(f"🎓 Formación: {edu}")

        # Tecnologías / herramientas
        if tecnologias_li:
            linkedin_secciones.append(f"🛠 Tecnologías y herramientas:\n{tecnologias_li}")

        # Requisitos deseables
        if req_deseables_li:
            linkedin_secciones.append(f"Será un plus si tienes:\n{req_deseables_li}")

        # Horario
        if self.horario:
            linkedin_secciones.append(f"🕐 Horario: {self.horario} ({self.get_horario_tipo_display()})")

        # Beneficios
        if beneficios_li:
            linkedin_secciones.append(f"¿Qué te ofrecemos?\n{beneficios_li}")

        # CTA
        tags_area = f"#{self.area.nombre.replace(' ', '').replace('/', '')}"
        tags_nivel = f"#{self.get_nivel_experiencia_display().replace(' ', '').replace('(','').replace(')','').replace('+','').replace('-','')}"
        linkedin_secciones.append(
            f"📩 ¿Te interesa? Postula directamente aquí:\n🔗 {link}\n\n"
            f"O envía tu CV a: {email}\n\n"
            f"{tags_area} {tags_nivel} #Empleo #Peru #Lima #Oportunidad"
        )

        linkedin = '\n\n'.join(linkedin_secciones)

        # ── COMPUTRABAJO ─────────────────────────────────────────────
        # Tono: formal, estructurado. Sin emojis. Secciones en mayúsculas.
        # Computrabajo favorece descripciones densas y completas.

        ct_partes = [
            f"PUESTO: {self.titulo}",
            f"ÁREA: {self.area.nombre}",
            f"NIVEL: {_experiencia_str()}",
            f"MODALIDAD: {self.get_modalidad_display()}",
            f"CIUDAD: {self.ciudad}{', ' + self.ubicacion if self.ubicacion else ''}",
            f"CONTRATO: {self.get_tipo_contrato_display()}",
        ]
        if self.horario:
            ct_partes.append(f"HORARIO: {self.horario} ({self.get_horario_tipo_display()})")
        edu = _nivel_educativo_str()
        if edu:
            ct_partes.append(f"EDUCACIÓN REQUERIDA: {edu}")
        if self.mostrar_salario and self.salario_minimo and self.salario_maximo:
            ct_partes.append(f"REMUNERACIÓN: {self.moneda} {self.salario_minimo:,.0f} – {self.salario_maximo:,.0f}")
        if self.fecha_limite:
            ct_partes.append(f"FECHA LÍMITE DE POSTULACIÓN: {self.fecha_limite.strftime('%d/%m/%Y')}")

        ct_partes.append(f"\nDESCRIPCIÓN DEL PUESTO:\n{self.descripcion}")

        if self.responsabilidades:
            ct_partes.append(f"FUNCIONES Y RESPONSABILIDADES:\n{_lista_con_bullets(self.responsabilidades)}")

        ct_partes.append(f"REQUISITOS OBLIGATORIOS:\n{_lista_con_bullets(self.requisitos)}")

        if self.requisitos_deseables:
            ct_partes.append(f"REQUISITOS DESEABLES:\n{_lista_con_bullets(self.requisitos_deseables)}")

        if self.habilidades:
            ct_partes.append(f"HABILIDADES REQUERIDAS:\n{_lista_con_bullets(self.habilidades)}")

        if self.tecnologias:
            ct_partes.append(f"TECNOLOGÍAS / HERRAMIENTAS:\n{_lista_con_bullets(self.tecnologias)}")

        ct_partes.append(
            f"BENEFICIOS:\n{_lista_con_bullets(self.beneficios) if self.beneficios else '• A convenir'}"
        )
        ct_partes.append(
            f"CÓMO POSTULAR:\n"
            f"• Postula en línea: {link}\n"
            f"• O envía tu CV a: {email}\n"
            f"• Código de vacante: {self.codigo}"
        )

        computrabajo = '\n\n'.join(ct_partes)

        # ── WHATSAPP ─────────────────────────────────────────────────
        # Tono: directo, conciso. Máximo 3 pantallas de teléfono.
        # Formato: texto plano con negritas (*texto*).

        wa_req = ', '.join(
            [i.strip() for i in self.requisitos.replace('\n', ',').split(',') if i.strip()][:4]
        )
        wa_partes = [
            f"*{self.titulo}* — {self.area.nombre}\n"
            f"📍 {_modalidad_lugar()}\n"
            f"📋 {self.get_tipo_contrato_display()}"
            f"{_salario_str('💰 ')}",

            f"*¿Qué buscamos?*\n{wa_req}{'...' if len(self.requisitos) > len(wa_req) else ''}",
        ]

        if self.tecnologias:
            tec = ', '.join(
                [i.strip() for i in self.tecnologias.replace('\n', ',').split(',') if i.strip()][:4]
            )
            wa_partes.append(f"*Tecnologías:* {tec}")

        if self.horario:
            wa_partes.append(f"🕐 *Horario:* {self.horario}")

        if self.beneficios:
            ben = ', '.join(
                [i.strip() for i in self.beneficios.replace('\n', ',').split(',') if i.strip()][:3]
            )
            wa_partes.append(f"🎁 *Beneficios:* {ben}")

        if self.fecha_limite:
            wa_partes.append(f"⏳ *Cierre:* {self.fecha_limite.strftime('%d/%m/%Y')}")

        wa_partes.append(
            f"*Postula aquí 👇*\n{link}\n\nO envía tu CV a:\n{email}"
        )

        whatsapp = '\n\n'.join(wa_partes)

        # ── INDEED (texto interno) ────────────────────────────────────
        # Indeed usa este texto como descripción interna del job post.
        # Tono: neutral, sin emojis, HTML básico permitido pero no necesario.

        indeed_partes = [
            f"{self.titulo}\n{'=' * len(self.titulo)}",
            f"Área: {self.area.nombre} | Nivel: {_experiencia_str()} | {self.get_modalidad_display()}",
            self.descripcion,
        ]

        if self.responsabilidades:
            indeed_partes.append(f"Responsabilidades:\n{_lista_con_bullets(self.responsabilidades, '- ')}")

        indeed_partes.append(f"Requisitos:\n{_lista_con_bullets(self.requisitos, '- ')}")

        if self.requisitos_deseables:
            indeed_partes.append(f"Requisitos deseables:\n{_lista_con_bullets(self.requisitos_deseables, '- ')}")

        if self.tecnologias:
            indeed_partes.append(f"Tecnologías requeridas:\n{_lista_con_bullets(self.tecnologias, '- ')}")

        edu = _nivel_educativo_str()
        if edu:
            indeed_partes.append(f"Formación académica: {edu}")

        if self.horario:
            indeed_partes.append(f"Horario: {self.horario} ({self.get_horario_tipo_display()})")

        if self.mostrar_salario and self.salario_minimo and self.salario_maximo:
            indeed_partes.append(f"Salario: {self.moneda} {self.salario_minimo:,.0f} – {self.salario_maximo:,.0f}")

        if self.beneficios:
            indeed_partes.append(f"Beneficios:\n{_lista_con_bullets(self.beneficios, '- ')}")

        if self.fecha_limite:
            indeed_partes.append(f"Fecha límite: {self.fecha_limite.strftime('%d/%m/%Y')}")

        indeed_partes.append(f"Modalidad: {self.get_modalidad_display()}\nUbicación: {self.ciudad}, {self.pais}\nTipo de contrato: {self.get_tipo_contrato_display()}")
        indeed_partes.append(f"Postula en: {link}")

        indeed = '\n\n'.join(indeed_partes)

        return {
            'linkedin':            linkedin,
            'computrabajo':        computrabajo,
            'whatsapp':            whatsapp,
            'indeed':              indeed,
            'email_postulaciones': email,
            'link_formulario':     link,
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