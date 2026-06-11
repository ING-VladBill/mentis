from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Carga las 16 áreas predefinidas del sistema MENTIS'

    def add_arguments(self, parser):
        parser.add_argument(
            '--actualizar',
            action='store_true',
            help='Actualiza los datos de áreas existentes en lugar de saltarlas',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Elimina todas las áreas no predefinidas antes de cargar',
        )

    def handle(self, *args, **options):
        from vacantes.models import Area

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== MENTIS: Cargando áreas predefinidas ===\n'))

        areas_data = [
            {
                'nombre': 'Tecnología / IT',
                'codigo_corto': 'TI',
                'descripcion': 'Desarrollo de software, infraestructura, ciberseguridad y soporte técnico.',
                'icono': 'monitor',
                'color': '#2E75B6',
                'instruccion_ia': (
                    'Evalúa conocimientos técnicos: lenguajes de programación, frameworks, '
                    'arquitectura de software, bases de datos, herramientas DevOps y metodologías ágiles. '
                    'Para roles senior, valora liderazgo técnico y decisiones de arquitectura.'
                ),
                'orden': 1,
            },
            {
                'nombre': 'Ventas / Comercial',
                'codigo_corto': 'VEN',
                'descripcion': 'Gestión comercial, ventas B2B/B2C, desarrollo de negocio y cuentas clave.',
                'icono': 'trending-up',
                'color': '#548235',
                'instruccion_ia': (
                    'Evalúa experiencia en ventas B2B/B2C, manejo de CRM, técnicas de cierre, '
                    'manejo de objeciones y métricas de ventas. Valora logros con números concretos: '
                    'porcentaje de cuota alcanzada, tamaño de cartera de clientes.'
                ),
                'orden': 2,
            },
            {
                'nombre': 'Marketing / Digital',
                'codigo_corto': 'MKT',
                'descripcion': 'Marketing digital, branding, contenido, redes sociales y analítica.',
                'icono': 'megaphone',
                'color': '#ED7D31',
                'instruccion_ia': (
                    'Evalúa marketing digital, SEO/SEM, redes sociales, analítica web, '
                    'gestión de campañas y métricas (ROAS, CTR, CAC). '
                    'Valora portfolio de campañas y casos de éxito medibles.'
                ),
                'orden': 3,
            },
            {
                'nombre': 'Recursos Humanos',
                'codigo_corto': 'RRHH',
                'descripcion': 'Gestión del talento, reclutamiento, capacitación y desarrollo organizacional.',
                'icono': 'users',
                'color': '#7030A0',
                'instruccion_ia': (
                    'Evalúa legislación laboral, procesos de reclutamiento, gestión del desempeño, '
                    'desarrollo organizacional y herramientas HRIS. '
                    'Valora indicadores: tiempo de contratación, retención, clima laboral.'
                ),
                'orden': 4,
            },
            {
                'nombre': 'Finanzas / Contabilidad',
                'codigo_corto': 'FIN',
                'descripcion': 'Gestión financiera, contabilidad, tesorería, auditoría y control.',
                'icono': 'dollar-sign',
                'color': '#C00000',
                'instruccion_ia': (
                    'Evalúa conocimientos contables, NIIF/IFRS, análisis financiero, '
                    'modelado financiero y herramientas como Excel avanzado, SAP o ERP. '
                    'Valora precisión y experiencia en auditorías.'
                ),
                'orden': 5,
            },
            {
                'nombre': 'Legal / Compliance',
                'codigo_corto': 'LEG',
                'descripcion': 'Asesoría jurídica, contratos, compliance y gestión de riesgos legales.',
                'icono': 'briefcase',
                'color': '#1F4E78',
                'instruccion_ia': (
                    'Evalúa formación jurídica, especialidad legal, legislación aplicable, '
                    'experiencia en contratos, litigios o compliance. '
                    'Para roles senior, valora gestión de equipos y decisiones estratégicas.'
                ),
                'orden': 6,
            },
            {
                'nombre': 'Operaciones',
                'codigo_corto': 'OPS',
                'descripcion': 'Gestión de procesos, optimización operativa y mejora continua.',
                'icono': 'settings',
                'color': '#595959',
                'instruccion_ia': (
                    'Evalúa gestión de procesos, KPIs operativos, metodologías Lean/Six Sigma '
                    'y experiencia en mejora continua. '
                    'Valora mejoras implementadas con impacto medible.'
                ),
                'orden': 7,
            },
            {
                'nombre': 'Atención al Cliente',
                'codigo_corto': 'ATC',
                'descripcion': 'Soporte al cliente, customer success y gestión de experiencia.',
                'icono': 'headphones',
                'color': '#00B0F0',
                'instruccion_ia': (
                    'Evalúa manejo de clientes, resolución de conflictos, métricas CSAT/NPS '
                    'y herramientas de soporte. '
                    'Valora empatía, comunicación efectiva y capacidad de resolución.'
                ),
                'orden': 8,
            },
            {
                'nombre': 'Administración',
                'codigo_corto': 'ADM',
                'descripcion': 'Gestión administrativa, secretariado y soporte organizacional.',
                'icono': 'clipboard',
                'color': '#808080',
                'instruccion_ia': (
                    'Evalúa gestión documental, organización, manejo de Office, '
                    'comunicación efectiva y soporte administrativo. '
                    'Valora orden, proactividad y manejo de múltiples tareas.'
                ),
                'orden': 9,
            },
            {
                'nombre': 'Salud / Medicina',
                'codigo_corto': 'SAL',
                'descripcion': 'Personal médico, enfermería, técnicos de salud y bienestar.',
                'icono': 'heart',
                'color': '#FF0000',
                'instruccion_ia': (
                    'Evalúa conocimientos médicos según especialidad, protocolos de atención, '
                    'manejo de equipos y normativa sanitaria. '
                    'Valora experiencia clínica y actualización continua.'
                ),
                'orden': 10,
            },
            {
                'nombre': 'Educación / Docencia',
                'codigo_corto': 'EDU',
                'descripcion': 'Docentes, coordinadores académicos, capacitadores y tutores.',
                'icono': 'book-open',
                'color': '#FFC000',
                'instruccion_ia': (
                    'Evalúa metodologías educativas, dominio de la especialidad, '
                    'manejo de herramientas pedagógicas y experiencia en formación. '
                    'Valora capacidad de comunicar conceptos complejos.'
                ),
                'orden': 11,
            },
            {
                'nombre': 'Diseño / UX',
                'codigo_corto': 'DIS',
                'descripcion': 'Diseño gráfico, UX/UI, dirección de arte y producción visual.',
                'icono': 'pen-tool',
                'color': '#FF69B4',
                'instruccion_ia': (
                    'Evalúa dominio de herramientas de diseño (Figma, Adobe Suite), '
                    'principios de diseño UX/UI, experiencia con sistemas de diseño y portfolio. '
                    'La experiencia práctica es más valorada que la formación teórica.'
                ),
                'orden': 12,
            },
            {
                'nombre': 'Producción / Manufactura',
                'codigo_corto': 'PRO',
                'descripcion': 'Operarios, supervisores de planta e ingenieros de producción.',
                'icono': 'package',
                'color': '#8B4513',
                'instruccion_ia': (
                    'Evalúa procesos industriales, control de calidad, seguridad industrial, '
                    'normativas ISO y herramientas de gestión de producción. '
                    'Valora experiencia en planta y manejo de equipos.'
                ),
                'orden': 13,
            },
            {
                'nombre': 'Logística / Supply Chain',
                'codigo_corto': 'LOG',
                'descripcion': 'Cadena de suministro, distribución, almacén e inventarios.',
                'icono': 'truck',
                'color': '#228B22',
                'instruccion_ia': (
                    'Evalúa gestión de cadena de suministro, distribución, control de inventarios, '
                    'costos logísticos y herramientas de gestión (WMS, ERP). '
                    'Valora optimización de procesos y reducción de costos.'
                ),
                'orden': 14,
            },
            {
                'nombre': 'I+D / Investigación',
                'codigo_corto': 'ID',
                'descripcion': 'Investigación y desarrollo, innovación y proyectos científicos.',
                'icono': 'flask',
                'color': '#4B0082',
                'instruccion_ia': (
                    'Evalúa metodología de investigación, dominio del área científica o técnica, '
                    'publicaciones o proyectos desarrollados y capacidad de innovación. '
                    'Valora pensamiento crítico y rigor científico.'
                ),
                'orden': 15,
            },
            {
                'nombre': 'Otro',
                'codigo_corto': 'OTR',
                'descripcion': 'Área especializada no contemplada en las categorías anteriores.',
                'icono': 'star',
                'color': '#A9A9A9',
                'instruccion_ia': (
                    'Evalúa los conocimientos específicos del área según los requisitos de la vacante. '
                    'Adapta las preguntas al perfil requerido considerando experiencia práctica, '
                    'formación y logros concretos.'
                ),
                'orden': 16,
            },
        ]

        actualizar = options['actualizar']
        creadas = 0
        actualizadas = 0
        existentes = 0
        errores = 0

        try:
            with transaction.atomic():
                for datos in areas_data:
                    codigo = datos['codigo_corto']
                    try:
                        area, creada = Area.objects.get_or_create(
                            codigo_corto=codigo,
                            defaults={**datos, 'es_predefinida': True, 'activa': True}
                        )

                        if creada:
                            creadas += 1
                            self.stdout.write(
                                self.style.SUCCESS(f'  ✓ Creada:   [{codigo}] {area.nombre}')
                            )
                        elif actualizar:
                            # Actualizar todos los campos excepto activa
                            # (respeta si el admin la desactivó manualmente)
                            for campo, valor in datos.items():
                                if campo != 'activa':
                                    setattr(area, campo, valor)
                            area.es_predefinida = True
                            area.save()
                            actualizadas += 1
                            self.stdout.write(
                                self.style.WARNING(f'  ~ Actualizada: [{codigo}] {area.nombre}')
                            )
                        else:
                            existentes += 1
                            self.stdout.write(
                                self.style.HTTP_INFO(f'  · Existente: [{codigo}] {area.nombre}')
                            )

                    except Exception as e:
                        errores += 1
                        self.stdout.write(
                            self.style.ERROR(f'  ✗ Error en [{codigo}]: {e}')
                        )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nError en la transacción: {e}'))
            return

        # Resumen final
        self.stdout.write('\n' + '─' * 45)
        if creadas:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Creadas:     {creadas}'))
        if actualizadas:
            self.stdout.write(self.style.WARNING(f'  ~ Actualizadas: {actualizadas}'))
        if existentes:
            self.stdout.write(f'  · Sin cambios:  {existentes}')
        if errores:
            self.stdout.write(self.style.ERROR(f'  ✗ Errores:     {errores}'))
        self.stdout.write('─' * 45)

        if errores == 0:
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ Proceso completado. Total: {creadas + actualizadas + existentes} áreas.\n'
            ))
        else:
            self.stdout.write(self.style.ERROR(
                f'\n⚠️  Proceso completado con {errores} error(es).\n'
            ))