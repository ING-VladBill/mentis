# ==========================================
# candidatos/servicios/correos.py
# ==========================================

import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from candidatos.models import TokenAcceso

logger = logging.getLogger(__name__)


def generar_token_acceso(candidato, tipo: str = 'examen') -> TokenAcceso:
    """
    Genera un token único de acceso para el candidato.
    Invalida tokens anteriores del mismo tipo.
    """
    # Invalidar tokens anteriores del mismo tipo
    TokenAcceso.objects.filter(
        candidato=candidato,
        tipo=tipo,
        usado=False
    ).update(
        fecha_expiracion=timezone.now()  # Expirar inmediatamente
    )

    horas = settings.MENTIS['TOKEN_ACCESO_EXPIRACION_HORAS']
    token = TokenAcceso.objects.create(
        candidato        = candidato,
        tipo             = tipo,
        fecha_expiracion = timezone.now() + timedelta(hours=horas),
    )
    return token


def enviar_correo_avance_cv(candidato) -> bool:
    """
    Correo enviado cuando el candidato PASA el filtro de CV.
    Incluye link único al examen.
    """
    token = generar_token_acceso(candidato, tipo='examen')
    link  = token.get_url()
    horas = settings.MENTIS['TOKEN_ACCESO_EXPIRACION_HORAS']

    asunto = f'¡Felicitaciones! Avanzas en el proceso de selección - {candidato.vacante.titulo}'

    cuerpo_texto = f"""
Estimado/a {candidato.nombre},

Nos complace informarte que tu CV ha sido revisado y has sido seleccionado/a para continuar en el proceso de selección para el puesto de {candidato.vacante.titulo}.

Accede a tu evaluación técnica aquí: {link}

IMPORTANTE:
- Este link es válido por {horas} horas
- El examen consta de 10 preguntas y tiene una duración de 45 minutos
- Puedes retomar el examen si se interrumpe, siempre que el link esté vigente

Mucho éxito,
Equipo de Reclutamiento MENTIS
    """.strip()

    cuerpo_html = _html_avance_cv(candidato, link, horas)

    return _enviar_correo(
        destinatario=candidato.email,
        nombre=candidato.nombre,
        asunto=asunto,
        cuerpo_texto=cuerpo_texto,
        cuerpo_html=cuerpo_html,
    )


def enviar_correo_avance_examen(candidato) -> bool:
    """
    Correo enviado cuando el candidato PASA el examen.
    Incluye link único a la entrevista IA.
    """
    token = generar_token_acceso(candidato, tipo='entrevista')
    link  = token.get_url()
    horas = settings.MENTIS['TOKEN_ACCESO_EXPIRACION_HORAS']

    asunto = f'¡Superaste el examen! Siguiente etapa: Entrevista IA - {candidato.vacante.titulo}'

    cuerpo_html = _html_avance_examen(candidato, link, horas)
    cuerpo_texto = f"""
Estimado/a {candidato.nombre},

¡Excelentes resultados! Has aprobado el examen técnico para el puesto de {candidato.vacante.titulo}.

Accede a tu entrevista IA aquí: {link}

El link es válido por {horas} horas.

Mucho éxito,
Equipo de Reclutamiento MENTIS
    """.strip()

    return _enviar_correo(
        destinatario=candidato.email,
        nombre=candidato.nombre,
        asunto=asunto,
        cuerpo_texto=cuerpo_texto,
        cuerpo_html=cuerpo_html,
    )


def enviar_correo_finalista(candidato) -> bool:
    """
    Correo enviado al candidato que queda en el TOP ranking.
    Invitación a entrevista presencial con RRHH.
    """
    asunto = f'¡Felicitaciones! Fuiste seleccionado para entrevista final - {candidato.vacante.titulo}'

    cuerpo_html = _html_finalista(candidato)
    cuerpo_texto = f"""
Estimado/a {candidato.nombre},

Nos complace informarte que eres uno de los candidatos finalistas para el puesto de {candidato.vacante.titulo}.

En las próximas 48 horas un miembro de nuestro equipo de RRHH se pondrá en contacto contigo para coordinar la entrevista presencial.

¡Muchos éxitos!
Equipo de Reclutamiento MENTIS
    """.strip()

    return _enviar_correo(
        destinatario=candidato.email,
        nombre=candidato.nombre,
        asunto=asunto,
        cuerpo_texto=cuerpo_texto,
        cuerpo_html=cuerpo_html,
    )


# ------------------------------------------
# FUNCIÓN INTERNA DE ENVÍO
# ------------------------------------------

def _enviar_correo(destinatario: str, nombre: str, asunto: str,
                   cuerpo_texto: str, cuerpo_html: str) -> bool:
    """Envía el correo. Retorna True si fue exitoso."""
    try:
        msg = EmailMultiAlternatives(
            subject    = asunto,
            body       = cuerpo_texto,
            from_email = settings.DEFAULT_FROM_EMAIL,
            to         = [destinatario],
        )
        msg.attach_alternative(cuerpo_html, 'text/html')
        msg.send()
        logger.info(f'Correo enviado a {destinatario}: {asunto}')
        return True
    except Exception as e:
        logger.error(f'Error enviando correo a {destinatario}: {e}')
        return False


# ------------------------------------------
# PLANTILLAS HTML
# ------------------------------------------

def _html_base(titulo: str, contenido: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {{ margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif; }}
  .container {{ max-width:600px; margin:30px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); }}
  .header {{ background:linear-gradient(135deg,#1F4E78,#2E75B6); padding:32px; text-align:center; }}
  .header h1 {{ color:#ffffff; margin:0; font-size:28px; letter-spacing:2px; }}
  .header p {{ color:#B5D4F4; margin:4px 0 0; font-size:13px; }}
  .body {{ padding:32px; }}
  .body h2 {{ color:#1F4E78; font-size:20px; margin-top:0; }}
  .body p {{ color:#444; line-height:1.7; font-size:15px; }}
  .btn {{ display:block; width:fit-content; margin:24px auto; background:#2E75B6; color:#ffffff !important; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:16px; font-weight:bold; text-align:center; }}
  .info-box {{ background:#F0F7FF; border-left:4px solid #2E75B6; padding:16px 20px; border-radius:4px; margin:20px 0; }}
  .info-box p {{ margin:4px 0; color:#1F4E78; font-size:14px; }}
  .footer {{ background:#f4f4f4; padding:20px; text-align:center; font-size:12px; color:#888; }}
  .footer p {{ margin:4px 0; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>MENTIS</h1>
    <p>Sistema Inteligente de Reclutamiento</p>
  </div>
  <div class="body">
    {contenido}
  </div>
  <div class="footer">
    <p>Este correo fue enviado automáticamente por MENTIS.</p>
    <p>Por la alta demanda, solo nos comunicamos con candidatos que avanzan.</p>
    <p>Si tienes dudas, contacta a rrhh@tuempresa.com</p>
  </div>
</div>
</body>
</html>
"""


def _html_avance_cv(candidato, link: str, horas: int) -> str:
    contenido = f"""
<h2>¡Felicitaciones, {candidato.nombre}!</h2>
<p>Tu CV ha sido revisado por nuestro sistema de selección y has sido elegido/a para continuar en el proceso para el puesto de <strong>{candidato.vacante.titulo}</strong>.</p>
<p>El siguiente paso es una evaluación de conocimientos. Es corta, justa y adaptada a tu perfil.</p>

<div class="info-box">
  <p><strong>📋 Detalles del examen:</strong></p>
  <p>• 10 preguntas de 2 puntos cada una (total: 20 puntos)</p>
  <p>• Duración: 45 minutos</p>
  <p>• Puedes retomarlo si se interrumpe</p>
  <p>• Link válido por {horas} horas</p>
</div>

<a href="{link}" class="btn">Iniciar evaluación</a>

<p style="font-size:13px; color:#888; text-align:center;">O copia este enlace: <br>{link}</p>
<p>¡Mucho éxito! Estamos seguros de que harás un gran papel.</p>
"""
    return _html_base('Avanzas al examen', contenido)


def _html_avance_examen(candidato, link: str, horas: int) -> str:
    contenido = f"""
<h2>¡Excelente resultado, {candidato.nombre}!</h2>
<p>Has superado la evaluación técnica para el puesto de <strong>{candidato.vacante.titulo}</strong>.</p>
<p>Ahora pasas a la siguiente etapa: una <strong>entrevista con nuestra IA</strong>, donde podrás demostrar tu experiencia y forma de pensar.</p>

<div class="info-box">
  <p><strong>🎙️ Detalles de la entrevista:</strong></p>
  <p>• 5 a 7 preguntas dinámicas</p>
  <p>• Puedes responder por texto o audio</p>
  <p>• Duración estimada: 20-30 minutos</p>
  <p>• Link válido por {horas} horas</p>
</div>

<a href="{link}" class="btn">Iniciar entrevista IA</a>

<p style="font-size:13px; color:#888; text-align:center;">O copia este enlace: <br>{link}</p>
<p>Sé tú mismo/a y responde con calma. ¡Confía en tu experiencia!</p>
"""
    return _html_base('Pasaste el examen', contenido)


def _html_finalista(candidato) -> str:
    contenido = f"""
<h2>🎉 ¡Eres finalista, {candidato.nombre}!</h2>
<p>Nos complace informarte que has quedado entre los <strong>candidatos más destacados</strong> para el puesto de <strong>{candidato.vacante.titulo}</strong>.</p>
<p>Tu desempeño en todas las etapas del proceso ha sido sobresaliente.</p>

<div class="info-box">
  <p><strong>📅 Próximos pasos:</strong></p>
  <p>• En las próximas <strong>48 horas</strong> te contactaremos</p>
  <p>• Se coordinará una entrevista presencial con RRHH</p>
  <p>• Ten a mano tu disponibilidad horaria</p>
</div>

<p>¡Felicitaciones por llegar hasta aquí! Es un logro del que debes estar muy orgulloso/a.</p>
<p>Hasta pronto,<br><strong>Equipo de Reclutamiento</strong></p>
"""
    return _html_base('¡Eres finalista!', contenido)
