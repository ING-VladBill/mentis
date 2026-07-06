from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CandidatoViewSet, NotificacionViewSet

router = DefaultRouter()
router.register(r'candidatos', CandidatoViewSet)
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('', include(router.urls)),
]