# ==========================================
# evaluaciones/urls.py (Sprint 3 - RRHH)
# ==========================================

from rest_framework.routers import DefaultRouter
from .views import ExamenViewSet

router = DefaultRouter()
router.register(r'examenes', ExamenViewSet, basename='examen')

urlpatterns = router.urls
