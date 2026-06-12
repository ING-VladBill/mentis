# ==========================================
# vacantes/views.py (Sprint 2 - completo)
# ==========================================

import json
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse

from .models import Vacante, Area
from .serializers import (
    AreaSerializer,
    AreaSimpleSerializer,
    VacanteListSerializer,
    VacanteDetalleSerializer,
    VacanteCreateSerializer,
)
from mentis_backend.permissions import EsReclutadorOAdmin, EsGerenteOAdmin, EsAdmin


# ==========================================
# AREA VIEWSET
# ==========================================

class AreaViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['nombre', 'codigo_corto', 'descripcion']
    ordering_fields = ['orden', 'nombre']
    ordering        = ['orden', 'nombre']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'activas']:
            return [EsReclutadorOAdmin()]
        return [EsAdmin()]

    def get_serializer_class(self):
        if self.action == 'activas':
            return AreaSimpleSerializer
        return AreaSerializer

    def get_queryset(self):
        qs = Area.objects.all()
        if self.request.query_params.get('activas') == 'true':
            qs = qs.filter(activa=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        area = self.get_object()
        if area.es_predefinida:
            return Response(
                {'error': 'Las áreas predefinidas no pueden eliminarse. Puedes desactivarla.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if area.total_vacantes > 0:
            return Response(
                {'error': f'No puedes eliminar esta área porque tiene {area.total_vacantes} vacante(s) asociada(s).'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='activas')
    def activas(self, request):
        areas = Area.objects.filter(activa=True).order_by('orden', 'nombre')
        return Response(AreaSimpleSerializer(areas, many=True).data)

    @action(detail=True, methods=['post'], url_path='desactivar')
    def desactivar(self, request, pk=None):
        area = self.get_object()
        if area.vacantes_abiertas > 0:
            return Response(
                {'error': f'Esta área tiene {area.vacantes_abiertas} vacante(s) abiertas. Ciérralas primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        area.desactivar()
        return Response({'mensaje': f'Área "{area.nombre}" desactivada.', 'area': AreaSerializer(area).data})

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        area = self.get_object()
        area.activar()
        return Response({'mensaje': f'Área "{area.nombre}" activada.', 'area': AreaSerializer(area).data})


# ==========================================
# VACANTE VIEWSET
# ==========================================

class VacanteViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['titulo', 'codigo', 'descripcion', 'area__nombre']
    ordering_fields = ['fecha_creacion', 'titulo', 'prioridad', 'estado', 'fecha_limite']
    ordering        = ['-fecha_creacion']

    def get_permissions(self):
        if self.action == 'estadisticas':
            return [EsGerenteOAdmin()]
        return [EsReclutadorOAdmin()]

    def get_serializer_class(self):
        if self.action == 'list':
            return VacanteListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return VacanteCreateSerializer
        return VacanteDetalleSerializer

    def get_queryset(self):
        qs = Vacante.objects.select_related('area', 'creado_por').all()

        area_id = self.request.query_params.get('area_id')
        if area_id:
            qs = qs.filter(area_id=area_id)

        area_codigo = self.request.query_params.get('area')
        if area_codigo:
            qs = qs.filter(area__codigo_corto=area_codigo.upper())

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)

        prioridad = self.request.query_params.get('prioridad')
        if prioridad:
            qs = qs.filter(prioridad=prioridad)

        confidencial = self.request.query_params.get('confidencial')
        if confidencial is not None:
            qs = qs.filter(confidencial=confidencial == 'true')

        return qs

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user, estado='abierta')

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.estado == 'abierta' and not instance.fecha_publicacion:
            instance.fecha_publicacion = timezone.now()
            instance.save(update_fields=['fecha_publicacion'])

    # ------------------------------------------
    # DUPLICAR VACANTE
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='duplicar')
    def duplicar(self, request, pk=None):
        """
        POST /api/vacantes/{id}/duplicar/
        Crea una copia de la vacante con estado borrador y nuevo código.
        Los textos editados NO se copian (la copia genera los suyos propios).
        """
        original = self.get_object()
        nueva = Vacante.objects.create(
            titulo               = f'{original.titulo} (copia)',
            area                 = original.area,
            departamento         = original.departamento,
            industria            = original.industria,
            motivo_vacante       = original.motivo_vacante,
            jefe_directo         = original.jefe_directo,
            solicitante          = original.solicitante,
            cantidad_posiciones  = original.cantidad_posiciones,
            descripcion          = original.descripcion,
            responsabilidades    = original.responsabilidades,
            requisitos           = original.requisitos,
            requisitos_deseables = original.requisitos_deseables,
            habilidades          = original.habilidades,
            tecnologias          = original.tecnologias,
            conocimientos_especificos = original.conocimientos_especificos,
            nivel_experiencia    = original.nivel_experiencia,
            anios_experiencia    = original.anios_experiencia,
            nivel_educativo      = original.nivel_educativo,
            carrera_afin         = original.carrera_afin,
            modalidad            = original.modalidad,
            tipo_contrato        = original.tipo_contrato,
            horario              = original.horario,
            horario_tipo         = original.horario_tipo,
            ubicacion            = original.ubicacion,
            ciudad               = original.ciudad,
            pais                 = original.pais,
            salario_minimo       = original.salario_minimo,
            salario_maximo       = original.salario_maximo,
            moneda               = original.moneda,
            mostrar_salario      = original.mostrar_salario,
            beneficios           = original.beneficios,
            prioridad            = original.prioridad,
            confidencial         = original.confidencial,
            score_cv_minimo      = original.score_cv_minimo,
            nota_minima_examen   = original.nota_minima_examen,
            top_candidatos_finalistas = original.top_candidatos_finalistas,
            estado               = 'borrador',
            creado_por           = request.user,
        )
        return Response({
            'mensaje': f'Vacante duplicada correctamente.',
            'vacante': VacanteDetalleSerializer(nueva).data,
        }, status=status.HTTP_201_CREATED)

    # ------------------------------------------
    # REACTIVAR VACANTE
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='reactivar')
    def reactivar(self, request, pk=None):
        """
        POST /api/vacantes/{id}/reactivar/
        Reactiva una vacante cerrada/cancelada sin recrearla.
        """
        vacante = self.get_object()
        if vacante.estado not in ('cerrada', 'cancelada', 'pausada'):
            return Response(
                {'error': f'Solo se pueden reactivar vacantes cerradas, canceladas o pausadas. Estado actual: {vacante.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        vacante.estado            = 'abierta'
        vacante.fecha_publicacion = timezone.now()
        vacante.fecha_cierre      = None
        vacante.posiciones_cubiertas = 0
        vacante.save(update_fields=['estado', 'fecha_publicacion', 'fecha_cierre', 'posiciones_cubiertas'])
        return Response({
            'mensaje': 'Vacante reactivada correctamente.',
            'vacante': VacanteDetalleSerializer(vacante).data,
        })

    # ------------------------------------------
    # TEXTOS DE PUBLICACIÓN (GET + PATCH)
    # ------------------------------------------
    @action(detail=True, methods=['get', 'patch'], url_path='textos-publicacion')
    def textos_publicacion(self, request, pk=None):
        """
        GET  /api/vacantes/{id}/textos-publicacion/
             Devuelve los textos editados si existen, o los genera automáticamente.
             La respuesta incluye 'fuente': 'editado' | 'generado' para que el
             frontend sepa si ya fue personalizado por RRHH.

        PATCH /api/vacantes/{id}/textos-publicacion/
             Guarda los textos editados por RRHH. Solo se guardan los canales
             enviados en el body (linkedin, computrabajo, whatsapp, indeed).
             Para resetear un canal al texto automático, envíalo con valor null.
             Para resetear todos los canales, envía {"reset": true}.

        Body de PATCH:
            {
                "linkedin":     "texto editado...",
                "computrabajo": "texto editado...",
                "whatsapp":     null,
                "indeed":       "texto editado..."
            }
        """
        vacante = self.get_object()

        if vacante.confidencial:
            return Response(
                {'error': 'Vacante confidencial. No se generan textos de publicación.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        CANALES_VALIDOS = {'linkedin', 'computrabajo', 'whatsapp', 'indeed'}

        # ── GET ──────────────────────────────────────────────────
        if request.method == 'GET':
            automaticos = vacante.generar_textos_publicacion()
            if 'error' in automaticos:
                return Response(automaticos, status=status.HTTP_400_BAD_REQUEST)

            editados = vacante.textos_editados or {}

            textos = {}
            for canal in CANALES_VALIDOS:
                textos[canal] = editados.get(canal) or automaticos.get(canal, '')

            return Response({
                **textos,
                'email_postulaciones': automaticos['email_postulaciones'],
                'link_formulario':     automaticos['link_formulario'],
                'fuente': {
                    canal: ('editado' if editados.get(canal) else 'generado')
                    for canal in CANALES_VALIDOS
                },
            })

        # ── PATCH ─────────────────────────────────────────────────
        if request.data.get('reset'):
            vacante.textos_editados = {}
            vacante.save(update_fields=['textos_editados'])
            return Response({'mensaje': 'Textos reseteados. Se usarán los generados automáticamente.'})

        editados = dict(vacante.textos_editados or {})
        errores  = []

        for canal, valor in request.data.items():
            if canal not in CANALES_VALIDOS:
                errores.append(f'Canal desconocido: "{canal}". Válidos: {sorted(CANALES_VALIDOS)}')
                continue
            if valor is None:
                editados.pop(canal, None)
            elif isinstance(valor, str) and valor.strip():
                editados[canal] = valor.strip()
            else:
                errores.append(f'El valor de "{canal}" debe ser un texto no vacío o null para resetear.')

        if errores:
            return Response({'errores': errores}, status=status.HTTP_400_BAD_REQUEST)

        vacante.textos_editados = editados
        vacante.save(update_fields=['textos_editados'])

        automaticos = vacante.generar_textos_publicacion()
        textos = {}
        for canal in CANALES_VALIDOS:
            textos[canal] = editados.get(canal) or automaticos.get(canal, '')

        return Response({
            **textos,
            'email_postulaciones': automaticos['email_postulaciones'],
            'link_formulario':     automaticos['link_formulario'],
            'fuente': {
                canal: ('editado' if editados.get(canal) else 'generado')
                for canal in CANALES_VALIDOS
            },
            'mensaje': 'Textos guardados correctamente.',
        })

    # ------------------------------------------
    # SCHEMA.ORG PARA GOOGLE FOR JOBS
    # ------------------------------------------
    @action(detail=True, methods=['get'], url_path='schema-org', permission_classes=[AllowAny])
    def schema_org(self, request, pk=None):
        """
        GET /api/vacantes/{id}/schema-org/
        Retorna el JSON-LD de schema.org/JobPosting para Google for Jobs.
        """
        vacante = self.get_object()
        if vacante.confidencial or vacante.estado != 'abierta':
            return Response({'error': 'Vacante no disponible.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(vacante.schema_org())

    # ------------------------------------------
    # FEED XML PARA INDEED
    # ------------------------------------------
    @action(detail=False, methods=['get'], url_path='feed-indeed', permission_classes=[AllowAny])
    def feed_indeed(self, request):
        """
        GET /api/vacantes/feed-indeed/
        Feed XML de todas las vacantes abiertas y no confidenciales para Indeed.
        Registrar esta URL en: https://indeed.com/publisher
        """
        from django.conf import settings as django_settings
        from usuarios.models import Empresa
        vacantes       = Vacante.objects.filter(estado='abierta', confidencial=False).select_related('area')
        base_url       = django_settings.MENTIS['FRONTEND_URL']
        empresa        = Empresa.get_instancia()
        nombre_empresa = empresa.nombre
        sitio_empresa  = empresa.sitio_web or base_url

        items_xml = ''
        for v in vacantes:
            salario = ''
            if v.mostrar_salario and v.salario_minimo and v.salario_maximo:
                salario = f'<salary>{v.moneda} {v.salario_minimo:,.0f} – {v.salario_maximo:,.0f}</salary>'

            items_xml += f'''
  <job>
    <title><![CDATA[{v.titulo}]]></title>
    <date>{(v.fecha_publicacion or v.fecha_creacion).strftime('%a, %d %b %Y %H:%M:%S +0000')}</date>
    <referencenumber>{v.codigo}</referencenumber>
    <url>{v.get_url_formulario_publico()}</url>
    <company><![CDATA[{nombre_empresa}]]></company>
    <city>{v.ciudad}</city>
    <country>PE</country>
    <description><![CDATA[{v.descripcion}\n\nREQUISITOS:\n{v.requisitos}]]></description>
    <jobtype>{v._employment_type().replace('_', ' ').title()}</jobtype>
    {salario}
    <email>{v.get_email_postulaciones()}</email>
  </job>'''

        xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>{nombre_empresa}</publisher>
  <publisherurl>{sitio_empresa}</publisherurl>
  <lastBuildDate>{timezone.now().strftime('%a, %d %b %Y %H:%M:%S +0000')}</lastBuildDate>
{items_xml}
</source>'''

        return HttpResponse(xml, content_type='application/xml; charset=utf-8')
    # ------------------------------------------
    # CAMBIAR ESTADO
    # ------------------------------------------
    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None):
        vacante      = self.get_object()
        nuevo_estado = request.data.get('estado')
        estados_validos = [s[0] for s in Vacante.ESTADO_CHOICES]
        if nuevo_estado not in estados_validos:
            return Response({'error': f'Estado inválido. Opciones: {estados_validos}'}, status=400)
        vacante.estado = nuevo_estado
        if nuevo_estado == 'abierta' and not vacante.fecha_publicacion:
            vacante.fecha_publicacion = timezone.now()
        if nuevo_estado == 'cerrada' and not vacante.fecha_cierre:
            vacante.fecha_cierre = timezone.now()
        vacante.save()
        return Response({'mensaje': f'Estado cambiado a {vacante.get_estado_display()}.', 'vacante': VacanteDetalleSerializer(vacante).data})

    # ------------------------------------------
    # ABIERTAS
    # ------------------------------------------
    @action(detail=False, methods=['get'], url_path='abiertas')
    def abiertas(self, request):
        vacantes = self.get_queryset().filter(estado='abierta')
        return Response({'total': vacantes.count(), 'vacantes': VacanteListSerializer(vacantes, many=True).data})

    # ------------------------------------------
    # POR ÁREA
    # ------------------------------------------
    @action(detail=False, methods=['get'], url_path='por-area')
    def por_area(self, request):
        from django.db.models import Count
        resumen = (
            self.get_queryset()
            .values('area__id', 'area__nombre', 'area__codigo_corto', 'area__color')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        return Response([
            {'area_id': i['area__id'], 'area': i['area__nombre'],
             'codigo': i['area__codigo_corto'], 'color': i['area__color'], 'total': i['total']}
            for i in resumen
        ])

    # ------------------------------------------
    # ESTADÍSTICAS
    # ------------------------------------------
    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        from django.db.models import Count, Avg
        from candidatos.models import Candidato
        return Response({
            'vacantes': {
                'total':    Vacante.objects.count(),
                'abiertas': Vacante.objects.filter(estado='abierta').count(),
                'confidenciales': Vacante.objects.filter(confidencial=True).count(),
                'por_area': list(
                    Vacante.objects.values('area__nombre', 'area__color', 'area__codigo_corto')
                    .annotate(total=Count('id')).order_by('-total')[:8]
                ),
            },
            'candidatos': {
                'total':     Candidato.objects.count(),
                'activos':   Candidato.objects.exclude(estado__in=['cv_rechazado', 'examen_rechazado', 'descartado']).count(),
                'finalistas': Candidato.objects.filter(es_finalista=True).count(),
                'score_promedio': Candidato.objects.filter(score_final__isnull=False).aggregate(Avg('score_final'))['score_final__avg'],
            },
        })


# ==========================================
# FORMULARIO PÚBLICO DE POSTULACIÓN (sin login)
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def formulario_publico_info(request, codigo):
    """
    GET /api/postular/{codigo}/
    Retorna info de la vacante para mostrar en el formulario público.
    """
    try:
        vacante = Vacante.objects.select_related('area').get(codigo=codigo, estado='abierta')
    except Vacante.DoesNotExist:
        return Response({'error': 'Vacante no encontrada o no disponible.'}, status=status.HTTP_404_NOT_FOUND)

    if vacante.confidencial:
        return Response({'error': 'Esta vacante no acepta postulaciones en línea.'}, status=status.HTTP_403_FORBIDDEN)

    if vacante.esta_completa:
        return Response({'error': 'Esta vacante ya cubrió todas sus posiciones.'}, status=status.HTTP_410_GONE)

    return Response({
        'codigo':               vacante.codigo,
        'titulo':               vacante.titulo,
        'area':                 vacante.area.nombre,
        'nivel':                vacante.get_nivel_experiencia_display(),
        'modalidad':            vacante.get_modalidad_display(),
        'ciudad':               vacante.ciudad,
        'tipo_contrato':        vacante.get_tipo_contrato_display(),
        'horario':              vacante.horario,
        'descripcion':          vacante.descripcion,
        'requisitos':           vacante.requisitos,
        'requisitos_deseables': vacante.requisitos_deseables,
        'beneficios':           vacante.beneficios,
        'mostrar_salario':      vacante.mostrar_salario,
        'salario_minimo':       str(vacante.salario_minimo) if vacante.mostrar_salario else None,
        'salario_maximo':       str(vacante.salario_maximo) if vacante.mostrar_salario else None,
        'moneda':               vacante.moneda if vacante.mostrar_salario else None,
        'schema_org':           vacante.schema_org(),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def formulario_publico_postular(request, codigo):
    """
    POST /api/postular/{codigo}/enviar/
    El candidato sube su CV desde el formulario público.
    Crea el candidato automáticamente y lanza el análisis IA.
    """
    import threading
    from candidatos.servicios.correos import enviar_correo_confirmacion_postulacion

    try:
        vacante = Vacante.objects.get(codigo=codigo, estado='abierta')
    except Vacante.DoesNotExist:
        return Response({'error': 'Vacante no encontrada o cerrada.'}, status=404)

    if vacante.confidencial:
        return Response({'error': 'Esta vacante no acepta postulaciones en línea.'}, status=403)

    if vacante.esta_completa:
        return Response({'error': 'Esta vacante ya cubrió todas sus posiciones.'}, status=410)

    nombre   = request.data.get('nombre', '').strip()
    apellido = request.data.get('apellido_paterno', '').strip()
    email    = request.data.get('email', '').strip()
    cv_file  = request.FILES.get('cv')

    if not all([nombre, apellido, email, cv_file]):
        return Response({'error': 'Nombre, apellido, email y CV son obligatorios.'}, status=400)

    if not cv_file.name.lower().endswith('.pdf'):
        return Response({'error': 'El CV debe ser un archivo PDF.'}, status=400)

    from candidatos.models import Candidato
    if Candidato.objects.filter(email=email, vacante=vacante).exists():
        return Response({'error': 'Ya existe una postulación con este email para esta vacante.'}, status=400)

    from candidatos.servicios.analisis_cv import extraer_texto_pdf
    texto_cv = extraer_texto_pdf(cv_file)
    cv_file.seek(0)

    candidato = Candidato.objects.create(
        vacante              = vacante,
        nombre               = nombre,
        apellido_paterno     = apellido,
        apellido_materno     = request.data.get('apellido_materno', ''),
        email                = email,
        telefono             = request.data.get('telefono', ''),
        ciudad               = request.data.get('ciudad', ''),
        linkedin             = request.data.get('linkedin', ''),
        cv                   = cv_file,
        cv_texto_extraido    = texto_cv,
        pretension_salarial  = request.data.get('pretension_salarial') or None,
        disponibilidad       = request.data.get('disponibilidad', ''),
        acepta_modalidad     = request.data.get('acepta_modalidad') == 'true',
        acepta_ciudad        = request.data.get('acepta_ciudad') == 'true',
        source               = 'formulario',
        estado               = 'postulado',
    )

    threading.Thread(
        target=enviar_correo_confirmacion_postulacion,
        args=(candidato,),
        daemon=True
    ).start()

    def _analizar():
        try:
            from candidatos.servicios.analisis_cv import analizar_cv
            from candidatos.servicios.correos import enviar_correo_avance_cv
            resultado = analizar_cv(candidato, vacante)
            if resultado['pasa_filtro']:
                enviar_correo_avance_cv(candidato)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f'Error analizando CV desde formulario público: {e}')

    threading.Thread(target=_analizar, daemon=True).start()

    return Response({
        'mensaje': 'Tu postulación fue recibida correctamente. Te contactaremos si avanzas en el proceso.',
        'candidato_id': candidato.id,
    }, status=status.HTTP_201_CREATED)