# ==========================================
# evaluaciones/migrations/00XX_plantillas_predefinidas.py
# RENOMBRAR: ajusta el número al siguiente de tu carpeta de migraciones
# y el dependencies al nombre de la migración anterior (la que crea
# PlantillaEvaluacion — la generada por makemigrations tras actualizar models).
#
# Crea las 4 plantillas predefinidas del sistema (S4-02):
#   Técnico, Comercial, Liderazgo, Creativo
# ==========================================

from django.db import migrations


PLANTILLAS = {
    'Técnico': {
        'descripcion': 'Para puestos de desarrollo, TI e ingeniería.',
        'dimensiones': [
            ('Conocimiento técnico',       'Dominio real de las tecnologías del puesto, más allá de nombrarlas', 30),
            ('Resolución de problemas',    'Cómo razona ante casos prácticos, trade-offs y errores',             25),
            ('Comunicación',               'Claridad al explicar conceptos técnicos a distintos públicos',       20),
            ('Aprendizaje y adaptabilidad','Curiosidad, autoformación y reacción al cambio',                     15),
            ('Motivación y encaje',        'Interés genuino por el puesto y afinidad con el equipo',             10),
        ],
    },
    'Comercial': {
        'descripcion': 'Para ventas, atención al cliente y puestos de contacto.',
        'dimensiones': [
            ('Comunicación y persuasión',  'Energía, claridad y capacidad de convencer — la entrevista es su demo', 30),
            ('Orientación al cliente',     'Empatía, escucha y manejo de objeciones o clientes difíciles',          25),
            ('Orientación a resultados',   'Historias con metas, números y logros concretos',                       20),
            ('Resiliencia',                'Manejo del rechazo, presión y días malos',                              15),
            ('Motivación y encaje',        'Interés real por el rubro y el puesto',                                 10),
        ],
    },
    'Liderazgo': {
        'descripcion': 'Para jefaturas, coordinaciones y gerencias.',
        'dimensiones': [
            ('Liderazgo de equipos',       'Experiencia real dirigiendo personas: conflictos, motivación, delegación', 30),
            ('Visión estratégica',         'Pensamiento de largo plazo, priorización y toma de decisiones',            25),
            ('Comunicación ejecutiva',     'Claridad, escucha y manejo de conversaciones difíciles',                   20),
            ('Gestión de resultados',      'Logros medibles liderando iniciativas',                                    15),
            ('Autoconocimiento',           'Reconocimiento de errores propios y aprendizaje',                          10),
        ],
    },
    'Creativo': {
        'descripcion': 'Para marketing, diseño y puestos creativos.',
        'dimensiones': [
            ('Creatividad aplicada',       'Ideas originales con resultados reales, no solo inspiración',        30),
            ('Criterio y proceso',         'Cómo pasa de la idea a la ejecución: investigación, iteración',      25),
            ('Comunicación de ideas',      'Capacidad de "vender" y sustentar sus propuestas',                   20),
            ('Adaptabilidad',              'Manejo de feedback, cambios de brief y restricciones',               15),
            ('Motivación y encaje',        'Pasión genuina por el rubro y el puesto',                            10),
        ],
    },
}


def crear_plantillas(apps, schema_editor):
    Plantilla = apps.get_model('evaluaciones', 'PlantillaEvaluacion')
    Dimension = apps.get_model('evaluaciones', 'DimensionEvaluacion')
    for nombre, spec in PLANTILLAS.items():
        plantilla, creada = Plantilla.objects.get_or_create(
            nombre=nombre,
            defaults={'descripcion': spec['descripcion'], 'es_predefinida': True, 'activa': True},
        )
        if creada:
            for orden, (dim_nombre, dim_desc, peso) in enumerate(spec['dimensiones']):
                Dimension.objects.create(
                    plantilla=plantilla, nombre=dim_nombre,
                    descripcion=dim_desc, peso=peso, orden=orden,
                )


def eliminar_plantillas(apps, schema_editor):
    Plantilla = apps.get_model('evaluaciones', 'PlantillaEvaluacion')
    Plantilla.objects.filter(nombre__in=PLANTILLAS.keys(), es_predefinida=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        # AJUSTAR: el nombre de la migración generada por makemigrations
        # que crea PlantillaEvaluacion/DimensionEvaluacion, ej:
        ('evaluaciones', '0006_alter_entrevistaia_options_and_more'),
    ]

    operations = [
        migrations.RunPython(crear_plantillas, eliminar_plantillas),
    ]
