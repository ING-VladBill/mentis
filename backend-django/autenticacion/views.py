# ==========================================
# autenticacion/views.py (Sprint 2 - completo)
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
from candidatos.servicios.correos import enviar_correo_bienvenida_rrhh

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
        user = serializer.save()
        # La contraseña la generó el sistema (no el admin); la tomamos del usuario
        password_temporal = getattr(user, '_password_temporal_plano', '')

        # El correo de bienvenida se envía en segundo plano y NUNCA debe
        # tumbar la creación del usuario. Si el SMTP falla o tarda, el
        # usuario ya quedó creado y la respuesta sale al instante.
        import threading

        def _enviar_bienvenida(usuario_id=user.id, pwd=password_temporal,
                               creador=request.user.nombre_completo):
            try:
                from usuarios.models import Usuario as _U
                u = _U.objects.get(id=usuario_id)
                enviar_correo_bienvenida_rrhh(u, pwd, creador)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(
                    f'No se pudo enviar correo de bienvenida a {usuario_id}: {e}'
                )

        threading.Thread(target=_enviar_bienvenida, daemon=True).start()

        return Response(UsuarioSerializer(user).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios_rrhh(request):
    if not request.user.es_admin:
        return Response({'error': 'Acceso denegado.'}, status=403)
    usuarios = Usuario.objects.exclude(rol='candidato').order_by('apellidos')
    return Response(UsuarioSerializer(usuarios, many=True).data)


# ==========================================
# GESTIÓN DE ESTADO Y CONTRASEÑA DE USUARIOS
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desactivar_usuario(request, pk):
    """
    POST /api/auth/usuarios/{id}/desactivar/
    Corta el acceso de un usuario (ej: empleado que deja la empresa).
    No elimina la cuenta, preserva el historial.
    """
    if not request.user.es_admin:
        return Response({'error': 'Solo los administradores pueden desactivar usuarios.'}, status=403)

    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)

    if usuario.id == request.user.id:
        return Response({'error': 'No puedes desactivar tu propia cuenta.'}, status=400)

    if usuario.rol == 'admin':
        admins_activos = Usuario.objects.filter(rol='admin', is_active=True).exclude(pk=usuario.pk).count()
        if admins_activos == 0:
            return Response({'error': 'No puedes desactivar al único administrador activo del sistema.'}, status=400)

    usuario.is_active = False
    usuario.save(update_fields=['is_active'])
    return Response({
        'mensaje':  f'Usuario {usuario.nombre_completo} desactivado. Su acceso fue cortado.',
        'usuario':  UsuarioSerializer(usuario).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activar_usuario(request, pk):
    """
    POST /api/auth/usuarios/{id}/activar/
    Reactiva el acceso de un usuario previamente desactivado.
    """
    if not request.user.es_admin:
        return Response({'error': 'Solo los administradores pueden activar usuarios.'}, status=403)

    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)

    usuario.is_active = True
    usuario.save(update_fields=['is_active'])
    return Response({
        'mensaje':  f'Usuario {usuario.nombre_completo} reactivado. Puede volver a iniciar sesión.',
        'usuario':  UsuarioSerializer(usuario).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password_usuario(request, pk):
    """
    POST /api/auth/usuarios/{id}/cambiar-password/
    Permite al admin resetear la contraseña de otro usuario.
    Body: { "password_nuevo": "..." }
    """
    if not request.user.es_admin:
        return Response({'error': 'Solo los administradores pueden cambiar contraseñas.'}, status=403)

    if int(pk) == request.user.id:
        return Response({'error': 'Para cambiar tu propia contraseña usa la opción de perfil.'}, status=400)

    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)

    password_nuevo = request.data.get('password_nuevo', '')
    if not password_nuevo or len(password_nuevo) < 6:
        return Response({'error': 'La contraseña debe tener al menos 6 caracteres.'}, status=400)

    usuario.set_password(password_nuevo)
    usuario.save(update_fields=['password'])
    return Response({'mensaje': f'Contraseña de {usuario.nombre_completo} actualizada correctamente.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reenviar_credenciales(request, pk):
    """
    POST /api/auth/usuarios/{id}/reenviar-credenciales/
    Reenvía el correo de bienvenida con credenciales.
    Como las contraseñas se guardan cifradas y no se pueden recuperar,
    genera una NUEVA contraseña temporal, la asigna y la envía por correo.
    Útil cuando el correo automático falló al crear el usuario.
    """
    if not request.user.es_admin:
        return Response({'error': 'Solo los administradores pueden reenviar credenciales.'}, status=403)

    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)

    # Generar una nueva contraseña temporal segura
    import secrets
    import string
    alfabeto = string.ascii_letters + string.digits
    nueva_password = ''.join(secrets.choice(alfabeto) for _ in range(12))

    usuario.set_password(nueva_password)
    usuario.save(update_fields=['password'])

    # Enviar el correo en background (no bloquea, no tumba la respuesta)
    import threading

    def _reenviar(usuario_id=usuario.id, pwd=nueva_password,
                  creador=request.user.nombre_completo):
        try:
            from usuarios.models import Usuario as _U
            u = _U.objects.get(id=usuario_id)
            enviar_correo_bienvenida_rrhh(u, pwd, creador)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(
                f'No se pudo reenviar credenciales a {usuario_id}: {e}'
            )

    threading.Thread(target=_reenviar, daemon=True).start()

    return Response({
        'mensaje': f'Se generó una nueva contraseña y se envió el correo a {usuario.email}.',
        'usuario': UsuarioSerializer(usuario).data,
    })