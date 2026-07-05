# ==========================================
# evaluaciones/models.py (Sprint 3 - completo)
# REEMPLAZA tu evaluaciones/models.py actual.
# Luego: python manage.py makemigrations evaluaciones && python manage.py migrate
# Django es el DUEÑO del esquema. Spring Boot solo usa estas tablas.
# ==========================================

from django.db import models
from django.conf import settings


class Examen(models.Model):
    """
    Examen técnico de un candidato. Lo genera y gestiona Spring Boot (módulo usuario),
    pero el esquema lo define Django.
    """
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente de generar'),
        ('generado',   'Generado (preguntas listas)'),
        ('en_curso',   'En curso'),
        ('finalizado', 'Finalizado'),
        ('expirado',   'Expirado (se acabó el tiempo)'),
    ]

    candidato        = models.OneToOneField('candidatos.Candidato', on_delete=models.CASCADE, related_name='examen')
    vacante          = models.ForeignKey('vacantes.Vacante', on_delete=models.CASCADE, related_name='examenes')
    estado           = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    duracion_minutos = models.IntegerField(default=45)
    total_preguntas  = models.IntegerField(default=10)
    fecha_generacion = models.DateTimeField(null=True, blank=True)
    fecha_inicio     = models.DateTimeField(null=True, blank=True)
    fecha_fin        = models.DateTimeField(null=True, blank=True)
    nota             = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    aprobado         = models.BooleanField(null=True, blank=True)

    class Meta:
        db_table = 'examenes'
        verbose_name = 'Examen'
        verbose_name_plural = 'Exámenes'

    def __str__(self):
        return f'Examen de {self.candidato} — {self.get_estado_display()}'


class PreguntaExamen(models.Model):
    """Pregunta individual del examen. Generada por la IA en Spring Boot."""
    TIPO_CHOICES = [
        ('multiple', 'Opción múltiple'),
        ('abierta',  'Respuesta abierta'),
    ]

    examen              = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name='preguntas')
    orden               = models.IntegerField()
    tipo                = models.CharField(max_length=10, choices=TIPO_CHOICES, default='multiple')
    categoria           = models.CharField(max_length=100, null=True, blank=True)
    enunciado           = models.TextField()
    opciones            = models.TextField(null=True, blank=True, help_text='JSON serializado: ["A","B","C","D"]. Vacío si es abierta.')
    respuesta_correcta  = models.TextField(null=True, blank=True, help_text='MC: texto exacto de la opción. Abierta: criterios ideales.')
    puntos              = models.IntegerField(default=2)
    respuesta_candidato = models.TextField(null=True, blank=True)
    respondida_en       = models.DateTimeField(null=True, blank=True)
    es_correcta         = models.BooleanField(null=True, blank=True)
    puntos_obtenidos    = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    feedback_ia         = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'preguntas_examen'
        verbose_name = 'Pregunta de examen'
        ordering = ['orden']

    def __str__(self):
        return f'P{self.orden} ({self.tipo}) — Examen {self.examen_id}'


class EventoAuditoria(models.Model):
    """Eventos sospechosos durante el examen (proctoring básico, Sprint 3)."""
    TIPO_CHOICES = [
        ('perdida_foco',   'Pérdida de foco de la pestaña'),
        ('cambio_ventana', 'Cambio de ventana (Alt+Tab)'),
        ('copy_paste',     'Intento de copiar/pegar'),
        ('click_derecho',  'Click derecho'),
        ('devtools',       'Intento de abrir DevTools'),
        ('inactividad',    'Inactividad prolongada'),
        ('otro',           'Otro'),
    ]

    examen    = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name='eventos')
    tipo      = models.CharField(max_length=20, choices=TIPO_CHOICES, default='otro')
    
    SEVERIDAD_CHOICES = [
        ('baja',  'Baja'),
        ('media', 'Media'),
        ('alta',  'Alta'),
    ]
    severidad = models.CharField(
        max_length=10,
        choices=SEVERIDAD_CHOICES,
        default='baja',
        help_text='Nivel de riesgo del evento para el dashboard verde/amarillo/rojo.',
    )    
    
    detalle   = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'eventos_auditoria'
        verbose_name = 'Evento de auditoría'
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.get_tipo_display()} — Examen {self.examen_id}'


class PlantillaEvaluacion(models.Model):
    """
    Plantilla configurable que define QUÉ dimensiones evalúa la entrevista IA
    para un tipo de puesto (Técnico, Comercial, Liderazgo, Creativo, o custom).
    RRHH puede crear las suyas. (S4-01/S4-02)
    """
    nombre       = models.CharField(max_length=100, unique=True)
    descripcion  = models.TextField(blank=True)
    es_predefinida = models.BooleanField(default=False, help_text='Las 4 base del sistema no se pueden borrar')
    activa       = models.BooleanField(default=True)
    creada_por   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                     null=True, blank=True, related_name='plantillas_creadas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'plantillas_evaluacion'
        verbose_name = 'Plantilla de evaluación'
        verbose_name_plural = 'Plantillas de evaluación'

    def __str__(self):
        return self.nombre


class DimensionEvaluacion(models.Model):
    """
    Una dimensión dentro de una plantilla (ej: 'Comunicación', 'Resolución de
    problemas'). El peso de todas las dimensiones de una plantilla suma 100.
    """
    plantilla   = models.ForeignKey(PlantillaEvaluacion, on_delete=models.CASCADE, related_name='dimensiones')
    nombre      = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, help_text='Qué evalúa exactamente esta dimensión (guía para la IA)')
    peso        = models.PositiveIntegerField(help_text='Porcentaje 1-100. La suma de la plantilla debe dar 100.')
    orden       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'dimensiones_evaluacion'
        ordering = ['orden']
        verbose_name = 'Dimensión de evaluación'
        verbose_name_plural = 'Dimensiones de evaluación'

    def __str__(self):
        return f'{self.plantilla.nombre} · {self.nombre} ({self.peso}%)'


class EntrevistaIA(models.Model):
    """Entrevista conversacional por voz con Gemini Live (Sprint 4)."""
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('en_curso',   'En curso'),
        ('finalizada', 'Finalizada'),
        ('expirada',   'Expirada (tiempo agotado)'),
    ]

    candidato     = models.OneToOneField('candidatos.Candidato', on_delete=models.CASCADE, related_name='entrevista')
    plantilla     = models.ForeignKey(PlantillaEvaluacion, on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name='entrevistas')
    estado        = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    fecha_inicio  = models.DateTimeField(null=True, blank=True)
    fecha_fin     = models.DateTimeField(null=True, blank=True)
    duracion_minutos = models.PositiveIntegerField(default=30, help_text='Duración asignada (de la vacante). Techo 40.')
    transcripcion = models.TextField(blank=True)
    audio         = models.FileField(upload_to='entrevistas/%Y/%m/', null=True, blank=True)
    nota          = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    # Análisis multidimensional (S4-08): {"Comunicación": {"nota": 16, "peso": 25, "feedback": "..."}, ...}
    analisis_dimensiones = models.JSONField(default=dict, blank=True)
    resumen_ia    = models.TextField(blank=True, help_text='Resumen ejecutivo de la entrevista para RRHH')
    temas_criticos_cubiertos = models.JSONField(default=list, blank=True)
    # El system prompt exacto que se usó (auditoría/depuración)
    prompt_utilizado = models.TextField(blank=True)

    class Meta:
        db_table = 'entrevistas_ia'
        verbose_name = 'Entrevista IA'
        verbose_name_plural = 'Entrevistas IA'

    def __str__(self):
        return f'Entrevista {self.candidato.nombre_completo} ({self.estado})'


class CapturaAuditoria(models.Model):
    """
    Fotos de auditoría durante examen/entrevista: identidad inicial y
    capturas periódicas de webcam. (S4-10/S4-11)
    """
    TIPO_CHOICES = [
        ('identidad_inicial', 'Foto de identidad (inicio)'),
        ('periodica',         'Captura periódica'),
    ]
    ORIGEN_CHOICES = [
        ('examen',     'Durante el examen'),
        ('entrevista', 'Durante la entrevista'),
    ]

    candidato = models.ForeignKey('candidatos.Candidato', on_delete=models.CASCADE, related_name='capturas_auditoria')
    tipo      = models.CharField(max_length=25, choices=TIPO_CHOICES)
    origen    = models.CharField(max_length=15, choices=ORIGEN_CHOICES)
    imagen    = models.ImageField(upload_to='auditoria/%Y/%m/')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'capturas_auditoria'
        ordering = ['timestamp']
        verbose_name = 'Captura de auditoría'

    def __str__(self):
        return f'Entrevista de {self.candidato} — {self.get_estado_display()}'