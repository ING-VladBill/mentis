from rest_framework import serializers
from .models import Candidato
from vacantes.serializers import VacanteSerializer

class CandidatoSerializer(serializers.ModelSerializer):
    vacante_detalle = VacanteSerializer(source='vacante', read_only=True)
    
    class Meta:
        model = Candidato
        fields = '__all__'
        read_only_fields = ['fecha_registro']