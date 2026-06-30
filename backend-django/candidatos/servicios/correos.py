# ==========================================
# candidatos/servicios/correos.py
# Plantillas de correo PREMIUM (compatibles con Gmail, Outlook, Apple Mail)
# Construidas con tablas + estilos inline para máxima compatibilidad
# ==========================================

import logging
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from candidatos.models import TokenAcceso
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


# ==========================================
# PALETA Y TOKENS DE DISEÑO
# ==========================================
COLOR_PRIMARY      = '#4F46E5'   # Indigo principal
COLOR_PRIMARY_DARK = '#3730A3'
COLOR_ACCENT       = '#7C3AED'   # Violeta acento
COLOR_SUCCESS      = '#059669'
COLOR_GOLD         = '#D97706'
COLOR_TEXT         = '#1F2937'
COLOR_TEXT_MUTED   = '#6B7280'
COLOR_BG           = '#F3F4F6'
COLOR_CARD         = '#FFFFFF'
COLOR_BORDER       = '#E5E7EB'


# ==========================================
# TOKENS DE ACCESO
# ==========================================

def generar_token_acceso(candidato, tipo: str = 'examen') -> TokenAcceso:
    TokenAcceso.objects.filter(
        candidato=candidato, tipo=tipo, usado=False
    ).update(fecha_expiracion=timezone.now())

    horas = settings.MENTIS['TOKEN_ACCESO_EXPIRACION_HORAS']
    return TokenAcceso.objects.create(
        candidato        = candidato,
        tipo             = tipo,
        fecha_expiracion = timezone.now() + timedelta(hours=horas),
    )


# ==========================================
# LAYOUT BASE (tabla maestra, compatible con todos los clientes)
# ==========================================

def _layout(preheader: str, header_gradient: str, badge_emoji: str,
            badge_texto: str, contenido: str) -> str:
    """
    Layout base de email con tablas anidadas.
    - preheader: texto de preview que se ve en la bandeja antes de abrir
    - header_gradient: CSS del degradado del header
    - badge_emoji + badge_texto: la "píldora" superior
    - contenido: el cuerpo HTML específico de cada correo
    """
    return f"""<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>MENTIS</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px) {{
      .container {{ width:100% !important; }}
      .px {{ padding-left:24px !important; padding-right:24px !important; }}
      .btn-a {{ display:block !important; }}
      .h1 {{ font-size:24px !important; }}
    }}
    a {{ text-decoration:none; }}
    body {{ margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
    table {{ border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }}
    img {{ border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }}
  </style>
</head>
<body style="margin:0; padding:0; background-color:{COLOR_BG}; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preheader oculto (preview en bandeja) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:{COLOR_BG};">
    {preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{COLOR_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card principal -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:{COLOR_CARD}; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER con degradado -->
          <tr>
            <td style="background:{header_gradient}; padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:40px 32px 36px;">
                    <!-- Logo MENTIS -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:rgba(255,255,255,0.16); border-radius:14px; padding:12px 18px;">
                          <span style="font-size:30px; font-weight:800; color:#FFFFFF; letter-spacing:3px; font-family:'Segoe UI',Arial,sans-serif;">MENTIS</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0; color:rgba(255,255,255,0.85); font-size:12px; letter-spacing:2px; text-transform:uppercase;">Reclutamiento Inteligente</p>

                    <!-- Badge píldora -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto 0;">
                      <tr>
                        <td style="background-color:rgba(255,255,255,0.95); border-radius:24px; padding:9px 22px;">
                          <span style="font-size:14px; font-weight:700; color:{COLOR_PRIMARY_DARK};">{badge_emoji}&nbsp;&nbsp;{badge_texto}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td class="px" style="padding:40px 44px 36px;">
              {contenido}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#FAFAFB; border-top:1px solid {COLOR_BORDER}; padding:28px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px; font-size:15px; font-weight:700; color:{COLOR_TEXT}; letter-spacing:1px;">MENTIS</p>
                    <p style="margin:0 0 14px; font-size:12px; color:{COLOR_TEXT_MUTED}; line-height:1.6;">
                      Este correo fue enviado automáticamente.<br>
                      Por la alta demanda, solo nos comunicamos con candidatos que avanzan en el proceso.
                    </p>
                    <p style="margin:0; font-size:12px; color:{COLOR_TEXT_MUTED};">
                      ¿Dudas? Escríbenos a <a href="mailto:rrhh@tuempresa.com" style="color:{COLOR_PRIMARY}; font-weight:600;">rrhh@tuempresa.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Nota legal -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px;">
          <tr>
            <td align="center" style="padding:20px 32px;">
              <p style="margin:0; font-size:11px; color:#9CA3AF; line-height:1.5;">
                © {timezone.now().year} MENTIS · Sistema Inteligente de Reclutamiento con IA
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>"""


# ==========================================
# COMPONENTES REUTILIZABLES
# ==========================================

def _boton(texto: str, link: str, color: str = COLOR_PRIMARY) -> str:
    """Botón CTA bulletproof (funciona en Outlook con VML)."""
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{link}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="16%" stroke="f" fillcolor="{color}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:bold;">{texto}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="{link}" class="btn-a" style="background:linear-gradient(135deg,{color},{COLOR_ACCENT}); color:#FFFFFF; display:inline-block; padding:16px 44px; border-radius:10px; font-size:16px; font-weight:700; font-family:'Segoe UI',Arial,sans-serif; box-shadow:0 4px 14px rgba(79,70,229,0.35);">{texto}</a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>"""


def _info_box(titulo: str, items: list, color: str = COLOR_PRIMARY) -> str:
    """Caja de información con borde lateral de color."""
    filas = ''.join([
        f'<p style="margin:7px 0; color:{COLOR_TEXT}; font-size:14px; line-height:1.5;">{item}</p>'
        for item in items
    ])
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#F5F3FF; border-left:4px solid {color}; border-radius:8px; padding:20px 24px;">
          <p style="margin:0 0 12px; color:{color}; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">{titulo}</p>
          {filas}
        </td>
      </tr>
    </table>"""



def _bloque_codigo(codigo: str) -> str:
    """Caja destacada con el código de acceso corto para la app móvil."""
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#EEF2FF,#F5F3FF); border:2px dashed {COLOR_PRIMARY}; border-radius:14px; padding:22px 20px; text-align:center;">
          <p style="margin:0 0 8px; font-size:12px; font-weight:700; color:{COLOR_TEXT_MUTED}; letter-spacing:1.5px; text-transform:uppercase;">
            ¿Ingresas desde la app móvil?
          </p>
          <p style="margin:0 0 6px; font-size:13px; color:{COLOR_TEXT_MUTED};">
            Usa este código de acceso:
          </p>
          <p style="margin:0; font-size:30px; font-weight:800; color:{COLOR_PRIMARY_DARK}; letter-spacing:3px; font-family:'Courier New',monospace;">
            {codigo}
          </p>
        </td>
      </tr>
    </table>"""

def _link_alternativo(link: str) -> str:
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      <tr>
        <td align="center">
          <p style="margin:0; font-size:12px; color:{COLOR_TEXT_MUTED};">¿El botón no funciona? Copia este enlace:</p>
          <p style="margin:6px 0 0; font-size:12px;"><a href="{link}" style="color:{COLOR_PRIMARY}; word-break:break-all;">{link}</a></p>
        </td>
      </tr>
    </table>"""


def _saludo(nombre: str) -> str:
    return f'<h1 class="h1" style="margin:0 0 8px; color:{COLOR_TEXT}; font-size:26px; font-weight:800; line-height:1.25;">'


# ==========================================
# CORREO 1 — BIENVENIDA USUARIO RRHH
# ==========================================

def enviar_correo_bienvenida_rrhh(usuario, password_temporal: str, creado_por_nombre: str) -> bool:
    frontend = settings.MENTIS['FRONTEND_URL']
    asunto = 'Bienvenido/a a MENTIS — Tus credenciales de acceso'

    contenido = f"""
    <h1 class="h1" style="margin:0 0 12px; color:{COLOR_TEXT}; font-size:26px; font-weight:800; line-height:1.25;">¡Bienvenido/a, {usuario.nombre}! 👋</h1>
    <p style="margin:0 0 8px; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      <strong style="color:{COLOR_TEXT};">{creado_por_nombre}</strong> te ha dado acceso al sistema MENTIS con el rol de <strong style="color:{COLOR_PRIMARY};">{usuario.get_rol_display()}</strong>.
    </p>
    <p style="margin:0 0 4px; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Estas son tus credenciales de ingreso:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#EEF2FF,#F5F3FF); border:1px solid #E0E7FF; border-radius:12px; padding:24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0; color:{COLOR_TEXT_MUTED}; font-size:13px; width:130px;">Email</td><td style="padding:6px 0; color:{COLOR_TEXT}; font-size:15px; font-weight:700;">{usuario.email}</td></tr>
            <tr><td style="padding:6px 0; color:{COLOR_TEXT_MUTED}; font-size:13px;">Contraseña</td><td style="padding:6px 0; color:{COLOR_TEXT}; font-size:15px; font-weight:700; font-family:monospace;">{password_temporal}</td></tr>
            <tr><td style="padding:6px 0; color:{COLOR_TEXT_MUTED}; font-size:13px;">Rol</td><td style="padding:6px 0; color:{COLOR_TEXT}; font-size:15px; font-weight:700;">{usuario.get_rol_display()}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    {_boton('Ingresar a MENTIS', f'{frontend}/login')}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
      <tr>
        <td style="background-color:#FFFBEB; border-radius:8px; padding:14px 18px;">
          <p style="margin:0; color:#92400E; font-size:13px; line-height:1.5;">🔒 <strong>Por seguridad</strong>, te recomendamos cambiar tu contraseña después del primer ingreso.</p>
        </td>
      </tr>
    </table>
    """

    html = _layout(
        preheader=f'Tus credenciales de acceso a MENTIS',
        header_gradient=f'linear-gradient(135deg,{COLOR_PRIMARY},{COLOR_ACCENT})',
        badge_emoji='🔑', badge_texto='ACCESO CREADO',
        contenido=contenido,
    )
    texto = f"Bienvenido/a {usuario.nombre}. Tus credenciales: Email: {usuario.email} | Contraseña: {password_temporal} | Rol: {usuario.get_rol_display()}. Ingresa en {frontend}/login"
    return _enviar_correo(usuario.email, usuario.nombre, asunto, texto, html)


# ==========================================
# CORREO 2 — AVANCE CV (link al examen)
# ==========================================

def enviar_correo_avance_cv(candidato) -> bool:
    token = generar_token_acceso(candidato, tipo='examen')
    link  = token.get_url()
    horas = settings.MENTIS['TOKEN_ACCESO_EXPIRACION_HORAS']
    asunto = f'¡Avanzas en el proceso! · {candidato.vacante.titulo}'

    contenido = f"""
    <h1 class="h1" style="margin:0 0 12px; color:{COLOR_TEXT}; font-size:26px; font-weight:800; line-height:1.25;">¡Felicitaciones, {candidato.nombre}! 🎉</h1>
    <p style="margin:0 0 16px; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Tu CV fue revisado por nuestro sistema de selección y has sido elegido/a para continuar en el proceso para el puesto de <strong style="color:{COLOR_TEXT};">{candidato.vacante.titulo}</strong>.
    </p>
    <p style="margin:0; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      El siguiente paso es una evaluación de conocimientos: corta, justa y adaptada a tu perfil.
    </p>

    {_info_box('Detalles del examen', [
        '📝 &nbsp;10 preguntas · 2 puntos cada una (total 20)',
        '⏱️ &nbsp;Duración: 45 minutos',
        '🔄 &nbsp;Puedes retomarlo si se interrumpe',
        f'⏳ &nbsp;Link válido por {horas} horas',
    ])}

    {_boton('Iniciar evaluación', link)}
    {_link_alternativo(link)}
    {_bloque_codigo(token.codigo_corto)}

    <p style="margin:24px 0 0; color:{COLOR_TEXT_MUTED}; font-size:14px; line-height:1.6; text-align:center;">Estamos seguros de que harás un gran papel. ¡Mucho éxito! 💪</p>
    """

    html = _layout(
        preheader=f'Avanzas al examen técnico para {candidato.vacante.titulo}',
        header_gradient=f'linear-gradient(135deg,{COLOR_PRIMARY},{COLOR_ACCENT})',
        badge_emoji='✅', badge_texto='CV APROBADO',
        contenido=contenido,
    )
    texto = f"Felicitaciones {candidato.nombre}, avanzas en el proceso para {candidato.vacante.titulo}. Inicia tu examen: {link} (válido {horas}h)"
    return _enviar_correo(candidato.email, candidato.nombre, asunto, texto, html)


# ==========================================
# CORREO 3 — AVANCE EXAMEN (link a entrevista)
# ==========================================

def enviar_correo_avance_examen(candidato) -> bool:
    token = generar_token_acceso(candidato, tipo='entrevista')
    link  = token.get_url()
    horas = settings.MENTIS['TOKEN_ACCESO_EXPIRACION_HORAS']
    asunto = f'¡Superaste el examen! Siguiente etapa · {candidato.vacante.titulo}'

    contenido = f"""
    <h1 class="h1" style="margin:0 0 12px; color:{COLOR_TEXT}; font-size:26px; font-weight:800; line-height:1.25;">¡Excelente resultado, {candidato.nombre}! 🌟</h1>
    <p style="margin:0 0 16px; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Has superado la evaluación técnica para el puesto de <strong style="color:{COLOR_TEXT};">{candidato.vacante.titulo}</strong>.
    </p>
    <p style="margin:0; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Ahora pasas a la etapa más interesante: una <strong style="color:{COLOR_ACCENT};">entrevista con nuestra IA</strong>, donde podrás demostrar tu experiencia y forma de pensar en una conversación natural.
    </p>

    {_info_box('Detalles de la entrevista', [
        '🎙️ &nbsp;Conversación por voz con la IA',
        '💬 &nbsp;5 a 7 preguntas dinámicas adaptadas a ti',
        '⏱️ &nbsp;Duración estimada: 20-30 minutos',
        f'⏳ &nbsp;Link válido por {horas} horas',
    ], color=COLOR_ACCENT)}

    {_boton('Iniciar entrevista IA', link, color=COLOR_ACCENT)}
    {_link_alternativo(link)}
    {_bloque_codigo(token.codigo_corto)}

    <p style="margin:24px 0 0; color:{COLOR_TEXT_MUTED}; font-size:14px; line-height:1.6; text-align:center;">Sé tú mismo/a y responde con calma. ¡Confía en tu experiencia! 🚀</p>
    """

    html = _layout(
        preheader=f'Pasaste el examen. Siguiente etapa: entrevista IA',
        header_gradient=f'linear-gradient(135deg,{COLOR_ACCENT},#9333EA)',
        badge_emoji='🎯', badge_texto='EXAMEN APROBADO',
        contenido=contenido,
    )
    texto = f"Excelente {candidato.nombre}, aprobaste el examen para {candidato.vacante.titulo}. Inicia tu entrevista IA: {link} (válido {horas}h)"
    return _enviar_correo(candidato.email, candidato.nombre, asunto, texto, html)


# ==========================================
# CORREO 4 — FINALISTA
# ==========================================

def enviar_correo_finalista(candidato) -> bool:
    asunto = f'¡Eres finalista! · {candidato.vacante.titulo}'

    contenido = f"""
    <h1 class="h1" style="margin:0 0 12px; color:{COLOR_TEXT}; font-size:26px; font-weight:800; line-height:1.25;">🎉 ¡Eres finalista, {candidato.nombre}!</h1>
    <p style="margin:0 0 16px; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Nos complace informarte que has quedado entre los <strong style="color:{COLOR_GOLD};">candidatos más destacados</strong> para el puesto de <strong style="color:{COLOR_TEXT};">{candidato.vacante.titulo}</strong>.
    </p>
    <p style="margin:0; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Tu desempeño en todas las etapas del proceso ha sido sobresaliente. 👏
    </p>

    {_info_box('Próximos pasos', [
        '📅 &nbsp;En las próximas 48 horas te contactaremos',
        '🤝 &nbsp;Coordinaremos una entrevista presencial con RRHH',
        '🕐 &nbsp;Ten a mano tu disponibilidad horaria',
    ], color=COLOR_GOLD)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td align="center" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7); border-radius:12px; padding:28px;">
          <p style="margin:0; font-size:42px;">🏆</p>
          <p style="margin:10px 0 0; color:#92400E; font-size:16px; font-weight:700;">¡Felicitaciones por llegar hasta aquí!</p>
          <p style="margin:6px 0 0; color:#B45309; font-size:14px;">Es un logro del que debes estar muy orgulloso/a.</p>
        </td>
      </tr>
    </table>
    """

    html = _layout(
        preheader=f'Eres finalista para {candidato.vacante.titulo}',
        header_gradient='linear-gradient(135deg,#D97706,#F59E0B)',
        badge_emoji='🏆', badge_texto='FINALISTA',
        contenido=contenido,
    )
    texto = f"Felicitaciones {candidato.nombre}, eres finalista para {candidato.vacante.titulo}. Te contactaremos en 48h para la entrevista presencial."
    return _enviar_correo(candidato.email, candidato.nombre, asunto, texto, html)


# ==========================================
# CORREO 5 — CONFIRMACIÓN DE POSTULACIÓN (formulario público)
# ==========================================

def enviar_correo_confirmacion_postulacion(candidato) -> bool:
    asunto = f'Recibimos tu postulación · {candidato.vacante.titulo}'

    contenido = f"""
    <h1 class="h1" style="margin:0 0 12px; color:{COLOR_TEXT}; font-size:26px; font-weight:800; line-height:1.25;">¡Postulación recibida, {candidato.nombre}! ✅</h1>
    <p style="margin:0 0 16px; color:{COLOR_TEXT_MUTED}; font-size:15px; line-height:1.7;">
      Gracias por postular al puesto de <strong style="color:{COLOR_TEXT};">{candidato.vacante.titulo}</strong>. Tu CV ya está en nuestro sistema y será evaluado por nuestro equipo de selección.
    </p>

    {_info_box('¿Qué sigue ahora?', [
        '🔍 &nbsp;Analizaremos tu perfil con nuestro sistema',
        '📧 &nbsp;Si avanzas, recibirás un correo con los siguientes pasos',
        '⏱️ &nbsp;El proceso de revisión puede tomar algunos días',
    ])}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="background-color:#F9FAFB; border:1px solid {COLOR_BORDER}; border-radius:10px; padding:18px 22px;">
          <p style="margin:0 0 4px; color:{COLOR_TEXT_MUTED}; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Postulación registrada</p>
          <p style="margin:0; color:{COLOR_TEXT}; font-size:15px; font-weight:700;">{candidato.vacante.titulo}</p>
          <p style="margin:4px 0 0; color:{COLOR_TEXT_MUTED}; font-size:13px;">Código: {candidato.vacante.codigo}</p>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0; color:{COLOR_TEXT_MUTED}; font-size:14px; line-height:1.6; text-align:center;">
      Por la alta demanda, solo contactamos a quienes avanzan en el proceso.<br>Te deseamos mucho éxito. 🍀
    </p>
    """

    html = _layout(
        preheader=f'Recibimos tu postulación para {candidato.vacante.titulo}',
        header_gradient=f'linear-gradient(135deg,{COLOR_SUCCESS},#10B981)',
        badge_emoji='📨', badge_texto='POSTULACIÓN RECIBIDA',
        contenido=contenido,
    )
    texto = f"Hola {candidato.nombre}, recibimos tu postulación para {candidato.vacante.titulo} (código {candidato.vacante.codigo}). Si avanzas, te contactaremos. ¡Éxito!"
    return _enviar_correo(candidato.email, candidato.nombre, asunto, texto, html)


# ==========================================
# FUNCIÓN INTERNA DE ENVÍO
# ==========================================

def _enviar_correo(destinatario: str, nombre: str, asunto: str,
                   cuerpo_texto: str, cuerpo_html: str) -> bool:
    """
    Envía un correo por SMTP (Gmail) con versión HTML + texto plano.
    Remitente: DEFAULT_FROM_EMAIL (MENTIS Reclutamiento <mentis.reclutamiento@gmail.com>).
    Funciona en local (la red permite SMTP). En Railway gratis el SMTP está bloqueado.
    """
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