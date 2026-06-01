# ==========================================
# candidatos/management/commands/revisar_buzon.py
# ==========================================

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Revisa el buzón IMAP y procesa los CVs recibidos por correo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--loop',
            action='store_true',
            help='Ejecutar en loop continuo (revisar cada N minutos)',
        )
        parser.add_argument(
            '--intervalo',
            type=int,
            default=5,
            help='Intervalo en minutos entre revisiones (default: 5)',
        )

    def handle(self, *args, **options):
        from candidatos.servicios.buzon_imap import revisar_buzon

        if options['loop']:
            import time
            intervalo = options['intervalo'] * 60
            self.stdout.write(self.style.SUCCESS(
                f'\n🔄 Revisando buzón cada {options["intervalo"]} minutos. Ctrl+C para detener.\n'
            ))
            while True:
                self._revisar(revisar_buzon)
                time.sleep(intervalo)
        else:
            self._revisar(revisar_buzon)

    def _revisar(self, fn):
        from django.utils import timezone
        self.stdout.write(f'\n[{timezone.now().strftime("%H:%M:%S")}] Revisando buzón...')
        resultado = fn()
        self.stdout.write(self.style.SUCCESS(
            f'  ✅ Candidatos creados: {resultado["procesados"]}'
        ))
        if resultado['errores']:
            for err in resultado['errores']:
                self.stdout.write(self.style.WARNING(f'  ⚠️  {err}'))
