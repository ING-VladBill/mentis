# ==========================================
# evaluaciones/models.py
# ==========================================

from django.db import models
from django.conf import settings


class Examen(models.Model):

    ESTADO_CHOICES = [
        ('generado',   'Generado'),
        ('enviado',    'Enviado al candidato'),
        ('en_curso',   'En curso'),
        ('completado', 'Completado'),
        ('expirado',   'Expirado'),
    ]

    candidato = models.OneToOneField(
        'candidatos.Candidato',
        on_delete=models.CASCADE,
        related_name='examen'
    )
    vacante = models.ForeignKey(
        'vacantes.Vacante',
        on_delete=models.CASCADE,
        related_name='examenes'
    )

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='generado')

    # Configuración
    duracion_minutos = models.IntegerField(default=45)
    nota_maxima      = models.IntegerField(default=20)
    nota_minima      = models.DecimalField(max_digits=4, decimal_places=2, default=13.00)

    # Resultado
    nota_obtenida = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    aprobado      = models.BooleanField(null=True, blank=True)
    feedback_ia   = models.TextField(blank=True)

    # Control de tiempo
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_inicio     = models.DateTimeField(null=True, blank=True)
    fecha_fin        = models.DateTimeField(null=True, blank=True)
    tiempo_usado_min = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table   = 'examenes'
        verbose_name = 'Examen'

    def __str__(self):
        return f'Examen de {self.candidato.nombre_completo}'

    @property
    def puede_retomar(self):
        """El candidato puede retomar si no ha finalizado y no expiró el token."""
        return self.estado == 'en_curso'

    @property
    def tiempo_restante_minutos(self):
        if not self.fecha_inicio or self.estado != 'en_curso':
            return None
        from django.utils import timezone
        import math
        transcurrido = (timezone.now() - self.fecha_inicio).total_seconds() / 60
        return max(0, math.ceil(self.duracion_minutos - transcurrido))


class PreguntaExamen(models.Model):

    TIPO_CHOICES = [
        ('multiple', 'Opción múltiple'),
        ('abierta',  'Pregunta abierta'),
    ]

    examen    = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name='preguntas')
    orden     = models.IntegerField()
    categoria = models.CharField(max_length=100, help_text='Tecnología/habilidad que evalúa')
    tipo      = models.CharField(max_length=10, choices=TIPO_CHOICES)
    enunciado = models.TextField()
    puntos    = models.IntegerField(default=2)

    # Para opción múltiple
    opcion_a         = models.CharField(max_length=500, blank=True)
    opcion_b         = models.CharField(max_length=500, blank=True)
    opcion_c         = models.CharField(max_length=500, blank=True)
    opcion_d         = models.CharField(max_length=500, blank=True)
    respuesta_correcta = models.CharField(
        max_length=1,
        choices=[('A','A'),('B','B'),('C','C'),('D','D')],
        blank=True
    )

    # Para pregunta abierta
    respuesta_esperada    = models.TextField(blank=True)
    criterios_evaluacion  = models.JSONField(default=list)

    # Metadatos IA
    dificultad = models.CharField(
        max_length=10,
        choices=[('baja','Baja'),('media','Media'),('alta','Alta')],
        default='media'
    )

    class Meta:
        db_table  = 'preguntas_examen'
        ordering  = ['orden']

    def __str__(self):
        return f'P{self.orden}: {self.enunciado[:60]}...'


class RespuestaExamen(models.Model):

    pregunta  = models.OneToOneField(PreguntaExamen, on_delete=models.CASCADE, related_name='respuesta')
    candidato = models.ForeignKey('candidatos.Candidato', on_delete=models.CASCADE)

    # Respuesta del candidato
    respuesta_seleccionada = models.CharField(max_length=1, blank=True)   # Para MC
    respuesta_texto        = models.TextField(blank=True)                   # Para abiertas

    # Calificación
    es_correcta    = models.BooleanField(null=True, blank=True)
    puntaje        = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    feedback_ia    = models.TextField(blank=True)

    fecha_respuesta = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'respuestas_examen'

    def __str__(self):
        return f'Respuesta P{self.pregunta.orden} - {self.candidato.nombre_completo}'


class EntrevistaIA(models.Model):

    ESTADO_CHOICES = [
        ('pendiente',   'Pendiente'),
        ('en_curso',    'En curso'),
        ('completada',  'Completada'),
        ('error',       'Error técnico'),
    ]

    candidato = models.OneToOneField(
        'candidatos.Candidato',
        on_delete=models.CASCADE,
        related_name='entrevista'
    )
    vacante   = models.ForeignKey('vacantes.Vacante', on_delete=models.CASCADE)

    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    modalidad = models.CharField(
        max_length=10,
        choices=[('texto','Texto'),('audio','Audio')],
        default='texto'
    )

    # Scoring multidimensional (0-20)
    nota_final          = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dim_claridad        = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dim_coherencia      = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dim_precision       = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dim_comunicacion    = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    dim_seguridad       = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    feedback_general    = models.TextField(blank=True)
    feedback_por_dimension = models.JSONField(default=dict)

    fecha_inicio     = models.DateTimeField(null=True, blank=True)
    fecha_fin        = models.DateTimeField(null=True, blank=True)
    fecha_creacion   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table   = 'entrevistas_ia'
        verbose_name = 'Entrevista IA'

    def __str__(self):
        return f'Entrevista de {self.candidato.nombre_completo}'

    def calcular_nota_final(self):
        """
        Claridad 20% + Coherencia 20% + Precisión 30% + Comunicación 20% + Seguridad 10%
        Cada dimensión en escala 0-10, resultado final en 0-20.
        """
        dims = {
            'claridad':     (self.dim_claridad,     0.20),
            'coherencia':   (self.dim_coherencia,   0.20),
            'precision':    (self.dim_precision,    0.30),
            'comunicacion': (self.dim_comunicacion, 0.20),
            'seguridad':    (self.dim_seguridad,    0.10),
        }
        total = 0
        for nombre, (valor, peso) in dims.items():
            if valor is not None:
                total += float(valor) * peso

        self.nota_final = round(total * 2, 2)  # Escalar de 0-10 a 0-20
        self.save(update_fields=['nota_final'])
        return self.nota_final


class PreguntaEntrevista(models.Model):

    TIPO_CHOICES = [
        ('tecnica',       'Técnica'),
        ('comportamental','Comportamental (STAR)'),
        ('situacional',   'Situacional'),
    ]

    entrevista = models.ForeignKey(EntrevistaIA, on_delete=models.CASCADE, related_name='preguntas')
    orden      = models.IntegerField()
    tipo       = models.CharField(max_length=20, choices=TIPO_CHOICES)
    pregunta   = models.TextField()
    dimension_principal = models.CharField(max_length=20, blank=True)

    # Respuesta del candidato
    respuesta_texto  = models.TextField(blank=True)
    audio_archivo    = models.FileField(upload_to='entrevistas/audio/', null=True, blank=True)
    transcripcion    = models.TextField(blank=True, help_text='Transcripción del audio via Whisper')

    # Evaluación IA
    puntaje_claridad    = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    puntaje_coherencia  = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    puntaje_precision   = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    feedback_ia         = models.TextField(blank=True)

    fecha_respuesta = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'preguntas_entrevista'
        ordering = ['orden']

    def __str__(self):
        return f'E{self.orden}: {self.pregunta[:60]}...'
