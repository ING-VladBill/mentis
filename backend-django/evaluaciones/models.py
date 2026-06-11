# ==========================================
# evaluaciones/models.py (Sprint 3 - completo)
# REEMPLAZA tu evaluaciones/models.py actual.
# Luego: python manage.py makemigrations evaluaciones && python manage.py migrate
# Django es el DUEÑO del esquema. Spring Boot solo usa estas tablas.
# ==========================================

from django.db import models


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
    categoria           = models.CharField(max_length=100, blank=True)
    enunciado           = models.TextField()
    opciones            = models.TextField(blank=True, help_text='JSON serializado: ["A","B","C","D"]. Vacío si es abierta.')
    respuesta_correcta  = models.TextField(blank=True, help_text='MC: texto exacto de la opción. Abierta: criterios ideales.')
    puntos              = models.IntegerField(default=2)
    respuesta_candidato = models.TextField(blank=True)
    respondida_en       = models.DateTimeField(null=True, blank=True)
    es_correcta         = models.BooleanField(null=True, blank=True)
    puntos_obtenidos    = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    feedback_ia         = models.TextField(blank=True)

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
    detalle   = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'eventos_auditoria'
        verbose_name = 'Evento de auditoría'
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.get_tipo_display()} — Examen {self.examen_id}'


class EntrevistaIA(models.Model):
    """Estructura base de la entrevista IA (se implementa en Sprint 4)."""
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('en_curso',   'En curso'),
        ('finalizada', 'Finalizada'),
    ]

    candidato     = models.OneToOneField('candidatos.Candidato', on_delete=models.CASCADE, related_name='entrevista')
    estado        = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    fecha_inicio  = models.DateTimeField(null=True, blank=True)
    fecha_fin     = models.DateTimeField(null=True, blank=True)
    transcripcion = models.TextField(blank=True)
    audio         = models.FileField(upload_to='entrevistas/%Y/%m/', null=True, blank=True)
    nota          = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'entrevistas_ia'
        verbose_name = 'Entrevista IA'

    def __str__(self):
        return f'Entrevista de {self.candidato} — {self.get_estado_display()}'
