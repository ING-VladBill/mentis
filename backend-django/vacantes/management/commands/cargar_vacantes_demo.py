# ==========================================
# vacantes/management/commands/cargar_vacantes_demo.py
# Puebla la base con vacantes de prueba realistas.
# Uso: python manage.py cargar_vacantes_demo
# ==========================================

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from vacantes.models import Vacante, Area
from usuarios.models import Usuario


class Command(BaseCommand):
    help = 'Carga vacantes de prueba realistas en distintas áreas'

    def handle(self, *args, **options):
        # Usuario creador (el primer admin que exista)
        creador = Usuario.objects.filter(rol='admin').first() or Usuario.objects.first()
        if not creador:
            self.stdout.write(self.style.ERROR(
                'No hay usuarios. Crea un superusuario primero: python manage.py createsuperuser'
            ))
            return

        def area(codigo):
            a = Area.objects.filter(codigo_corto=codigo).first()
            if not a:
                self.stdout.write(self.style.WARNING(
                    f'Área {codigo} no existe. Corre primero: python manage.py cargar_areas'
                ))
            return a

        hoy = timezone.now().date()

        vacantes = [
            {
                'titulo': 'Desarrollador Backend Python/Django',
                'area': area('TI'),
                'industria': 'software',
                'motivo_vacante': 'expansion',
                'jefe_directo': 'Líder de Ingeniería',
                'solicitante': 'Gerencia de Tecnología',
                'cantidad_posiciones': 2,
                'descripcion': 'Buscamos un desarrollador backend con experiencia en Python y Django para unirse a nuestro equipo de producto. Trabajarás en el diseño y desarrollo de APIs REST que dan vida a nuestra plataforma de reclutamiento con IA.',
                'responsabilidades': 'Diseñar y mantener APIs REST con Django REST Framework, Integrar servicios de IA como Google Gemini, Optimizar consultas a base de datos MySQL, Escribir pruebas unitarias y de integración, Participar en revisiones de código',
                'requisitos': 'Experiencia mínima de 3 años en Python, Dominio de Django y Django REST Framework, Conocimiento de bases de datos relacionales (MySQL/PostgreSQL), Manejo de Git y control de versiones, Inglés técnico de lectura',
                'requisitos_deseables': 'Experiencia con integración de modelos de IA/LLMs, Conocimiento de Docker y despliegue en la nube, Experiencia con Celery y tareas asíncronas',
                'habilidades': 'Resolución de problemas, Trabajo en equipo, Comunicación efectiva, Autonomía',
                'tecnologias': 'Python, Django, Django REST Framework, MySQL, Git, Docker',
                'nivel_experiencia': 'semi_senior',
                'anios_experiencia': 3,
                'nivel_educativo': 'Universitario en Ingeniería de Sistemas, Software o afines',
                'carrera_afin': 'Ingeniería de Sistemas, Ciencias de la Computación',
                'modalidad': 'hibrido',
                'tipo_contrato': 'indefinido',
                'horario': 'Lunes a viernes, 9:00 a 18:00',
                'horario_tipo': 'tiempo_completo',
                'ubicacion': 'San Isidro',
                'ciudad': 'Lima',
                'salario_minimo': Decimal('4500'),
                'salario_maximo': Decimal('6500'),
                'mostrar_salario': True,
                'beneficios': 'Seguro EPS, Trabajo híbrido, Capacitaciones pagadas, Bono por desempeño, Día libre de cumpleaños',
                'prioridad': 'alta',
                'fecha_limite': hoy + timedelta(days=30),
            },
            {
                'titulo': 'Ejecutivo de Ventas Corporativas',
                'area': area('VEN'),
                'industria': 'servicios',
                'motivo_vacante': 'nuevo_puesto',
                'jefe_directo': 'Gerente Comercial',
                'solicitante': 'Gerencia Comercial',
                'cantidad_posiciones': 3,
                'descripcion': 'Estamos en búsqueda de ejecutivos de ventas corporativas orientados a resultados para expandir nuestra cartera de clientes B2B. Serás responsable de identificar oportunidades y cerrar negocios con grandes cuentas.',
                'responsabilidades': 'Prospectar y captar nuevos clientes corporativos, Gestionar el ciclo completo de ventas, Elaborar propuestas comerciales, Cumplir metas mensuales de venta, Mantener relaciones de largo plazo con clientes',
                'requisitos': 'Experiencia mínima de 2 años en ventas B2B, Habilidades de negociación y cierre, Orientación a resultados, Manejo de CRM, Disponibilidad para visitas a clientes',
                'requisitos_deseables': 'Cartera de clientes propia, Experiencia en venta de servicios o tecnología, Estudios en administración o marketing',
                'habilidades': 'Negociación, Comunicación persuasiva, Resiliencia, Orientación al cliente',
                'tecnologias': 'Salesforce, HubSpot, Microsoft Office',
                'nivel_experiencia': 'semi_senior',
                'anios_experiencia': 2,
                'nivel_educativo': 'Técnico o universitario en Administración, Marketing o afines',
                'carrera_afin': 'Administración, Marketing, Negocios',
                'modalidad': 'presencial',
                'tipo_contrato': 'indefinido',
                'horario': 'Lunes a viernes, 9:00 a 18:00',
                'horario_tipo': 'tiempo_completo',
                'ubicacion': 'Miraflores',
                'ciudad': 'Lima',
                'salario_minimo': Decimal('2500'),
                'salario_maximo': Decimal('3500'),
                'mostrar_salario': True,
                'beneficios': 'Comisiones sin tope, Seguro EPS, Movilidad, Capacitación en ventas, Línea de carrera',
                'prioridad': 'urgente',
                'fecha_limite': hoy + timedelta(days=20),
            },
            {
                'titulo': 'Asesor de Atención al Cliente',
                'area': area('ATC'),
                'industria': 'servicios',
                'motivo_vacante': 'campana',
                'jefe_directo': 'Supervisor de Contact Center',
                'solicitante': 'Jefatura de Operaciones',
                'cantidad_posiciones': 5,
                'descripcion': 'Buscamos asesores de atención al cliente con vocación de servicio para nuestro contact center. Brindarás soporte de calidad a nuestros clientes por canales telefónicos y digitales.',
                'responsabilidades': 'Atender llamadas y chats de clientes, Resolver consultas y reclamos en primer nivel, Registrar incidencias en el sistema, Escalar casos complejos, Cumplir indicadores de calidad',
                'requisitos': 'Secundaria completa, Experiencia de 6 meses en atención al cliente, Buena comunicación oral y escrita, Manejo básico de computadora, Disponibilidad para turnos rotativos',
                'requisitos_deseables': 'Experiencia en contact center, Estudios técnicos en curso, Conocimiento de herramientas CRM',
                'habilidades': 'Empatía, Escucha activa, Paciencia, Trabajo bajo presión',
                'tecnologias': 'Zendesk, Microsoft Teams',
                'nivel_experiencia': 'junior',
                'anios_experiencia': 1,
                'nivel_educativo': 'Secundaria completa, técnico deseable',
                'carrera_afin': 'No indispensable',
                'modalidad': 'presencial',
                'tipo_contrato': 'plazo_fijo',
                'horario': 'Turnos rotativos de 8 horas',
                'horario_tipo': 'turnos',
                'ubicacion': 'La Victoria',
                'ciudad': 'Lima',
                'salario_minimo': Decimal('1200'),
                'salario_maximo': Decimal('1500'),
                'mostrar_salario': True,
                'beneficios': 'Seguro EPS, Capacitación pagada, Bono por productividad, Comedor',
                'prioridad': 'media',
                'fecha_limite': hoy + timedelta(days=15),
            },
            {
                'titulo': 'Analista de Marketing Digital',
                'area': area('MKT'),
                'industria': 'software',
                'motivo_vacante': 'reemplazo',
                'nombre_reemplazado': 'Persona que dejó el cargo',
                'jefe_directo': 'Gerente de Marketing',
                'solicitante': 'Gerencia de Marketing',
                'cantidad_posiciones': 1,
                'descripcion': 'Buscamos un analista de marketing digital creativo y analítico para gestionar nuestras campañas en medios digitales y redes sociales, optimizando la generación de leads y el posicionamiento de marca.',
                'responsabilidades': 'Planificar y ejecutar campañas en Google Ads y Meta Ads, Gestionar redes sociales, Analizar métricas y elaborar reportes, Optimizar el SEO del sitio web, Coordinar con diseño la creación de contenido',
                'requisitos': 'Experiencia de 2 años en marketing digital, Manejo de Google Ads y Meta Business Suite, Conocimiento de Google Analytics, Dominio de redes sociales, Capacidad analítica',
                'requisitos_deseables': 'Certificaciones en Google Ads, Conocimiento de SEO/SEM, Manejo de herramientas de email marketing',
                'habilidades': 'Creatividad, Análisis de datos, Organización, Comunicación',
                'tecnologias': 'Google Ads, Meta Business Suite, Google Analytics, Canva, Mailchimp',
                'nivel_experiencia': 'semi_senior',
                'anios_experiencia': 2,
                'nivel_educativo': 'Universitario en Marketing, Comunicaciones o afines',
                'carrera_afin': 'Marketing, Comunicaciones, Publicidad',
                'modalidad': 'remoto',
                'tipo_contrato': 'indefinido',
                'horario': 'Lunes a viernes, horario flexible',
                'horario_tipo': 'flexible',
                'ubicacion': '',
                'ciudad': 'Lima',
                'salario_minimo': Decimal('3000'),
                'salario_maximo': Decimal('4200'),
                'mostrar_salario': True,
                'beneficios': 'Trabajo 100% remoto, Horario flexible, Capacitaciones, Seguro EPS',
                'prioridad': 'media',
                'fecha_limite': hoy + timedelta(days=25),
            },
            {
                'titulo': 'Contador Senior',
                'area': area('FIN'),
                'industria': 'servicios',
                'motivo_vacante': 'nuevo_puesto',
                'jefe_directo': 'Gerente de Administración y Finanzas',
                'solicitante': 'Gerencia de Finanzas',
                'cantidad_posiciones': 1,
                'descripcion': 'Requerimos un contador senior con sólida experiencia en contabilidad general y tributación peruana para liderar el área contable y asegurar el cumplimiento de las obligaciones fiscales de la empresa.',
                'responsabilidades': 'Supervisar el cierre contable mensual, Elaborar estados financieros, Gestionar declaraciones tributarias (SUNAT), Coordinar auditorías, Supervisar al equipo contable',
                'requisitos': 'Título de Contador Público Colegiado, Experiencia de 5 años en contabilidad, Dominio de tributación peruana, Manejo de sistemas contables, Conocimiento de NIIF',
                'requisitos_deseables': 'Experiencia liderando equipos, Manejo de SAP, Estudios de especialización tributaria',
                'habilidades': 'Análisis numérico, Atención al detalle, Liderazgo, Ética profesional',
                'tecnologias': 'SAP, Concar, Excel avanzado, SUNAT Operaciones en Línea',
                'nivel_experiencia': 'senior',
                'anios_experiencia': 5,
                'nivel_educativo': 'Universitario - Contador Público Colegiado',
                'carrera_afin': 'Contabilidad',
                'modalidad': 'presencial',
                'tipo_contrato': 'indefinido',
                'horario': 'Lunes a viernes, 8:30 a 17:30',
                'horario_tipo': 'tiempo_completo',
                'ubicacion': 'San Borja',
                'ciudad': 'Lima',
                'salario_minimo': Decimal('5000'),
                'salario_maximo': Decimal('7000'),
                'mostrar_salario': False,
                'beneficios': 'Seguro EPS y vida ley, Bono anual, Capacitaciones, Estacionamiento',
                'prioridad': 'alta',
                'fecha_limite': hoy + timedelta(days=30),
            },
            {
                'titulo': 'Practicante de Recursos Humanos',
                'area': area('RRHH'),
                'industria': 'servicios',
                'motivo_vacante': 'nuevo_puesto',
                'jefe_directo': 'Jefe de Recursos Humanos',
                'solicitante': 'Jefatura de RRHH',
                'cantidad_posiciones': 2,
                'descripcion': 'Oportunidad para practicantes de últimos ciclos que deseen desarrollarse en el área de Recursos Humanos, apoyando en procesos de reclutamiento, selección y gestión del talento.',
                'responsabilidades': 'Apoyar en publicación de vacantes y filtro de CVs, Coordinar entrevistas, Apoyar en la inducción de nuevos colaboradores, Gestionar documentación del personal, Apoyar en actividades de clima laboral',
                'requisitos': 'Estudiante de últimos ciclos de Psicología, Administración o RRHH, Disponibilidad para realizar prácticas, Manejo de Office, Proactividad, Buena comunicación',
                'requisitos_deseables': 'Experiencia previa en prácticas de RRHH, Conocimiento de procesos de reclutamiento',
                'habilidades': 'Organización, Discreción, Empatía, Trabajo en equipo',
                'tecnologias': 'Microsoft Office, LinkedIn',
                'nivel_experiencia': 'practicante',
                'anios_experiencia': 0,
                'nivel_educativo': 'Estudiante universitario de últimos ciclos',
                'carrera_afin': 'Psicología, Administración, Relaciones Industriales',
                'modalidad': 'presencial',
                'tipo_contrato': 'practicas',
                'horario': 'Lunes a viernes, 30 horas semanales',
                'horario_tipo': 'medio_tiempo',
                'ubicacion': 'San Isidro',
                'ciudad': 'Lima',
                'salario_minimo': Decimal('1025'),
                'salario_maximo': Decimal('1100'),
                'mostrar_salario': True,
                'beneficios': 'Subvención económica, Certificado de prácticas, Capacitación, Posibilidad de quedar contratado',
                'prioridad': 'baja',
                'fecha_limite': hoy + timedelta(days=20),
            },
        ]

        creadas = 0
        omitidas = 0
        for v in vacantes:
            if not v['area']:
                omitidas += 1
                continue
            # Evitar duplicados por título
            if Vacante.objects.filter(titulo=v['titulo']).exists():
                self.stdout.write(self.style.WARNING(f'  Ya existe: {v["titulo"]}'))
                omitidas += 1
                continue
            v['creado_por'] = creador
            v['estado'] = 'abierta'  # publicadas para que se vean
            vacante = Vacante.objects.create(**v)
            vacante.fecha_publicacion = timezone.now()
            vacante.save(update_fields=['fecha_publicacion'])
            creadas += 1
            self.stdout.write(self.style.SUCCESS(f'  ✓ {vacante.codigo} — {vacante.titulo}'))

        self.stdout.write(self.style.SUCCESS(
            f'\n{creadas} vacantes creadas, {omitidas} omitidas.'
        ))
