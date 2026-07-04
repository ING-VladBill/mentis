# ==========================================
# candidatos/servicios/analisis_cv.py
# ==========================================

import io
import json
import logging
from typing import Optional

import PyPDF2
from pdfminer.high_level import extract_text as pdfminer_extract
import google.generativeai as genai
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# Configurar Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


# ------------------------------------------
# EXTRACCIÓN DE TEXTO DEL PDF
# ------------------------------------------

def extraer_texto_pdf(archivo) -> str:
    """
    Extrae el texto de un PDF.
    Intenta primero con pdfminer (reconstruye mejor el espaciado real del texto;
    PyPDF2 suele insertar espacios falsos entre letras en PDFs generados desde
    Canva/Word/plantillas de diseño, por ejemplo "JULON" -> "JUL ON"). Si pdfminer
    falla o no extrae suficiente texto (ej: PDF escaneado como imagen), usa PyPDF2
    como respaldo.
    """
    texto = ''

    # Intento 1: pdfminer (más preciso con el espaciado real del texto)
    try:
        archivo.seek(0)
        contenido = archivo.read()
        texto = pdfminer_extract(io.BytesIO(contenido))
        if len(texto.strip()) > 100:
            return _limpiar_texto(texto)
    except Exception as e:
        logger.warning(f'pdfminer falló: {e}. Intentando con PyPDF2...')

    # Intento 2: PyPDF2 (respaldo, útil con algunos PDFs que pdfminer no soporta)
    try:
        archivo.seek(0)
        reader = PyPDF2.PdfReader(archivo)
        texto_pypdf2 = ''
        for page in reader.pages:
            texto_pypdf2 += page.extract_text() or ''
        if len(texto_pypdf2.strip()) > 100:
            return _limpiar_texto(texto_pypdf2)
    except Exception as e:
        logger.error(f'PyPDF2 también falló: {e}')

    return texto


def _limpiar_texto(texto: str) -> str:
    """Limpia el texto extraído del PDF."""
    import re
    texto = re.sub(r'\n{3,}', '\n\n', texto)
    texto = re.sub(r' {2,}', ' ', texto)
    return texto.strip()


# ------------------------------------------
# ANÁLISIS DE CV CON IA (GEMINI)
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
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={
                'temperature': 0.3,              # Más determinístico para análisis
                'response_mime_type': 'application/json',  # Fuerza JSON limpio, sin markdown
            },
            system_instruction=(
                'Eres un experto reclutador con 15 años de experiencia evaluando candidatos. '
                'Analizas CVs de manera objetiva y siempre respondes ÚNICAMENTE con JSON válido, '
                'sin texto adicional antes ni después del JSON.'
            )
        )

        respuesta = model.generate_content(prompt)
        contenido = respuesta.text.strip()

        # Limpiar posibles marcadores markdown por si acaso
        if contenido.startswith('```'):
            contenido = contenido.split('```')[1]
            if contenido.startswith('json'):
                contenido = contenido[4:]
        contenido = contenido.strip().rstrip('`')

        resultado = json.loads(contenido)
        return _procesar_resultado_analisis(resultado, candidato, vacante)

    except json.JSONDecodeError as e:
        logger.error(f'Error parseando JSON de Gemini: {e}')
        raise ValueError('La IA devolvió un formato inválido. Intenta nuevamente.')
    except Exception as e:
        logger.error(f'Error llamando a Gemini: {e}')
        raise


def _construir_prompt_analisis(candidato, vacante) -> str:
    """
    Construye el prompt adaptado al área de la vacante.
    Usa la instrucción del modelo Area (configurable por el admin).
    """

    # Tomar la instrucción del Area (configurable desde el admin)
    instruccion_area = vacante.area.get_instruccion_ia()

    return f"""
Analiza este CV para la siguiente vacante. RESPONDE SOLO CON JSON.

=== VACANTE ===
Título: {vacante.titulo}
Área: {vacante.area.nombre}
Código de área: {vacante.area.codigo_corto}
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
  "github_detectado": <url o null>,
  "portfolio_detectado": <url o null>,
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
    candidato.cv_analizado           = True
    candidato.fecha_analisis_cv      = timezone.now()
    candidato.score_cv               = score
    candidato.clasificacion_ia       = clasificacion
    candidato.resumen_cv             = resultado.get('resumen', '')
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
    if resultado.get('github_detectado') and not candidato.github:
        candidato.github = resultado['github_detectado']
    if resultado.get('portfolio_detectado') and not candidato.portfolio:
        candidato.portfolio = resultado['portfolio_detectado']
    if resultado.get('anios_experiencia_detectados') and not candidato.anios_experiencia:
        candidato.anios_experiencia = resultado['anios_experiencia_detectados']
    if resultado.get('carrera_detectada') and not candidato.carrera:
        candidato.carrera = resultado['carrera_detectada']

    # Corregir nombre/apellidos si la IA detectó el nombre real y el candidato
    # quedó con el placeholder de carga masiva ("Nombre"/"Apellido") o vacío.
    # NO se sobreescribe si el candidato ya tiene un nombre real (ej: lo escribió
    # la propia persona en el formulario público) — mismo criterio que los demás
    # campos de esta función.
    PLACEHOLDER_NOMBRE   = {'nombre', ''}
    PLACEHOLDER_APELLIDO = {'apellido', ''}
    nombre_detectado = resultado.get('nombre_detectado')
    necesita_nombre  = (candidato.nombre or '').strip().lower() in PLACEHOLDER_NOMBRE
    necesita_apellido = (candidato.apellido_paterno or '').strip().lower() in PLACEHOLDER_APELLIDO
    if nombre_detectado and (necesita_nombre or necesita_apellido):
        partes = nombre_detectado.strip().split()
        if len(partes) == 1:
            candidato.nombre = partes[0]
        elif len(partes) == 2:
            candidato.nombre, candidato.apellido_paterno = partes[0], partes[1]
        elif len(partes) == 3:
            candidato.nombre, candidato.apellido_paterno, candidato.apellido_materno = partes
        elif len(partes) >= 4:
            # Convención peruana: los últimos 2 tokens son los apellidos (paterno, materno)
            candidato.apellido_materno = partes[-1]
            candidato.apellido_paterno = partes[-2]
            candidato.nombre           = ' '.join(partes[:-2])

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
    Procesa un único PDF: extrae texto, extrae datos básicos con regex, crea candidato.
    Usado en la carga masiva.
    Blindado: cualquier excepción inesperada en ESTE archivo se captura y se
    reporta como fallo de ESTE archivo, sin tumbar el resto de la carga masiva.
    """
    from candidatos.models import Candidato
    from vacantes.models import Vacante

    try:
        vacante = Vacante.objects.get(id=vacante_id)
    except Vacante.DoesNotExist:
        return {
            'exito': False,
            'error': 'La vacante indicada no existe.',
            'archivo': archivo_pdf.name,
        }

    try:
        texto = extraer_texto_pdf(archivo_pdf)
    except Exception as e:
        logger.error(f'Error extrayendo texto de {archivo_pdf.name}: {e}')
        return {
            'exito': False,
            'error': 'No se pudo leer el PDF (archivo dañado o formato no soportado).',
            'archivo': archivo_pdf.name,
        }

    if not texto or len(texto.strip()) < 50:
        return {
            'exito': False,
            'error': 'No se pudo extraer texto del PDF. Verifica que no esté escaneado.',
            'archivo': archivo_pdf.name,
        }

    # Extracción rápida de datos básicos antes del análisis completo.
    # Si el email no se detecta aquí (regex superficial), NO bloqueamos la
    # creación: el candidato se crea igual con el email en blanco, y el
    # análisis con IA (más profundo) lo completará después, igual que hace
    # con teléfono, LinkedIn, GitHub, etc.
    datos_basicos = _extraer_datos_basicos(texto)
    email = datos_basicos.get('email') or ''

    # Evitar duplicados solo si SÍ se detectó un email real (si está vacío,
    # no tiene sentido comparar contra otros candidatos sin email).
    if email and Candidato.objects.filter(email=email, vacante=vacante).exists():
        return {
            'exito': False,
            'error': f'Ya existe un candidato con email {email} para esta vacante.',
            'archivo': archivo_pdf.name,
        }

    # Crear candidato
    try:
        candidato = Candidato.objects.create(
            vacante           = vacante,
            nombre            = datos_basicos.get('nombre', 'Nombre') or 'Nombre',
            apellido_paterno  = datos_basicos.get('apellidos', 'Apellido') or 'Apellido',
            email             = email,
            telefono          = datos_basicos.get('telefono') or '',
            cv                = archivo_pdf,
            cv_texto_extraido = texto,
            estado            = 'cv_analizando',
            registrado_por    = usuario_rrhh,
        )
    except Exception as e:
        logger.error(f'Error creando candidato desde {archivo_pdf.name}: {e}')
        return {
            'exito': False,
            'error': 'No se pudo crear el candidato (dato inválido en el CV).',
            'archivo': archivo_pdf.name,
        }

    # Lanzar análisis con IA en segundo plano (no bloquea la carga masiva).
    # Igual que el formulario público y el buzón IMAP.
    import threading

    def _analizar(candidato_id=candidato.id, vacante_id=vacante.id):
        try:
            from candidatos.models import Candidato as _C
            from vacantes.models import Vacante as _V
            from candidatos.servicios.correos import enviar_correo_avance_cv
            c = _C.objects.get(id=candidato_id)
            v = _V.objects.get(id=vacante_id)
            resultado = analizar_cv(c, v)
            if resultado.get('pasa_filtro'):
                enviar_correo_avance_cv(c)
        except Exception as e:
            logger.error(f'Error analizando CV (carga masiva) candidato {candidato_id}: {e}')

    threading.Thread(target=_analizar, daemon=True).start()

    return {
        'exito': True,
        'candidato_id': candidato.id,
        'nombre': candidato.nombre_completo,
        'email': email,
        'archivo': archivo_pdf.name,
        'analizando': True,
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

    # Teléfono (formato peruano y general). Reconoce el número sin importar si
    # viene con espacios, guiones o todo junto (ej: "942 110 767", "942-110-767",
    # "942110767", con o sin +51). Se normaliza quitando espacios/guiones antes
    # de guardarlo.
    tel_match = re.search(
        r'(\+?51[\s\-]?)?(9(?:[\s\-]*\d){8}|\d{2}[\s\-]?\d{3}[\s\-]?\d{4})',
        texto
    )
    if tel_match:
        datos['telefono'] = re.sub(r'[\s\-]', '', tel_match.group(0))

    return datos