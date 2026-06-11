from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vacante
from .serializers import VacanteSerializer

class VacanteViewSet(viewsets.ModelViewSet):
    queryset = Vacante.objects.all()
    serializer_class = VacanteSerializer
    
    @action(detail=False, methods=['get'])
    def abiertas(self, request):
        vacantes = self.queryset.filter(estado='abierta')
        serializer = self.get_serializer(vacantes, many=True)
        return Response(serializer.data)