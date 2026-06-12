# Migración manual - Sprint 2
# Agrega sitio_web y direccion al modelo Empresa.
# Usados por feed Indeed y schema.org de Google for Jobs.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='empresa',
            name='sitio_web',
            field=models.URLField(
                blank=True,
                help_text='URL pública de la empresa. Ej: https://miempresa.com',
            ),
        ),
        migrations.AddField(
            model_name='empresa',
            name='direccion',
            field=models.CharField(
                max_length=300,
                blank=True,
                help_text='Dirección física. Ej: Av. Javier Prado 1234, San Isidro, Lima',
            ),
        ),
    ]
