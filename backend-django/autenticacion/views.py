# ==========================================
# autenticacion/views.py 
# Agrega correo de bienvenida al crear usuario RRHH
# ==========================================

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from candidatos.servicios.correos import enviar_correo_bienvenida_rrhh

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
        enviar_correo_bienvenida_rrhh(user, password_temporal, request.user.nombre_completo)

        return Response(UsuarioSerializer(user).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_usuarios_rrhh(request):
    if not request.user.es_admin:
        return Response({'error': 'Acceso denegado.'}, status=403)
    usuarios = Usuario.objects.exclude(rol='candidato').order_by('apellidos')
    return Response(UsuarioSerializer(usuarios, many=True).data)

