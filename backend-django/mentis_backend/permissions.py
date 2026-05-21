# ==========================================
# mentis_backend/permissions.py
# ==========================================

from rest_framework.permissions import BasePermission


class EsAdmin(BasePermission):
    """Solo administradores del sistema."""
    message = 'Se requiere rol de Administrador.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'es_admin') and
            request.user.es_admin
        )


class EsReclutadorOAdmin(BasePermission):
    """Reclutadores y administradores."""
    message = 'Se requiere rol de Reclutador o Administrador.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'es_reclutador') and
            request.user.es_reclutador
        )


class EsEvaluadorOAdmin(BasePermission):
    """Evaluadores y administradores."""
    message = 'Se requiere rol de Evaluador o Administrador.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'es_evaluador') and
            request.user.es_evaluador
        )


class EsGerenteOAdmin(BasePermission):
    """Gerentes y administradores (solo lectura de reportes)."""
    message = 'Se requiere rol de Gerente o Administrador.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'es_gerente') and
            request.user.es_gerente
        )


class EsCandidato(BasePermission):
    """Solo candidatos (postulantes)."""
    message = 'Solo los postulantes pueden acceder.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            getattr(request.user, 'rol', None) == 'candidato'
        )


class EsRRHHOCandidatoPropietario(BasePermission):
    """RRHH puede ver todo; candidato solo su propia info."""

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.es_reclutador:
            return True
        # Candidato: solo puede ver su propio perfil
        if request.user.rol == 'candidato':
            return (
                hasattr(obj, 'usuario_cuenta') and
                obj.usuario_cuenta == request.user
            )
        return False
