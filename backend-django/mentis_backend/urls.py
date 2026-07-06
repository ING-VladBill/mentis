# ==========================================
# mentis_backend/urls.py (Sprint 4 - completo)
# ==========================================

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from vacantes.views import (
    VacanteViewSet, AreaViewSet,
    formulario_publico_info, formulario_publico_postular,
    formulario_publico_vacantes,
)
from candidatos.views import CandidatoViewSet, TagViewSet, notificar_avance_examen
from autenticacion.views import (
    LoginRRHHView, RefreshTokenView, logout_view,
    validar_token_acceso, registro_candidato_con_token,
    login_candidato, perfil_usuario,
    crear_usuario_rrhh, listar_usuarios_rrhh,
    desactivar_usuario, activar_usuario, cambiar_password_usuario,
    reenviar_credenciales,
)

router = DefaultRouter()
router.register(r'areas',      AreaViewSet,      basename='area')
router.register(r'vacantes',   VacanteViewSet,   basename='vacante')
router.register(r'candidatos', CandidatoViewSet, basename='candidato')
router.register(r'tags',       TagViewSet,       basename='tag')

urlpatterns = [
    path('api/interno/candidatos/<int:candidato_id>/notificar-avance-examen/', notificar_avance_examen, name='notificar-avance-examen'),
    path('admin/', admin.site.urls),

    # ------------------------------------------
    # AUTENTICACIÓN
    # ------------------------------------------
    path('api/auth/login/',               LoginRRHHView.as_view(),         name='auth-login'),
    path('api/auth/refresh/',             RefreshTokenView.as_view(),      name='auth-refresh'),
    path('api/auth/logout/',              logout_view,                     name='auth-logout'),
    path('api/auth/validar-token/',       validar_token_acceso,            name='auth-validar-token'),
    path('api/auth/registro-candidato/',  registro_candidato_con_token,    name='auth-registro-candidato'),
    path('api/auth/login-candidato/',     login_candidato,                 name='auth-login-candidato'),
    path('api/auth/perfil/',              perfil_usuario,                  name='auth-perfil'),

    # Gestión de usuarios RRHH
    path('api/auth/usuarios/',                       listar_usuarios_rrhh,      name='auth-usuarios-list'),
    path('api/auth/usuarios/crear/',                 crear_usuario_rrhh,        name='auth-usuarios-crear'),
    path('api/auth/usuarios/<int:pk>/desactivar/',   desactivar_usuario,        name='auth-usuarios-desactivar'),
    path('api/auth/usuarios/<int:pk>/activar/',      activar_usuario,           name='auth-usuarios-activar'),
    path('api/auth/usuarios/<int:pk>/cambiar-password/', cambiar_password_usuario, name='auth-usuarios-password'),
    path('api/auth/usuarios/<int:pk>/reenviar-credenciales/', reenviar_credenciales, name='auth-usuarios-reenviar'),

    # ------------------------------------------
    # FORMULARIO PÚBLICO (sin login)
    # ------------------------------------------
    path('api/vacantes/publicas/',             formulario_publico_vacantes, name='vacantes-publicas'),
    path('api/postular/<str:codigo>/',         formulario_publico_info,     name='postular-info'),
    path('api/postular/<str:codigo>/enviar/',  formulario_publico_postular, name='postular-enviar'),
    
    # ------------------------------------------
    # Lista y detalle de exámenes técnicos (gestionados por Spring Boot, pero Django es el dueño del esquema)
    # ------------------------------------------
    path('api/evaluaciones/', include('evaluaciones.urls')),
    # ------------------------------------------
    # API REST (router)
    # ------------------------------------------
    path('api/', include(router.urls)),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)