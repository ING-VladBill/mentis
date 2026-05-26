# ==========================================
# mentis_backend/urls.py - ACTUALIZADO
# Agrega AreaViewSet al router
# ==========================================

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from vacantes.views import VacanteViewSet, AreaViewSet
from candidatos.views import CandidatoViewSet

from autenticacion.views import (
    LoginRRHHView, RefreshTokenView, logout_view,
    validar_token_acceso, registro_candidato_con_token,
    login_candidato, perfil_usuario,
    crear_usuario_rrhh, listar_usuarios_rrhh, editar_usuario_rrhh,
)

router = DefaultRouter()
router.register(r'areas',      AreaViewSet,      basename='area')
router.register(r'vacantes',   VacanteViewSet,   basename='vacante')
router.register(r'candidatos', CandidatoViewSet, basename='candidato')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Swagger / OpenAPI
    path('api/schema/',          SpectacularAPIView.as_view(),        name='schema'),
    path('api/docs/',            SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/',           SpectacularRedocView.as_view(url_name='schema'),   name='redoc'),


    # Auth
    path('api/auth/login/',               LoginRRHHView.as_view(),          name='auth-login'),
    path('api/auth/refresh/',             RefreshTokenView.as_view(),       name='auth-refresh'),
    path('api/auth/logout/',              logout_view,                      name='auth-logout'),
    path('api/auth/validar-token/',       validar_token_acceso,             name='auth-validar-token'),
    path('api/auth/registro-candidato/',  registro_candidato_con_token,     name='auth-registro-candidato'),
    path('api/auth/login-candidato/',     login_candidato,                  name='auth-login-candidato'),
    path('api/auth/perfil/',              perfil_usuario,                   name='auth-perfil'),
    path('api/auth/usuarios/',            listar_usuarios_rrhh,             name='auth-usuarios-list'),
    path('api/auth/usuarios/crear/',      crear_usuario_rrhh,               name='auth-usuarios-crear'),
    path('api/auth/usuarios/<int:pk>/',   editar_usuario_rrhh,              name='auth-usuarios-editar'),

    # API REST
    path('api/', include(router.urls)),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
