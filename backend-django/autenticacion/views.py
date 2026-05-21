# ==========================================
# autenticacion/views.py
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
    """
    POST /api/auth/login/
    Login para usuarios de RRHH (admin, reclutador, evaluador, gerente).
    """
    serializer_class = MentisTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshTokenView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Renueva el access token usando el refresh token.
    """
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    POST /api/auth/logout/
    Invalida el refresh token (blacklist).
    """
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Se requiere el refresh token.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {'mensaje': 'Sesión cerrada correctamente.'},
            status=status.HTTP_200_OK
        )
    except TokenError:
        return Response(
            {'error': 'Token inválido o ya expirado.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def validar_token_acceso(request):
    """
    POST /api/auth/validar-token/
    Verifica si el link único del candidato es válido.
    Usado por el frontend antes de mostrar el formulario de registro.
    """
    serializer = ValidarTokenAccesoSerializer(data=request.data)
    if serializer.is_valid():
        token_obj = serializer.token_obj
        candidato = token_obj.candidato
        ya_tiene_cuenta = candidato.usuario_cuenta is not None
        return Response({
            'valido': True,
            'tipo': token_obj.tipo,
            'ya_registrado': ya_tiene_cuenta,
            'candidato': {
                'nombre': candidato.nombre_completo,
                'email':  candidato.email,
            },
            'expira_en': token_obj.fecha_expiracion,
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_candidato_con_token(request):
    """
    POST /api/auth/registro-candidato/
    El candidato crea su cuenta la primera vez usando el link único.
    Devuelve JWT para que ingrese directamente al sistema.
    """
    serializer = RegistroCandidatoConTokenSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'mensaje': 'Cuenta creada exitosamente.',
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'usuario': {
                'id':    user.id,
                'email': user.email,
                'nombre': user.nombre_completo,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_candidato(request):
    """
    POST /api/auth/login-candidato/
    Login normal para postulantes que ya crearon su cuenta.
    """
    email    = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {'error': 'Email y contraseña son requeridos.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = Usuario.objects.get(email=email, rol='candidato')
    except Usuario.DoesNotExist:
        return Response(
            {'error': 'Credenciales incorrectas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'error': 'Credenciales incorrectas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'Tu cuenta está desactivada.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Actualizar último login
    user.ultimo_login = timezone.now()
    user.save(update_fields=['ultimo_login'])

    refresh = RefreshToken.for_user(user)
    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': {
            'id':    user.id,
            'email': user.email,
            'nombre': user.nombre_completo,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def perfil_usuario(request):
    """
    GET /api/auth/perfil/
    Devuelve el perfil del usuario autenticado.
    """
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_usuario_rrhh(request):
    """
    POST /api/auth/usuarios/
    Solo admin puede crear usuarios de RRHH.
    """
    if not request.user.es_admin:
        return Response(
            {'error': 'Solo los administradores pueden crear usuarios.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = RegistroUsuarioSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            UsuarioSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios_rrhh(request):
    """
    GET /api/auth/usuarios/
    Lista todos los usuarios (solo admin).
    """
    if not request.user.es_admin:
        return Response(
            {'error': 'Acceso denegado.'},
            status=status.HTTP_403_FORBIDDEN
        )

    usuarios = Usuario.objects.exclude(rol='candidato').order_by('apellidos')
    serializer = UsuarioSerializer(usuarios, many=True)
    return Response(serializer.data)
