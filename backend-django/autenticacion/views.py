# ==========================================
# autenticacion/views.py — ACTUALIZADO
# Agrega correo de bienvenida al crear usuario RRHH
# ==========================================

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from django.contrib.auth import get_user_model
from django.utils import timezone

from .serializers import (
    MentisTokenObtainPairSerializer,
    RegistroUsuarioSerializer,
    UsuarioSerializer,
    ValidarTokenAccesoSerializer,
    RegistroCandidatoConTokenSerializer,
)

Usuario = get_user_model()


class LoginRRHHView(TokenObtainPairView):
    serializer_class   = MentisTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshTokenView(TokenRefreshView):
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Se requiere el refresh token.'}, status=400)
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'mensaje': 'Sesión cerrada correctamente.'})
    except TokenError:
        return Response({'error': 'Token inválido o ya expirado.'}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def validar_token_acceso(request):
    serializer = ValidarTokenAccesoSerializer(data=request.data)
    if serializer.is_valid():
        token_obj = serializer.token_obj
        candidato = token_obj.candidato
        return Response({
            'valido':        True,
            'tipo':          token_obj.tipo,
            'ya_registrado': candidato.usuario_cuenta is not None,
            'candidato':     {'nombre': candidato.nombre_completo, 'email': candidato.email},
            'expira_en':     token_obj.fecha_expiracion,
        })
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_candidato_con_token(request):
    serializer = RegistroCandidatoConTokenSerializer(data=request.data)
    if serializer.is_valid():
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'mensaje': 'Cuenta creada exitosamente.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'usuario': {'id': user.id, 'email': user.email, 'nombre': user.nombre_completo},
        }, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_candidato(request):
    email    = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    if not email or not password:
        return Response({'error': 'Email y contraseña son requeridos.'}, status=400)
    try:
        user = Usuario.objects.get(email=email, rol='candidato')
    except Usuario.DoesNotExist:
        return Response({'error': 'Credenciales incorrectas.'}, status=401)
    if not user.check_password(password):
        return Response({'error': 'Credenciales incorrectas.'}, status=401)
    if not user.is_active:
        return Response({'error': 'Tu cuenta está desactivada.'}, status=403)
    user.ultimo_login = timezone.now()
    user.save(update_fields=['ultimo_login'])
    refresh = RefreshToken.for_user(user)
    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': {'id': user.id, 'email': user.email, 'nombre': user.nombre_completo},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    return Response(UsuarioSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_usuario_rrhh(request):
    if not request.user.es_admin:
        return Response({'error': 'Solo los administradores pueden crear usuarios.'}, status=403)

    serializer = RegistroUsuarioSerializer(data=request.data)
    if serializer.is_valid():
        password_temporal = request.data.get('password')
        user = serializer.save()

        # Enviar correo de bienvenida con credenciales
        _enviar_correo_bienvenida(user, password_temporal, request.user)

        return Response(UsuarioSerializer(user).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios_rrhh(request):
    if not request.user.es_admin:
        return Response({'error': 'Acceso denegado.'}, status=403)
    usuarios = Usuario.objects.exclude(rol='candidato').order_by('apellidos')
    return Response(UsuarioSerializer(usuarios, many=True).data)


# ------------------------------------------
# CORREO DE BIENVENIDA
# ------------------------------------------

def _enviar_correo_bienvenida(usuario, password_temporal: str, creado_por):
    """
    Envía correo de bienvenida al nuevo usuario RRHH con sus credenciales.
    Se ejecuta en background para no bloquear la respuesta.
    """
    import threading

    def _enviar():
        try:
            from django.core.mail import EmailMultiAlternatives
            from django.conf import settings

            frontend_url = settings.MENTIS['FRONTEND_URL']
            asunto = 'Bienvenido/a a MENTIS — Tus credenciales de acceso'

            cuerpo_texto = f"""
Hola {usuario.nombre},

{creado_por.nombre_completo} te ha dado acceso al sistema MENTIS de Reclutamiento con IA.

Tus credenciales:
  Email:      {usuario.email}
  Contraseña: {password_temporal}
  Rol:        {usuario.get_rol_display()}

Accede aquí: {frontend_url}/login

Te recomendamos cambiar tu contraseña después del primer ingreso.

MENTIS — Sistema de Reclutamiento Inteligente
            """.strip()

            cuerpo_html = _html_bienvenida(usuario, password_temporal, creado_por, frontend_url)

            msg = EmailMultiAlternatives(
                subject    = asunto,
                body       = cuerpo_texto,
                from_email = settings.DEFAULT_FROM_EMAIL,
                to         = [usuario.email],
            )
            msg.attach_alternative(cuerpo_html, 'text/html')
            msg.send()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'Error enviando correo de bienvenida a {usuario.email}: {e}')

    threading.Thread(target=_enviar, daemon=True).start()


def _html_bienvenida(usuario, password_temporal, creado_por, frontend_url):
    return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {{ margin:0; padding:0; background:#f4f4f8; font-family:Arial,sans-serif; }}
  .container {{ max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); }}
  .header {{ background:linear-gradient(135deg,#1F4E78,#2E75B6); padding:32px; text-align:center; }}
  .header h1 {{ color:#fff; margin:0; font-size:28px; letter-spacing:2px; }}
  .header p {{ color:#B5D4F4; margin:4px 0 0; font-size:13px; }}
  .body {{ padding:32px; }}
  .body h2 {{ color:#1F4E78; }}
  .body p {{ color:#444; line-height:1.7; font-size:15px; }}
  .creds {{ background:#F0F7FF; border-left:4px solid #2E75B6; padding:16px 20px; border-radius:4px; margin:20px 0; }}
  .creds p {{ margin:6px 0; color:#1F4E78; font-size:14px; }}
  .creds strong {{ display:inline-block; min-width:100px; }}
  .btn {{ display:block; width:fit-content; margin:24px auto; background:#2E75B6; color:#fff !important; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:16px; font-weight:bold; }}
  .warning {{ background:#FFF8E1; border-left:4px solid #FFC107; padding:12px 16px; border-radius:4px; font-size:13px; color:#7d6000; margin-top:20px; }}
  .footer {{ background:#f4f4f8; padding:20px; text-align:center; font-size:12px; color:#888; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>MENTIS</h1>
    <p>Sistema Inteligente de Reclutamiento</p>
  </div>
  <div class="body">
    <h2>¡Bienvenido/a, {usuario.nombre}!</h2>
    <p>{creado_por.nombre_completo} te ha dado acceso a <strong>MENTIS</strong> con el rol de <strong>{usuario.get_rol_display()}</strong>.</p>

    <div class="creds">
      <p><strong>🌐 Sistema:</strong> {frontend_url}</p>
      <p><strong>📧 Email:</strong> {usuario.email}</p>
      <p><strong>🔑 Contraseña:</strong> {password_temporal}</p>
      <p><strong>👤 Rol:</strong> {usuario.get_rol_display()}</p>
    </div>

    <a href="{frontend_url}/login" class="btn">Ingresar a MENTIS</a>

    <div class="warning">
      ⚠️ Por seguridad, te recomendamos cambiar tu contraseña después del primer ingreso.
    </div>
  </div>
  <div class="footer">
    <p>Este correo fue generado automáticamente por MENTIS.</p>
    <p>Si no esperabas este mensaje, contacta a tu administrador.</p>
  </div>
</div>
</body>
</html>
"""
