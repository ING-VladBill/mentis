from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Candidato
from .serializers import CandidatoSerializer

class CandidatoViewSet(viewsets.ModelViewSet):
    queryset = Candidato.objects.all()
    serializer_class = CandidatoSerializer
    
    @action(detail=False, methods=['get'])
    def por_vacante(self, request):
        vacante_id = request.query_params.get('vacante_id')
        if vacante_id:
            candidatos = self.queryset.filter(vacante_id=vacante_id)
            serializer = self.get_serializer(candidatos, many=True)
            return Response(serializer.data)
        return Response({'error': 'Debe proporcionar vacante_id'}, status=400)