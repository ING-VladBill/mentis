# ==========================================
# autenticacion/serializers.py
# ==========================================

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from candidatos.models import TokenAcceso, Candidato

Usuario = get_user_model()


class MentisTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT personalizado: agrega datos del usuario al token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['nombre']   = user.nombre
        token['apellidos']= user.apellidos
        token['email']    = user.email
        token['rol']      = user.rol
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Agregar info extra en la respuesta (además del token)
        data['usuario'] = {
            'id':       self.user.id,
            'email':    self.user.email,
            'nombre':   self.user.nombre_completo,
            'rol':      self.user.rol,
            'rol_display': self.user.get_rol_display(),
        }
        # Actualizar último login
        self.user.ultimo_login = timezone.now()
        self.user.save(update_fields=['ultimo_login'])
        return data


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'apellidos', 'nombre_completo',
                  'rol', 'area_responsable', 'telefono', 'is_active']
        read_only_fields = ['id']


def generar_password_temporal(longitud=12):
    """Genera una contraseña temporal segura y legible para el usuario RRHH."""
    import secrets
    alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
    return ''.join(secrets.choice(alfabeto) for _ in range(longitud))


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    # password ya NO se pide al cliente; el sistema la genera automáticamente.
    # Se expone como read_only para devolverla una sola vez en la respuesta.
    password_generada = serializers.CharField(read_only=True)

    class Meta:
        model = Usuario
        fields = ['email', 'nombre', 'apellidos', 'rol',
                  'area_responsable', 'telefono', 'password_generada']

    def create(self, validated_data):
        # El sistema genera la contraseña temporal (el admin ya no la inventa)
        password = generar_password_temporal()
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        # Guardamos la password en claro SOLO en memoria para enviarla por correo
        user._password_temporal_plano = password
        return user


class ValidarTokenAccesoSerializer(serializers.Serializer):
    """Valida el token único del candidato antes de dejarlo entrar."""
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = TokenAcceso.objects.select_related('candidato').get(token=value)
        except TokenAcceso.DoesNotExist:
            raise serializers.ValidationError('Token inválido o inexistente.')

        if not token_obj.es_valido:
            if token_obj.usado:
                raise serializers.ValidationError('Este link ya fue utilizado.')
            raise serializers.ValidationError('Este link ha expirado. Solicita uno nuevo.')

        self.token_obj = token_obj
        return value


class RegistroCandidatoConTokenSerializer(serializers.Serializer):
    """El candidato crea su cuenta la primera vez que usa el link único."""
    token    = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_token(self, value):
        try:
            token_obj = TokenAcceso.objects.select_related('candidato').get(token=value)
        except TokenAcceso.DoesNotExist:
            raise serializers.ValidationError('Token inválido.')

        if not token_obj.es_valido:
            raise serializers.ValidationError('Token expirado o ya utilizado.')

        self.token_obj = token_obj
        return value

    def create(self, validated_data):
        token_obj = self.token_obj
        candidato = token_obj.candidato

        # Si ya tiene cuenta, solo devolver JWT
        if candidato.usuario_cuenta:
            return candidato.usuario_cuenta

        # Crear cuenta de postulante
        user = Usuario.objects.create_user(
            email     = candidato.email,
            password  = validated_data['password'],
            nombre    = candidato.nombre,
            apellidos = f'{candidato.apellido_paterno} {candidato.apellido_materno}'.strip(),
            rol       = 'candidato',  # Rol especial para postulantes
        )

        # Vincular cuenta con candidato
        candidato.usuario_cuenta = user
        candidato.save(update_fields=['usuario_cuenta'])

        # Marcar token como usado
        token_obj.marcar_como_usado()

        return user