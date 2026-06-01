# ==========================================
# candidatos/servicios/buzon_imap.py
# Revisa el buzón de correo y procesa CVs automáticamente
# ==========================================

import imaplib
import email
import logging
import re
import tempfile
import os
from email.header import decode_header
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _decodificar_header(valor):
    """Decodifica headers de correo (pueden venir codificados)."""
    if not valor:
        return ''
    partes = decode_header(valor)
    resultado = ''
    for parte, encoding in partes:
        if isinstance(parte, bytes):
            resultado += parte.decode(encoding or 'utf-8', errors='replace')
        else:
            resultado += parte
    return resultado


def _extraer_codigo_vacante(destinatario: str) -> str | None:
    """
    Extrae el código de vacante del email destinatario.
    Formato: postulaciones-TI-2025-001@mentis.com → TI-2025-001
    """
    match = re.search(r'postulaciones-([A-Z]+-\d{4}-\d{3})', destinatario, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return None


def _extraer_email_remitente(from_header: str) -> str | None:
    """Extrae el email del campo From del correo."""
    match = re.search(r'[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}', from_header)
    return match.group(0) if match else None


def revisar_buzon():
    """
    Función principal. Revisa el buzón IMAP y procesa los CVs encontrados.
    Debe ejecutarse periódicamente (ej: cada 5 min con un cron o Celery Beat).

    Uso manual: python manage.py shell → from candidatos.servicios.buzon_imap import revisar_buzon → revisar_buzon()
    """
    from vacantes.models import Vacante
    from candidatos.models import Candidato
    from candidatos.servicios.analisis_cv import extraer_texto_pdf
    from candidatos.servicios.correos import enviar_correo_avance_cv

    email_host  = settings.EMAIL_HOST_USER
    email_pass  = settings.EMAIL_HOST_PASSWORD

    if not email_host or not email_pass:
        logger.error('No hay credenciales SMTP configuradas en .env')
        return {'procesados': 0, 'errores': ['Sin credenciales SMTP']}

    procesados = 0
    errores    = []

    try:
        # Conectar al servidor IMAP de Gmail
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        mail.login(email_host, email_pass)
        mail.select('inbox')

        # Buscar correos no leídos
        _, mensajes = mail.search(None, 'UNSEEN')
        ids = mensajes[0].split()

        logger.info(f'Buzón IMAP: {len(ids)} correo(s) no leído(s) encontrado(s)')

        for num in ids:
            try:
                _, data = mail.fetch(num, '(RFC822)')
                msg = email.message_from_bytes(data[0][1])

                # Datos del correo
                destinatario = _decodificar_header(msg.get('To', ''))
                remitente    = _decodificar_header(msg.get('From', ''))
                asunto       = _decodificar_header(msg.get('Subject', ''))

                # Detectar código de vacante en el destinatario
                codigo_vacante = _extraer_codigo_vacante(destinatario)
                if not codigo_vacante:
                    logger.warning(f'Correo sin código de vacante: destinatario={destinatario}')
                    mail.store(num, '+FLAGS', '\\Seen')
                    continue

                # Buscar la vacante
                try:
                    vacante = Vacante.objects.get(codigo=codigo_vacante, estado='abierta')
                except Vacante.DoesNotExist:
                    logger.warning(f'Vacante {codigo_vacante} no encontrada o no está abierta')
                    mail.store(num, '+FLAGS', '\\Seen')
                    continue

                if vacante.confidencial:
                    logger.info(f'Vacante {codigo_vacante} es confidencial, ignorando postulación por correo')
                    mail.store(num, '+FLAGS', '\\Seen')
                    continue

                # Extraer email del remitente
                email_candidato = _extraer_email_remitente(remitente)
                if not email_candidato:
                    logger.warning(f'No se pudo extraer email del remitente: {remitente}')
                    mail.store(num, '+FLAGS', '\\Seen')
                    continue

                # Buscar PDF adjunto
                pdf_encontrado = False
                for parte in msg.walk():
                    if parte.get_content_type() == 'application/pdf' or (
                        parte.get_content_disposition() == 'attachment' and
                        parte.get_filename() and
                        parte.get_filename().lower().endswith('.pdf')
                    ):
                        pdf_data     = parte.get_payload(decode=True)
                        nombre_pdf   = _decodificar_header(parte.get_filename() or 'cv.pdf')
                        pdf_encontrado = True

                        # Guardar PDF temporal para extraer texto
                        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                            tmp.write(pdf_data)
                            tmp_path = tmp.name

                        try:
                            with open(tmp_path, 'rb') as f:
                                texto_cv = extraer_texto_pdf(f)
                        finally:
                            os.unlink(tmp_path)

                        if not texto_cv or len(texto_cv.strip()) < 50:
                            logger.warning(f'PDF de {email_candidato} sin texto extraíble')
                            errores.append(f'{email_candidato}: PDF sin texto legible')
                            break

                        # Verificar duplicado
                        if Candidato.objects.filter(email=email_candidato, vacante=vacante).exists():
                            logger.info(f'{email_candidato} ya tiene postulación para {codigo_vacante}')
                            break

                        # Extraer nombre del asunto o usar el email
                        nombre_raw = asunto.replace('Postulación', '').replace('CV', '').strip() or email_candidato.split('@')[0]

                        # Crear candidato
                        from django.core.files.base import ContentFile
                        candidato = Candidato.objects.create(
                            vacante           = vacante,
                            nombre            = nombre_raw[:100],
                            apellido_paterno  = '(por confirmar)',
                            email             = email_candidato,
                            cv                = ContentFile(pdf_data, name=nombre_pdf),
                            cv_texto_extraido = texto_cv,
                            source            = 'buzon_imap',
                            estado            = 'postulado',
                        )

                        # Lanzar análisis IA en background
                        import threading
                        def _analizar(c=candidato, v=vacante):
                            try:
                                from candidatos.servicios.analisis_cv import analizar_cv
                                resultado = analizar_cv(c, v)
                                if resultado['pasa_filtro']:
                                    enviar_correo_avance_cv(c)
                            except Exception as err:
                                logger.error(f'Error analizando CV de buzón: {err}')

                        threading.Thread(target=_analizar, daemon=True).start()

                        procesados += 1
                        logger.info(f'✅ Candidato creado desde buzón: {email_candidato} → {codigo_vacante}')
                        break

                if not pdf_encontrado:
                    logger.warning(f'Correo de {email_candidato} sin PDF adjunto')
                    errores.append(f'{email_candidato}: Sin PDF adjunto')

                # Marcar como leído
                mail.store(num, '+FLAGS', '\\Seen')

            except Exception as e:
                logger.error(f'Error procesando correo {num}: {e}')
                errores.append(str(e))

        mail.logout()

    except imaplib.IMAP4.error as e:
        logger.error(f'Error de conexión IMAP: {e}')
        errores.append(f'Error IMAP: {e}')

    resultado = {
        'procesados': procesados,
        'errores':    errores,
        'timestamp':  timezone.now().isoformat(),
    }
    logger.info(f'Buzón revisado: {procesados} candidatos creados, {len(errores)} errores')
    return resultado
