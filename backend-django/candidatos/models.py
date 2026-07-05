# ==========================================
# candidatos/models.py (Sprint 2 - completo)
# ==========================================

import uuid
from django.db import models
from django.conf import settings


class Tag(models.Model):
    """
    Etiquetas para clasificar candidatos.
    Ejemplos: 'talento premium', 'revisar luego', 'no volver a contactar'
    """
    nombre     = models.CharField(max_length=50, unique=True)
    color      = models.CharField(max_length=7, default='#6B7280', help_text='Color hex. Ej: #6B7280')
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table   = 'tags'
        verbose_name = 'Tag'
        ordering   = ['nombre']

    def __str__(self):
        return self.nombre


class Candidato(models.Model):

    ESTADO_CHOICES = [
        # Fase 1: CV
        ('postulado',        'Postulado'),
        ('cv_analizando',    'CV en análisis IA'),
        ('cv_aprobado',      'CV aprobado'),
        ('cv_rechazado',     'CV rechazado (score bajo)'),
        # Fase 2: Examen
        ('examen_pendiente', 'Esperando hacer examen'),
        ('examen_en_curso',  'Examen en curso'),
        ('examen_aprobado',  'Examen aprobado'),
        ('examen_rechazado', 'Examen rechazado (nota baja)'),
        # Fase 3: Entrevista IA
        ('entrevista_pendiente',  'Esperando entrevista IA'),
        ('entrevista_en_curso',   'Entrevista IA en curso'),
        ('entrevista_completada', 'Entrevista IA completada'),
        # Fase 4: Selección
        ('finalista',             'Finalista (top ranking)'),
        ('entrevista_presencial', 'Entrevista presencial agendada'),
        ('contratado',            'Contratado'),
        ('descartado',            'Descartado'),
    ]

    NIVEL_EDUCATIVO_CHOICES = [
        ('secundaria',    'Secundaria completa'),
        ('tecnico',       'Técnico'),
        ('universitario', 'Universitario'),
        ('bachiller',     'Bachiller'),
        ('titulado',      'Titulado'),
        ('maestria',      'Maestría'),
        ('doctorado',     'Doctorado'),
        ('otro',          'Otro'),
    ]

    SOURCE_CHOICES = [
        ('manual',          'Carga manual por RRHH'),
        ('carga_masiva',    'Carga masiva'),
        ('formulario',      'Formulario público'),
        ('buzon_imap',      'Buzón de correo automático'),
        ('referido',        'Referido interno'),
        ('linkedin',        'LinkedIn'),
        ('computrabajo',    'Computrabajo'),
        ('bumeran',         'Bumeran'),
        ('indeed',          'Indeed'),
        ('otro_portal',     'Otro portal'),
    ]

    # ------------------------------------------
    # RELACIONES
    # ------------------------------------------
    vacante = models.ForeignKey('vacantes.Vacante', on_delete=models.CASCADE, related_name='candidatos')
    usuario_cuenta = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='perfil_candidato'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='candidatos')

    # ------------------------------------------
    # DATOS PERSONALES
    # ------------------------------------------
    nombre           = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True)
    tipo_documento   = models.CharField(
        max_length=10,
        choices=[('DNI', 'DNI'), ('CE', 'Carnet Extranjería'), ('PASSPORT', 'Pasaporte')],
        default='DNI'
    )
    numero_documento = models.CharField(max_length=20, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(
        max_length=10,
        choices=[('M', 'Masculino'), ('F', 'Femenino'), ('NB', 'No binario'), ('NI', 'Prefiero no indicar')],
        blank=True
    )

    # ------------------------------------------
    # CONTACTO
    # ------------------------------------------
    email    = models.EmailField()
    telefono = models.CharField(max_length=20, null=True, blank=True)
    ciudad   = models.CharField(max_length=100, blank=True)
    pais     = models.CharField(max_length=100, default='Perú')
    linkedin = models.URLField(blank=True)
    github   = models.URLField(blank=True)
    portfolio = models.URLField(blank=True)

    # ------------------------------------------
    # ARCHIVO CV
    # ------------------------------------------
    cv                = models.FileField(upload_to='cvs/%Y/%m/')
    cv_texto_extraido = models.TextField(blank=True)

    # ------------------------------------------
    # INFORMACIÓN PROFESIONAL
    # ------------------------------------------
    nivel_educativo        = models.CharField(max_length=20, choices=NIVEL_EDUCATIVO_CHOICES, blank=True)
    carrera                = models.CharField(max_length=200, blank=True)
    universidad            = models.CharField(max_length=200, blank=True)
    anios_experiencia      = models.IntegerField(default=0)
    cargo_actual           = models.CharField(max_length=200, blank=True)
    empresa_actual         = models.CharField(max_length=200, blank=True)
    habilidades_declaradas = models.TextField(blank=True)

    # ------------------------------------------
    # EXPECTATIVAS DEL CANDIDATO (capturadas al postular)
    # ------------------------------------------
    pretension_salarial = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Pretensión salarial mensual en la moneda del puesto'
    )
    disponibilidad = models.CharField(
        max_length=200, blank=True,
        help_text='Ej: Inmediata, 30 días de preaviso, A partir de enero 2026'
    )
    acepta_modalidad = models.BooleanField(
        null=True, blank=True,
        help_text='¿El candidato acepta la modalidad del puesto?'
    )
    acepta_ciudad = models.BooleanField(
        null=True, blank=True,
        help_text='¿El candidato acepta trabajar en la ciudad del puesto?'
    )

    # ------------------------------------------
    # SOURCE — origen del candidato
    # ------------------------------------------
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')

    # ------------------------------------------
    # ANÁLISIS IA - Fase 1: CV
    # ------------------------------------------
    cv_analizado          = models.BooleanField(default=False)
    fecha_analisis_cv     = models.DateTimeField(null=True, blank=True)
    score_cv              = models.IntegerField(null=True, blank=True)
    clasificacion_ia      = models.CharField(
        max_length=30,
        choices=[
            ('altamente_recomendado', 'Altamente Recomendado'),
            ('recomendado',           'Recomendado'),
            ('requiere_revision',     'Requiere Revisión'),
            ('no_apto',               'No Apto'),
        ],
        blank=True
    )
    resumen_cv             = models.TextField(blank=True)
    habilidades_detectadas = models.JSONField(default=list)
    habilidades_faltantes  = models.JSONField(default=list)
    inconsistencias_cv     = models.JSONField(default=list)
    match_porcentaje       = models.IntegerField(null=True, blank=True)
    analisis_detallado     = models.JSONField(default=dict)

    # Aprobación manual
    aprobado_manualmente = models.BooleanField(default=False)
    aprobado_por         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='candidatos_aprobados'
    )
    nota_aprobacion = models.TextField(blank=True)

    # ------------------------------------------
    # ANÁLISIS IA - Fase 2: Examen
    # ------------------------------------------
    score_examen    = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    examen_aprobado = models.BooleanField(null=True, blank=True)
    fecha_examen    = models.DateTimeField(null=True, blank=True)

    # ------------------------------------------
    # ANÁLISIS IA - Fase 3: Entrevista
    # ------------------------------------------
    score_entrevista       = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dimension_claridad     = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dimension_coherencia   = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dimension_precision    = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dimension_comunicacion = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dimension_seguridad    = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    feedback_entrevista    = models.TextField(blank=True)
    fecha_entrevista       = models.DateTimeField(null=True, blank=True)

    # ------------------------------------------
    # SCORE FINAL
    # ------------------------------------------
    score_final      = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    posicion_ranking = models.IntegerField(null=True, blank=True)

    # ------------------------------------------
    # ESTADO DEL PROCESO
    # ------------------------------------------
    estado             = models.CharField(max_length=30, choices=ESTADO_CHOICES, default='postulado')
    es_finalista       = models.BooleanField(default=False)
    observaciones_rrhh = models.TextField(blank=True)

    # ------------------------------------------
    # AUDITORÍA
    # ------------------------------------------
    # --- Banco de talento y descarte (Sprint 4) ---
    en_banco_talento   = models.BooleanField(default=False,
                            help_text='Candidato valioso guardado para futuras vacantes')
    motivo_descarte    = models.TextField(blank=True,
                            help_text='Razón registrada al descartar al candidato')

    fecha_postulacion  = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    registrado_por     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='candidatos_registrados'
    )

    class Meta:
        db_table        = 'candidatos'
        verbose_name    = 'Candidato'
        verbose_name_plural = 'Candidatos'
        ordering        = ['-score_final', '-score_cv']
        unique_together = [['email', 'vacante']]

    def __str__(self):
        return f'{self.nombre} {self.apellido_paterno} → {self.vacante.titulo}'

    @property
    def nombre_completo(self):
        return f'{self.nombre} {self.apellido_paterno} {self.apellido_materno}'.strip()

    def calcular_score_final(self):
        score_cv_20 = (self.score_cv / 100) * 20 if self.score_cv else None
        examen      = float(self.score_examen) if self.score_examen else None
        entrevista  = float(self.score_entrevista) if self.score_entrevista else None

        scores, pesos = [], []
        if score_cv_20 is not None:
            scores.append(score_cv_20 * 0.25); pesos.append(0.25)
        if examen is not None:
            scores.append(examen * 0.40); pesos.append(0.40)
        if entrevista is not None:
            scores.append(entrevista * 0.35); pesos.append(0.35)

        if not scores:
            return None

        peso_total = sum(pesos)
        self.score_final = round(sum(scores) / peso_total, 2)
        self.save(update_fields=['score_final'])
        return self.score_final


class NotaCandidato(models.Model):
    """
    Notas/comentarios internos del equipo de RRHH sobre un candidato.
    No visible para el candidato. Incluye autor y fecha.
    """
    candidato  = models.ForeignKey(Candidato, on_delete=models.CASCADE, related_name='notas')
    autor      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='notas_candidatos')
    contenido  = models.TextField()
    fecha      = models.DateTimeField(auto_now_add=True)
    editado    = models.BooleanField(default=False)
    fecha_edicion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notas_candidatos'
        verbose_name = 'Nota de candidato'
        ordering = ['-fecha']

    def __str__(self):
        return f'Nota de {self.autor} sobre {self.candidato.nombre_completo}'


def _generar_codigo_corto():
    """Genera un código corto, legible y fácil de teclear: MENTIS-XXXX-XXXX.
    Sin caracteres ambiguos (0/O, 1/I/L) para evitar confusiones al transcribir."""
    import secrets
    alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'  # sin O,0,1,I,L
    parte1 = ''.join(secrets.choice(alfabeto) for _ in range(4))
    parte2 = ''.join(secrets.choice(alfabeto) for _ in range(4))
    return f'MENTIS-{parte1}-{parte2}'


class TokenAcceso(models.Model):
    token       = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    codigo_corto = models.CharField(max_length=20, unique=True, null=True, blank=True,
                                    help_text='Código legible para ingresar en la app móvil')
    candidato   = models.ForeignKey(Candidato, on_delete=models.CASCADE, related_name='tokens')

    TIPO_CHOICES = [
        ('examen',     'Link de acceso al examen'),
        ('entrevista', 'Link de acceso a la entrevista'),
    ]
    tipo             = models.CharField(max_length=20, choices=TIPO_CHOICES, default='examen')
    usado            = models.BooleanField(default=False)
    fecha_creacion   = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField()
    fecha_uso        = models.DateTimeField(null=True, blank=True)
    ip_uso           = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'tokens_acceso'

    def save(self, *args, **kwargs):
        if not self.codigo_corto:
            # Generar uno único (reintenta si colisiona)
            for _ in range(10):
                candidato_codigo = _generar_codigo_corto()
                if not TokenAcceso.objects.filter(codigo_corto=candidato_codigo).exists():
                    self.codigo_corto = candidato_codigo
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Token {self.tipo} → {self.candidato.nombre_completo}'

    @property
    def es_valido(self):
        from django.utils import timezone
        return not self.usado and self.fecha_expiracion > timezone.now()

    def get_url(self):
        base = settings.MENTIS['FRONTEND_URL']
        return f'{base}/candidato/acceso?token={self.token}'

    def marcar_como_usado(self, ip=None):
        from django.utils import timezone
        self.usado = True
        self.fecha_uso = timezone.now()
        self.ip_uso = ip
        self.save()