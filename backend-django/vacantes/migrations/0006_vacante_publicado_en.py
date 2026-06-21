# Migración manual - Sprint 2
# Agrega publicado_en: registra cuándo se publicó la vacante en cada canal.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vacantes', '0005_vacante_textos_editados'),
    ]

    operations = [
        migrations.AddField(
            model_name='vacante',
            name='publicado_en',
            field=models.JSONField(
                default=dict,
                blank=True,
                help_text=(
                    'Registro de cuándo se publicó la vacante en cada canal. '
                    'Ej: {"sistema": "2026-06-12T10:00:00", "linkedin": "2026-06-12"}'
                ),
            ),
        ),
    ]
