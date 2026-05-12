from django.db import models
from django.contrib.auth.models import User

class Vacante(models.Model):
    ESTADOS = [
        ('borrador', 'Borrador'),
        ('abierta', 'Abierta'),
        ('cerrada', 'Cerrada'),
        ('pausada', 'Pausada'),
        ('cancelada', 'Cancelada'),
    ]
    
    NIVELES = [
        ('junior', 'Junior (0-2 años)'),
        ('semi_senior', 'Semi Senior (2-5 años)'),
        ('senior', 'Senior (5+ años)'),
        ('lead', 'Tech Lead'),
        ('manager', 'Manager'),
    ]
    
    MODALIDADES = [
        ('presencial', 'Presencial'),
        ('remoto', 'Remoto'),
        ('hibrido', 'Híbrido'),
    ]
    
    TIPOS_CONTRATO = [
        ('indefinido', 'Indefinido'),
        ('temporal', 'Temporal'),
        ('practicas', 'Prácticas'),
        ('freelance', 'Freelance'),
    ]
    
    # Información básica
    titulo = models.CharField(max_length=200)
    codigo = models.CharField(max_length=20, unique=True, help_text="Código único de la vacante")
    area = models.CharField(max_length=100)
    departamento = models.CharField(max_length=100, blank=True)
    
    # Descripción
    descripcion = models.TextField()
    requisitos = models.TextField()
    responsabilidades = models.TextField(blank=True)
    beneficios = models.TextField(blank=True)
    
    # Habilidades y tecnologías
    habilidades = models.TextField(help_text="Separadas por comas")
    tecnologias = models.TextField(blank=True, help_text="Separadas por comas")
    idiomas = models.CharField(max_length=200, blank=True, help_text="Ejemplo: Español (nativo), Inglés (intermedio)")
    
    # Detalles del puesto
    nivel_experiencia = models.CharField(max_length=20, choices=NIVELES)
    modalidad = models.CharField(max_length=20, choices=MODALIDADES, default='presencial')
    tipo_contrato = models.CharField(max_length=20, choices=TIPOS_CONTRATO, default='indefinido')
    
    # Ubicación
    pais = models.CharField(max_length=100, default='Perú')
    ciudad = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200, blank=True)
    
    # Información salarial
    salario_minimo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salario_maximo = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    moneda = models.CharField(max_length=10, default='PEN')
    
    # Vacantes y proceso
    numero_vacantes = models.IntegerField(default=1)
    prioridad = models.CharField(
        max_length=10,
        choices=[('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta'), ('urgente', 'Urgente')],
        default='media'
    )
    
    # Estado y fechas
    estado = models.CharField(max_length=20, choices=ESTADOS, default='borrador')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_cierre = models.DateField(null=True, blank=True, help_text="Fecha límite para postular")
    
    # Auditoría
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='vacantes_creadas')
    
    class Meta:
        db_table = 'vacantes'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['estado', 'fecha_creacion']),
            models.Index(fields=['codigo']),
        ]
    
    def __str__(self):
        return f"[{self.codigo}] {self.titulo} - {self.area}"
    
    @property
    def total_candidatos(self):
        return self.candidatos.count()
    
    @property
    def candidatos_aprobados(self):
        return self.candidatos.filter(estado='aprobado').count()