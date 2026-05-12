from django.db import models
from vacantes.models import Vacante

class Candidato(models.Model):
    ESTADOS = [
        ('registrado', 'Registrado'),
        ('cv_revisado', 'CV Revisado'),
        ('en_evaluacion', 'En Evaluación Técnica'),
        ('evaluado', 'Evaluado'),
        ('entrevista_ia', 'Entrevista IA'),
        ('entrevista_rrhh', 'Entrevista RRHH'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('contratado', 'Contratado'),
    ]
    
    GENEROS = [
        ('masculino', 'Masculino'),
        ('femenino', 'Femenino'),
        ('otro', 'Otro'),
        ('prefiero_no_decir', 'Prefiero no decir'),
    ]
    
    NIVEL_EDUCACION = [
        ('secundaria', 'Secundaria'),
        ('tecnico', 'Técnico'),
        ('universitario', 'Universitario'),
        ('bachiller', 'Bachiller'),
        ('maestria', 'Maestría'),
        ('doctorado', 'Doctorado'),
    ]
    
    # Información personal
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True)
    tipo_documento = models.CharField(max_length=20, choices=[('dni', 'DNI'), ('ce', 'Carné de Extranjería'), ('pasaporte', 'Pasaporte')], default='dni')
    numero_documento = models.CharField(max_length=20, unique=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(max_length=20, choices=GENEROS, default='prefiero_no_decir')
    
    # Contacto
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20)
    telefono_alternativo = models.CharField(max_length=20, blank=True)
    
    # Ubicación
    pais = models.CharField(max_length=100, default='Perú')
    ciudad = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200, blank=True)
    
    # Educación y experiencia
    nivel_educacion = models.CharField(max_length=20, choices=NIVEL_EDUCACION, default='universitario')
    institucion_educativa = models.CharField(max_length=200, blank=True)
    carrera = models.CharField(max_length=200, blank=True)
    años_experiencia = models.IntegerField(default=0, help_text="Años totales de experiencia")
    
    # LinkedIn y redes
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    
    # CV y documentos
    cv = models.FileField(upload_to='cvs/%Y/%m/')
    carta_presentacion = models.FileField(upload_to='cartas/%Y/%m/', blank=True, null=True)
    
    # Relación con vacante
    vacante = models.ForeignKey(Vacante, on_delete=models.CASCADE, related_name='candidatos')
    fuente = models.CharField(
        max_length=50,
        choices=[
            ('linkedin', 'LinkedIn'),
            ('computrabajo', 'Computrabajo'),
            ('bumeran', 'Bumeran'),
            ('referido', 'Referido'),
            ('web_corporativa', 'Web Corporativa'),
            ('otro', 'Otro'),
        ],
        default='web_corporativa'
    )
    
    # Estado y proceso
    estado = models.CharField(max_length=30, choices=ESTADOS, default='registrado')
    
    # Análisis de IA (se llenará después)
    cv_analizado = models.BooleanField(default=False)
    resumen_cv = models.TextField(blank=True, help_text="Resumen generado por IA")
    score_cv = models.IntegerField(null=True, blank=True, help_text="Puntuación del CV (0-100)")
    clasificacion_ia = models.CharField(
        max_length=30,
        choices=[
            ('altamente_recomendado', 'Altamente Recomendado'),
            ('recomendado', 'Recomendado'),
            ('requiere_revision', 'Requiere Revisión'),
            ('no_apto', 'No Apto'),
        ],
        blank=True
    )
    observaciones_ia = models.TextField(blank=True)
    
    # Evaluación técnica (se llenará en Sprint 3)
    score_tecnico = models.IntegerField(null=True, blank=True, help_text="Puntuación de prueba técnica (0-100)")
    fecha_evaluacion_tecnica = models.DateTimeField(null=True, blank=True)
    
    # Entrevista IA (se llenará en Sprint 4)
    score_entrevista = models.IntegerField(null=True, blank=True, help_text="Puntuación de entrevista IA (0-100)")
    feedback_entrevista = models.TextField(blank=True)
    fecha_entrevista_ia = models.DateTimeField(null=True, blank=True)
    
    # Score final
    score_final = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Promedio ponderado de todos los scores")
    
    # Observaciones finales RRHH
    observaciones_rrhh = models.TextField(blank=True)
    motivo_rechazo = models.TextField(blank=True)
    
    # Fechas
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'candidatos'
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['numero_documento']),
            models.Index(fields=['vacante', 'estado']),
        ]
    
    def __str__(self):
        return f"{self.nombre} {self.apellido_paterno} - {self.vacante.titulo}"
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido_paterno} {self.apellido_materno}".strip()
    
    def calcular_score_final(self):
        """Calcula el score final ponderado"""
        scores = []
        if self.score_cv:
            scores.append(('cv', self.score_cv, 0.30))  # 30%
        if self.score_tecnico:
            scores.append(('tecnico', self.score_tecnico, 0.40))  # 40%
        if self.score_entrevista:
            scores.append(('entrevista', self.score_entrevista, 0.30))  # 30%
        
        if scores:
            total = sum(score * peso for _, score, peso in scores)
            self.score_final = round(total, 2)
            self.save()
        
        return self.score_final