# ==========================================
# mentis_backend/utils.py
# ==========================================

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Handler global de excepciones para la API.
    Normaliza todos los errores al mismo formato JSON.
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'error': True,
            'status_code': response.status_code,
            'mensaje': _extraer_mensaje(response.data),
            'detalle': response.data,
        }
        response.data = error_data
    else:
        # Error no manejado por DRF (500)
        logger.exception(f'Error no controlado: {exc}')
        response = Response(
            {
                'error': True,
                'status_code': 500,
                'mensaje': 'Error interno del servidor. Contacta al administrador.',
                'detalle': str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response


def _extraer_mensaje(data) -> str:
    """Extrae un mensaje legible del error."""
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        # DRF pone 'detail' en errores de autenticación
        if 'detail' in data:
            return str(data['detail'])
        # Tomar el primer error del primer campo
        for key, value in data.items():
            if isinstance(value, list) and value:
                return f'{key}: {value[0]}'
            if isinstance(value, str):
                return f'{key}: {value}'
    if isinstance(data, list) and data:
        return str(data[0])
    return 'Ha ocurrido un error.'


# ------------------------------------------
# HELPERS GENERALES
# ------------------------------------------

def paginar_queryset(queryset, request, serializer_class):
    """Helper para paginar cualquier queryset."""
    from rest_framework.pagination import PageNumberPagination

    paginator = PageNumberPagination()
    paginator.page_size = request.query_params.get('page_size', 20)

    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        serializer = serializer_class(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    serializer = serializer_class(queryset, many=True, context={'request': request})
    return Response(serializer.data)
