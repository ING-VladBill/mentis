# Generated manually - Sprint 2
# Agrega textos_editados: almacena los textos de publicación
# editados por RRHH (sobreescribe los generados automáticamente).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vacantes', '0004_vacante_cantidad_posiciones_vacante_confidencial_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vacante',
            name='textos_editados',
            field=models.JSONField(
                default=dict,
                blank=True,
                help_text=(
                    'Textos de publicación editados por RRHH. '
                    'Si está vacío, se generan automáticamente.'
                ),
            ),
        ),
    ]
