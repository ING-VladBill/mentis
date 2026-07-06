# ==========================================
# evaluaciones/urls.py (Sprint 3 + Sprint 4)
# ==========================================

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ExamenViewSet
from .views_entrevista import (
    PlantillaEvaluacionViewSet,
    EntrevistaViewSet,
    entrevista_acceso,
    entrevista_iniciar,
    entrevista_finalizar,
    entrevista_captura,
    entrevista_evento,
)

router = DefaultRouter()
router.register(r'examenes',    ExamenViewSet,             basename='examen')
router.register(r'plantillas',  PlantillaEvaluacionViewSet, basename='plantilla')
router.register(r'entrevistas', EntrevistaViewSet,          basename='entrevista')

urlpatterns = router.urls

# --- Endpoints públicos del candidato (autenticados por token de acceso) ---
# Se montan bajo /api/evaluaciones/ vía el include() del urls.py principal;
# el urls.py principal además los expone en /api/entrevista/ (ver nota de instalación)
urlpatterns += [
    path('entrevista/acceso/',    entrevista_acceso,    name='entrevista-acceso'),
    path('entrevista/iniciar/',   entrevista_iniciar,   name='entrevista-iniciar'),
    path('entrevista/finalizar/', entrevista_finalizar, name='entrevista-finalizar'),
    path('entrevista/captura/',   entrevista_captura,   name='entrevista-captura'),
    path('entrevista/evento/',    entrevista_evento,    name='entrevista-evento'),
]