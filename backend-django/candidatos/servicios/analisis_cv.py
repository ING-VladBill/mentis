# ==========================================
# candidatos/servicios/analisis_cv.py
# ==========================================

import io
import json
import logging
from typing import Optional

import PyPDF2
from pdfminer.high_level import extract_text as pdfminer_extract
from openai import OpenAI
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)


# ------------------------------------------
# EXTRACCIÓN DE TEXTO DEL PDF
# ------------------------------------------

def extraer_texto_pdf(archivo) -> str:
    """
    Extrae el texto de un PDF.
    Intenta primero con PyPDF2 (rápido) y si falla usa pdfminer (más robusto).
    """
    texto = ''

    # Intento 1: PyPDF2
    try:
        archivo.seek(0)
        reader = PyPDF2.PdfReader(archivo)
        for page in reader.pages:
            texto += page.extract_text() or ''
        if len(texto.strip()) > 100:
            return _limpiar_texto(texto)
    except Exception as e:
        logger.warning(f'PyPDF2 falló: {e}. Intentando con pdfminer...')

    # Intento 2: pdfminer (mejor con PDFs escaneados/complejos)
    try:
        archivo.seek(0)
        contenido = archivo.read()
        texto = pdfminer_extract(io.BytesIO(contenido))
        if len(texto.strip()) > 100:
            return _limpiar_texto(texto)
    except Exception as e:
        logger.error(f'pdfminer también falló: {e}')

    return texto


def _limpiar_texto(texto: str) -> str:
    """Limpia el texto extraído del PDF."""
    import re
    texto = re.sub(r'\n{3,}', '\n\n', texto)
    texto = re.sub(r' {2,}', ' ', texto)
    return texto.strip()


# ------------------------------------------
# ANÁLISIS DE CV CON IA
# ------------------------------------------

def analizar_cv(candidato, vacante) -> dict:
    """
    Función principal. Analiza el CV del candidato contra la vacante específica.
    Retorna un dict con score, clasificación, inconsistencias, etc.
    """
    if not candidato.cv_texto_extraido:
        raise ValueError('El CV no tiene texto extraído. Procesa el PDF primero.')

    prompt = _construir_prompt_analisis(candidato, vacante)

    try:
        respuesta = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=0.3,  # Más determinístico para análisis
            messages=[
                {
                    'role': 'system',
                    'content': (
                        'Eres un experto reclutador con 15 años de experiencia evaluando candidatos. '
                        'Analizas CVs de manera objetiva y siempre respondes ÚNICAMENTE con JSON válido, '
                        'sin texto adicional antes ni después del JSON.'
                    )
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ]
        )

        contenido = respuesta.choices[0].message.content.strip()
        # Limpiar posibles marcadores markdown
        if contenido.startswith('```'):
            contenido = contenido.split('```')[1]
            if contenido.startswith('json'):
                contenido = contenido[4:]
        contenido = contenido.strip().rstrip('`')

        resultado = json.loads(contenido)
        return _procesar_resultado_analisis(resultado, candidato, vacante)

    except json.JSONDecodeError as e:
        logger.error(f'Error parseando JSON de OpenAI: {e}')
        raise ValueError('La IA devolvió un formato inválido. Intenta nuevamente.')
    except Exception as e:
        logger.error(f'Error llamando a OpenAI: {e}')
        raise


def _construir_prompt_analisis(candidato, vacante) -> str:
    """Construye el prompt adaptado al área de la vacante."""

    instruccion_area = _get_instruccion_por_area(vacante.area)

    return f"""
Analiza este CV para la siguiente vacante. RESPONDE SOLO CON JSON.

=== VACANTE ===
Título: {vacante.titulo}
Área: {vacante.get_area_display()}
Nivel: {vacante.get_nivel_experiencia_display()}
Años de experiencia requeridos: {vacante.anios_experiencia}+
Nivel educativo requerido: {vacante.nivel_educativo or 'No especificado'}

REQUISITOS OBLIGATORIOS:
{vacante.requisitos}

HABILIDADES REQUERIDAS:
{vacante.habilidades}

TECNOLOGÍAS/HERRAMIENTAS:
{vacante.tecnologias or 'No aplica para esta área'}

CONOCIMIENTOS ESPECÍFICOS:
{vacante.conocimientos_especificos or 'Según los requisitos listados'}

=== CV DEL CANDIDATO ===
{candidato.cv_texto_extraido[:4000]}

=== INSTRUCCIONES DE EVALUACIÓN SEGÚN ÁREA ===
{instruccion_area}

=== CRITERIOS DE SCORING ===
Score total 0-100 distribuido así:
- Match habilidades obligatorias: 40 puntos
- Años de experiencia: 20 puntos  
- Nivel educativo: 15 puntos
- Coherencia y consistencia del CV: 15 puntos
- Trayectoria profesional: 10 puntos

=== FORMATO DE RESPUESTA (JSON) ===
{{
  "score": <número 0-100>,
  "clasificacion": <"altamente_recomendado"|"recomendado"|"requiere_revision"|"no_apto">,
  "match_obligatorios": <porcentaje 0-100>,
  "match_deseables": <porcentaje 0-100>,
  "anios_experiencia_detectados": <número>,
  "nivel_educativo_detectado": <string>,
  "carrera_detectada": <string>,
  "nombre_detectado": <string o null>,
  "email_detectado": <email válido o null>,
  "telefono_detectado": <string o null>,
  "linkedin_detectado": <url o null>,
  "habilidades_detectadas": [<lista de habilidades encontradas en el CV>],
  "habilidades_requeridas_presentes": [<habilidades del listado de requisitos que SÍ tiene>],
  "habilidades_faltantes": [<habilidades requeridas que NO tiene>],
  "inconsistencias": [<lista de inconsistencias: gaps, fechas, contradicciones>],
  "fortalezas": [<lista de 3-5 puntos fuertes del candidato>],
  "debilidades": [<lista de 2-3 puntos a mejorar>],
  "resumen": "<resumen profesional del candidato en 3-4 oraciones>",
  "observaciones": "<observaciones adicionales para el reclutador>"
}}
"""


def _get_instruccion_por_area(area: str) -> str:
    """Devuelve instrucciones específicas según el área de la vacante."""
    instrucciones = {
        'tecnologia': (
            'Evalúa conocimientos técnicos: lenguajes de programación, frameworks, arquitectura, '
            'bases de datos, herramientas DevOps, metodologías ágiles. Verifica proyectos reales. '
            'Para roles senior, valora liderazgo técnico y decisiones de arquitectura.'
        ),
        'ventas': (
            'Evalúa experiencia en ventas B2B/B2C, manejo de CRM (Salesforce, HubSpot), '
            'técnicas de cierre, manejo de objeciones, métricas de ventas (cuotas, conversión). '
            'Valora logros concretos con números: porcentaje de cuota alcanzada, cartera de clientes.'
        ),
        'marketing': (
            'Evalúa conocimiento de marketing digital, SEO/SEM, redes sociales, analítica web '
            '(Google Analytics, Meta Ads), gestión de campañas, métricas (ROAS, CTR, CAC). '
            'Valora portfolio de campañas y casos de éxito medibles.'
        ),
        'legal': (
            'Evalúa formación jurídica, especialidad legal, conocimiento de legislación aplicable, '
            'experiencia en contratos, litigios o compliance. Para roles senior, valora gestión de equipos '
            'y toma de decisiones estratégicas legales.'
        ),
        'rrhh': (
            'Evalúa conocimiento de legislación laboral local, procesos de reclutamiento, '
            'gestión del desempeño, desarrollo organizacional y herramientas HRIS. '
            'Valora indicadores de gestión: tiempo de contratación, retención, clima laboral.'
        ),
        'finanzas': (
            'Evalúa conocimientos contables, NIIF/IFRS, análisis financiero, modelado financiero, '
            'herramientas (Excel avanzado, SAP, ERP). Valora precisión, experiencia en auditorías '
            'y manejo de presupuestos de la magnitud requerida.'
        ),
        'operaciones': (
            'Evalúa experiencia en gestión de procesos, optimización, KPIs operativos, '
            'metodologías (Lean, Six Sigma), gestión de equipos y proveedores. '
            'Valora mejoras concretas implementadas con impacto medible.'
        ),
        'diseno': (
            'Evalúa dominio de herramientas de diseño (Figma, Adobe Suite), portafolio de trabajos, '
            'conocimiento de principios de diseño UX/UI, experiencia con sistemas de diseño. '
            'La experiencia práctica es más valorada que la formación teórica.'
        ),
    }
    return instrucciones.get(area, (
        'Evalúa el nivel de conocimientos específicos del área según los requisitos de la vacante. '
        'Considera la experiencia práctica, formación académica y logros concretos en el área.'
    ))


def _procesar_resultado_analisis(resultado: dict, candidato, vacante) -> dict:
    """
    Procesa el resultado de la IA y actualiza el candidato en la BD.
    """
    from candidatos.models import Candidato

    score = resultado.get('score', 0)
    clasificacion = resultado.get('clasificacion', 'requiere_revision')

    # Determinar si pasa el filtro
    score_minimo = vacante.score_cv_minimo or settings.MENTIS['SCORE_CV_MINIMO']
    pasa_filtro = score >= score_minimo

    # Actualizar candidato con los datos de la IA
    candidato.cv_analizado        = True
    candidato.fecha_analisis_cv   = timezone.now()
    candidato.score_cv            = score
    candidato.clasificacion_ia    = clasificacion
    candidato.resumen_cv          = resultado.get('resumen', '')
    candidato.habilidades_detectadas = resultado.get('habilidades_detectadas', [])
    candidato.habilidades_faltantes  = resultado.get('habilidades_faltantes', [])
    candidato.inconsistencias_cv     = resultado.get('inconsistencias', [])
    candidato.match_porcentaje       = resultado.get('match_obligatorios', 0)
    candidato.analisis_detallado     = resultado

    # Actualizar datos si la IA los detectó y el candidato no los tenía
    if resultado.get('email_detectado') and not candidato.email:
        candidato.email = resultado['email_detectado']
    if resultado.get('telefono_detectado') and not candidato.telefono:
        candidato.telefono = resultado['telefono_detectado']
    if resultado.get('linkedin_detectado') and not candidato.linkedin:
        candidato.linkedin = resultado['linkedin_detectado']
    if resultado.get('anios_experiencia_detectados') and not candidato.anios_experiencia:
        candidato.anios_experiencia = resultado['anios_experiencia_detectados']
    if resultado.get('carrera_detectada') and not candidato.carrera:
        candidato.carrera = resultado['carrera_detectada']

    # Cambiar estado según resultado
    if pasa_filtro:
        candidato.estado = 'cv_aprobado'
    else:
        candidato.estado = 'cv_rechazado'

    candidato.save()

    return {
        'score': score,
        'pasa_filtro': pasa_filtro,
        'clasificacion': clasificacion,
        'resultado': resultado,
    }


# ------------------------------------------
# CARGA MASIVA DE CVs
# ------------------------------------------

def procesar_cv_individual(archivo_pdf, vacante_id: int, usuario_rrhh) -> dict:
    """
    Procesa un único PDF: extrae texto, extrae datos básicos con IA, crea candidato.
    Usado en la carga masiva.
    """
    from candidatos.models import Candidato
    from vacantes.models import Vacante

    vacante = Vacante.objects.get(id=vacante_id)
    texto   = extraer_texto_pdf(archivo_pdf)

    if not texto or len(texto.strip()) < 50:
        return {
            'exito': False,
            'error': 'No se pudo extraer texto del PDF. Verifica que no esté escaneado.',
            'archivo': archivo_pdf.name,
        }

    # Extracción rápida de datos básicos antes del análisis completo
    datos_basicos = _extraer_datos_basicos(texto)
    email = datos_basicos.get('email')

    if not email:
        return {
            'exito': False,
            'error': 'No se detectó email en el CV. Agrega el candidato manualmente.',
            'archivo': archivo_pdf.name,
        }

    # Evitar duplicados (mismo email + misma vacante)
    if Candidato.objects.filter(email=email, vacante=vacante).exists():
        return {
            'exito': False,
            'error': f'Ya existe un candidato con email {email} para esta vacante.',
            'archivo': archivo_pdf.name,
        }

    # Crear candidato
    candidato = Candidato.objects.create(
        vacante           = vacante,
        nombre            = datos_basicos.get('nombre', 'Nombre') or 'Nombre',
        apellido_paterno  = datos_basicos.get('apellidos', 'Apellido') or 'Apellido',
        email             = email,
        telefono          = datos_basicos.get('telefono', ''),
        cv                = archivo_pdf,
        cv_texto_extraido = texto,
        estado            = 'cv_analizando',
        registrado_por    = usuario_rrhh,
    )

    return {
        'exito': True,
        'candidato_id': candidato.id,
        'nombre': candidato.nombre_completo,
        'email': email,
        'archivo': archivo_pdf.name,
    }


def _extraer_datos_basicos(texto: str) -> dict:
    """Extrae email, nombre y teléfono del texto del CV con regex."""
    import re

    datos = {'email': None, 'nombre': None, 'apellidos': None, 'telefono': None}

    # Email
    email_match = re.search(
        r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b',
        texto
    )
    if email_match:
        datos['email'] = email_match.group(0)

    # Teléfono (formato peruano y general)
    tel_match = re.search(
        r'(\+51[\s\-]?)?(9\d{8}|\d{2}[\s\-]\d{3}[\s\-]\d{4})',
        texto
    )
    if tel_match:
        datos['telefono'] = tel_match.group(0).strip()

    return datos
