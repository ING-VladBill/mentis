# Migración manual - Sprint 3
# Reconcilia el esquema de evaluaciones con el models.py actual.
# El 0001_initial usaba un esquema viejo (RespuestaExamen, PreguntaEntrevista, etc.)
# Este 0002 borra las tablas viejas y crea las nuevas correctas para Spring Boot.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('candidatos', '0001_initial'),
        ('vacantes', '0001_initial'),
        ('evaluaciones', '0001_initial'),
    ]

    operations = [
        # 1. Eliminar tablas del esquema viejo que ya no existen en models.py
        migrations.DeleteModel(name='RespuestaExamen'),
        migrations.DeleteModel(name='PreguntaEntrevista'),
        migrations.DeleteModel(name='PreguntaExamen'),
        migrations.DeleteModel(name='Examen'),
        migrations.DeleteModel(name='EntrevistaIA'),

        # 2. Crear Examen con el esquema nuevo (el que usa Spring Boot)
        migrations.CreateModel(
            name='Examen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('estado', models.CharField(
                    choices=[
                        ('pendiente',  'Pendiente de generar'),
                        ('generado',   'Generado (preguntas listas)'),
                        ('en_curso',   'En curso'),
                        ('finalizado', 'Finalizado'),
                        ('expirado',   'Expirado (se acabó el tiempo)'),
                    ],
                    default='pendiente', max_length=20
                )),
                ('duracion_minutos', models.IntegerField(default=45)),
                ('total_preguntas',  models.IntegerField(default=10)),
                ('fecha_generacion', models.DateTimeField(blank=True, null=True)),
                ('fecha_inicio',     models.DateTimeField(blank=True, null=True)),
                ('fecha_fin',        models.DateTimeField(blank=True, null=True)),
                ('nota',    models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('aprobado', models.BooleanField(blank=True, null=True)),
                ('candidato', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='examen',
                    to='candidatos.candidato'
                )),
                ('vacante', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='examenes',
                    to='vacantes.vacante'
                )),
            ],
            options={'verbose_name': 'Examen', 'db_table': 'examenes'},
        ),

        # 3. Crear PreguntaExamen con el esquema nuevo
        migrations.CreateModel(
            name='PreguntaExamen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('orden',    models.IntegerField()),
                ('tipo',     models.CharField(
                    choices=[('multiple', 'Opción múltiple'), ('abierta', 'Respuesta abierta')],
                    default='multiple', max_length=10
                )),
                ('categoria', models.CharField(blank=True, max_length=100)),
                ('enunciado', models.TextField()),
                ('opciones',  models.TextField(blank=True,
                    help_text='JSON serializado: ["A","B","C","D"]. Vacío si es abierta.')),
                ('respuesta_correcta', models.TextField(blank=True,
                    help_text='MC: texto exacto de la opción. Abierta: criterios ideales.')),
                ('puntos', models.IntegerField(default=2)),
                ('respuesta_candidato', models.TextField(blank=True)),
                ('respondida_en',    models.DateTimeField(blank=True, null=True)),
                ('es_correcta',      models.BooleanField(blank=True, null=True)),
                ('puntos_obtenidos', models.DecimalField(blank=True, decimal_places=1, max_digits=3, null=True)),
                ('feedback_ia',      models.TextField(blank=True)),
                ('examen', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='preguntas',
                    to='evaluaciones.examen'
                )),
            ],
            options={'db_table': 'preguntas_examen', 'ordering': ['orden'],
                     'verbose_name': 'Pregunta de examen'},
        ),

        # 4. Crear EventoAuditoria (nueva, no existía antes)
        migrations.CreateModel(
            name='EventoAuditoria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(
                    choices=[
                        ('perdida_foco',   'Pérdida de foco de la pestaña'),
                        ('cambio_ventana', 'Cambio de ventana (Alt+Tab)'),
                        ('copy_paste',     'Intento de copiar/pegar'),
                        ('click_derecho',  'Click derecho'),
                        ('devtools',       'Intento de abrir DevTools'),
                        ('inactividad',    'Inactividad prolongada'),
                        ('otro',           'Otro'),
                    ],
                    default='otro', max_length=20
                )),
                ('severidad', models.CharField(
                    choices=[('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta')],
                    default='baja', max_length=10,
                    help_text='Nivel de riesgo del evento para el dashboard verde/amarillo/rojo.',
                )),
                ('detalle',   models.TextField(blank=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('examen', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='eventos',
                    to='evaluaciones.examen'
                )),
            ],
            options={'verbose_name': 'Evento de auditoría', 'db_table': 'eventos_auditoria',
                     'ordering': ['timestamp']},
        ),

        # 5. Recrear EntrevistaIA con el esquema simplificado del models.py actual
        migrations.CreateModel(
            name='EntrevistaIA',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('estado', models.CharField(
                    choices=[
                        ('pendiente',  'Pendiente'),
                        ('en_curso',   'En curso'),
                        ('finalizada', 'Finalizada'),
                    ],
                    default='pendiente', max_length=20
                )),
                ('fecha_inicio',  models.DateTimeField(blank=True, null=True)),
                ('fecha_fin',     models.DateTimeField(blank=True, null=True)),
                ('transcripcion', models.TextField(blank=True)),
                ('audio', models.FileField(blank=True, null=True, upload_to='entrevistas/%Y/%m/')),
                ('nota', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('candidato', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='entrevista',
                    to='candidatos.candidato'
                )),
            ],
            options={'verbose_name': 'Entrevista IA', 'db_table': 'entrevistas_ia'},
        ),
    ]
