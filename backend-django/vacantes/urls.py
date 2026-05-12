from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VacanteViewSet

router = DefaultRouter()
router.register(r'vacantes', VacanteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]