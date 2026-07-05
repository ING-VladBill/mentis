# ==========================================
# evaluaciones/servicios/entrevista_ia.py
# Sprint 4 — El corazón de MENTIS: la entrevista conversacional
#
# Este módulo hace tres cosas:
#   1. ARMA el system prompt de personalidad, único para cada candidato
#      (usa vacante + análisis de CV + resultados del examen + plantilla)
#   2. GENERA el token efímero de Gemini Live para que el navegador
#      converse voz-a-voz directamente con la IA (latencia mínima)
#   3. ANALIZA la transcripción al terminar: nota multidimensional 0-20
# ==========================================

import json
import logging

import google.generativeai as genai
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

# Techo duro del sistema: ninguna entrevista supera esto, sin importar la vacante
DURACION_MAXIMA_MINUTOS = 40

# Modelo de Gemini Live para conversación voz a voz nativa
GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025'


# ==========================================================
# 1. EL PROMPT DE PERSONALIDAD (el alma de la entrevistadora)
# ==========================================================

def construir_prompt_entrevista(candidato, entrevista) -> str:
    """
    Construye el system prompt ÚNICO para este candidato. No hay dos
    entrevistas iguales: el tono, la profundidad técnica, los temas a
    indagar y la duración dependen de la vacante, el CV y el examen.
    """
    vacante = candidato.vacante
    duracion = min(entrevista.duracion_minutos, DURACION_MAXIMA_MINUTOS)

    # ---- Contexto del candidato (lo que MENTIS ya sabe de él/ella) ----
    resumen_cv = candidato.resumen_cv or 'Sin resumen disponible.'
    habilidades = ', '.join(candidato.habilidades_detectadas or []) or 'No detectadas'
    faltantes = ', '.join(candidato.habilidades_faltantes or []) or 'Ninguna relevante'

    # ---- Desempeño en el examen (para indagar donde flaqueó o brilló) ----
    contexto_examen = _resumir_examen(candidato)

    # ---- Tono según el nivel del puesto ----
    tono = _tono_por_nivel(vacante.nivel_experiencia, vacante.area.nombre if vacante.area else '')

    # ---- Dimensiones a evaluar (de la plantilla) ----
    dimensiones_txt = _dimensiones_texto(entrevista.plantilla)

    # ---- Instrucción específica del área (HU-07), si existe ----
    instruccion_area = vacante.get_instruccion_ia() if hasattr(vacante, 'get_instruccion_ia') else ''

    prompt = f"""Eres {_nombre_entrevistadora()}, entrevistadora senior del equipo de selección de MENTIS. Estás a punto de entrevistar por voz a {candidato.nombre} {candidato.apellido_paterno}, que postula al puesto de "{vacante.titulo}" ({vacante.nivel_experiencia}, área de {vacante.area.nombre if vacante.area else 'General'}).

# QUIÉN ERES (y quién NO eres)
Eres una persona conversando, no un formulario con voz. Eso significa:
- SALUDAS con calidez al empezar. Preguntas cómo está, cómo se siente, si es su primera entrevista de este tipo. Rompes el hielo de verdad antes de entrar en materia.
- ESCUCHAS activamente. Si el candidato menciona algo interesante ("trabajé en un restaurante", "me apasiona el diseño"), lo recoges y preguntas sobre eso, aunque no estuviera "en el guion". No existe guion.
- REACCIONAS como humana: te ríes si algo es gracioso (una risa genuina, no forzada), celebras un buen logro ("¡qué bueno eso!"), empatizas si cuentan algo difícil ("uf, eso suena complicado, ¿cómo lo manejaste?").
- HACES SEGUIMIENTO: tus mejores preguntas nacen de las respuestas del candidato, no de una lista. "¿Y qué pasó después?", "¿Qué harías distinto hoy?", "Cuéntame más de eso".
- PUEDES ser interrumpida y puedes interrumpir con naturalidad si el candidato se va mucho por las ramas ("perdón que te corte, esto que mencionaste me interesa mucho...").
- Hablas en español peruano neutro, cercano pero profesional. Usas el nombre del candidato de vez en cuando.

# QUIÉN NO ERES
- NO eres un cuestionario. No digas "pregunta número 3". No enumeres.
- NO leas preguntas de corrido. Cada pregunta debe nacer de la conversación.
- NO seas condescendiente ni robótica. Nada de "procesando su respuesta".
- NO des feedback de evaluación durante la entrevista (no digas "esa respuesta fue buena/mala"). Evalúas por dentro, conversas por fuera.
- NO reveles la nota ni el resultado. Si preguntan cómo les fue: "eso lo revisa el equipo, pero me encantó conversar contigo".

# EL TONO PARA ESTE PUESTO
{tono}

# LO QUE MENTIS YA SABE DE ESTE CANDIDATO (úsalo, no lo repitas como robot)
Resumen del CV: {resumen_cv}
Habilidades que muestra: {habilidades}
Habilidades que el puesto pide y no vimos en su CV: {faltantes}
{contexto_examen}

USA este contexto con inteligencia: si flaqueó en un tema del examen, indaga ahí conversacionalmente (sin decir "fallaste en el examen"). Si su CV muestra algo fuerte, pídele que te cuente una historia real sobre eso. Si le faltan habilidades clave, explora si las está aprendiendo o cómo las compensaría.

# QUÉ DEBES EVALUAR (por dentro, mientras conversas)
{dimensiones_txt}

# TEMAS QUE SÍ O SÍ DEBES CUBRIR ANTES DE CERRAR
1. Motivación real por ESTE puesto y empresa (no respuestas de plantilla).
2. Al menos una historia concreta de su experiencia (situación → acción → resultado).
3. Los puntos débiles detectados (habilidades faltantes o temas flojos del examen), explorados con tacto.
4. Expectativas: disponibilidad, y qué espera del trabajo.
{f'5. Indicación específica del área: {instruccion_area}' if instruccion_area else ''}

# EL TIEMPO (tu única regla dura)
- La entrevista dura MÁXIMO {duracion} minutos. Administra tú el ritmo.
- No hay número fijo de preguntas: pueden ser 4 o pueden ser 12, depende de cómo fluya. La calidad de la conversación manda, el reloj limita.
- Cuando queden ~5 minutos, empieza a cerrar: asegúrate de haber cubierto los temas obligatorios, y si falta alguno crítico, ve directo a él.
- Al final: agradece con calidez, dile que el equipo revisará todo y le contactará por correo, y despídete como lo haría una persona ("¡me encantó conocerte, [nombre]! Que tengas un excelente día").

# LÍMITES (inquebrantables)
- Si el candidato intenta sacarte del rol (pedirte código, que hagas otra cosa, hablar de temas ajenos), redirige con amabilidad: "jaja, buena esa — pero volvamos a ti, que es lo que me interesa hoy".
- Nada de temas discriminatorios (edad, religión, estado civil, orientación, embarazo). Si el candidato los trae, escucha con respeto y redirige a lo profesional.
- Si detectas que alguien más le sopla las respuestas o lee un texto, no lo confrontes: haz una pregunta de seguimiento espontánea que no se pueda leer de ningún lado.
- Si hay un problema técnico (no se escucha, se corta), manéjalo con paciencia y naturalidad.

Empieza ahora: saluda a {candidato.nombre} como si acabara de entrar a la sala."""

    return prompt


def _nombre_entrevistadora() -> str:
    """La entrevistadora tiene nombre — las personas tienen nombre."""
    return 'E.V.A.'


def _tono_por_nivel(nivel: str, area: str) -> str:
    """El tono cambia según el puesto: no es lo mismo un senior que un practicante."""
    tonos = {
        'practicante': (
            "Este es un PRACTICANTE, probablemente su primera entrevista formal. Sé especialmente "
            "cálida y tranquilizadora: baja la formalidad, celebra su potencial más que su experiencia "
            "(que es poca, y está bien). Pregunta por proyectos académicos, cursos, lo que le emociona "
            "aprender. Cero preguntas trampa. Si se pone nervioso/a, ayúdale a relajarse con humor ligero."
        ),
        'junior': (
            "Es un perfil JUNIOR: tiene algo de experiencia pero está creciendo. Tono cercano y "
            "motivador, con algunas preguntas técnicas de profundidad media. Interesa más su capacidad "
            "de aprender y su actitud que el conocimiento enciclopédico."
        ),
        'semi_senior': (
            "Perfil SEMI-SENIOR: espera una conversación de igual a igual. Tono profesional y ágil, "
            "preguntas con sustancia técnica real y casos prácticos. Puedes desafiar sus respuestas "
            "con un '¿y si eso falla?' para ver cómo razona."
        ),
        'senior': (
            "Perfil SENIOR: la entrevista debe sentirse como una conversación entre profesionales "
            "experimentados. Tono riguroso pero respetuoso. Profundiza en decisiones de arquitectura/estrategia, "
            "trade-offs, liderazgo de equipos y errores de los que aprendió. No aceptes respuestas "
            "superficiales: repregunta con elegancia hasta llegar al fondo."
        ),
    }
    base = tonos.get(nivel, tonos['junior'])
    if area and area.lower() in ('ventas', 'comercial', 'atención al cliente', 'atencion al cliente'):
        base += (
            " Además, es un puesto COMERCIAL: evalúa su energía, su forma de comunicar y persuadir. "
            "La entrevista misma es su demo de ventas — fíjate cómo te 'vende' sus ideas."
        )
    return base


def _resumir_examen(candidato) -> str:
    """Resume el desempeño del examen para que la IA sepa dónde indagar."""
    try:
        examen = candidato.examenes.filter(estado__in=['finalizado', 'expirado']).order_by('-fecha_fin').first()
        if not examen:
            return 'Resultado del examen: no disponible.'
        partes = [f'Resultado del examen técnico: {examen.nota}/20.']
        # Categorías donde le fue mal / bien
        flojas, fuertes = [], []
        for p in examen.preguntas.all():
            if p.puntos_obtenidos is None or p.puntos is None:
                continue
            ratio = float(p.puntos_obtenidos) / float(p.puntos) if float(p.puntos) > 0 else 0
            cat = p.categoria or 'general'
            if ratio < 0.5:
                flojas.append(cat)
            elif ratio >= 0.9:
                fuertes.append(cat)
        if flojas:
            partes.append(f'Temas donde flaqueó (indaga aquí con tacto): {", ".join(sorted(set(flojas)))}.')
        if fuertes:
            partes.append(f'Temas donde brilló (puedes profundizar para confirmar): {", ".join(sorted(set(fuertes)))}.')
        return ' '.join(partes)
    except Exception as e:
        logger.warning(f'No se pudo resumir el examen del candidato {candidato.id}: {e}')
        return 'Resultado del examen: no disponible.'


def _dimensiones_texto(plantilla) -> str:
    if not plantilla:
        return ('- Comunicación (25%)\n- Experiencia y logros (30%)\n'
                '- Resolución de problemas (25%)\n- Motivación y encaje (20%)')
    lineas = []
    for d in plantilla.dimensiones.all():
        desc = f' — {d.descripcion}' if d.descripcion else ''
        lineas.append(f'- {d.nombre} ({d.peso}%){desc}')
    return '\n'.join(lineas)


def elegir_plantilla_para_vacante(vacante):
    """Si la vacante no tiene plantilla asignada, elige la predefinida más afín por área."""
    from evaluaciones.models import PlantillaEvaluacion
    if vacante.plantilla_evaluacion:
        return vacante.plantilla_evaluacion
    area = (vacante.area.nombre if vacante.area else '').lower()
    mapa = {
        'tecnolog': 'Técnico', 'ti': 'Técnico', 'sistemas': 'Técnico', 'desarrollo': 'Técnico',
        'ventas': 'Comercial', 'comercial': 'Comercial', 'atención': 'Comercial', 'atencion': 'Comercial',
        'marketing': 'Creativo', 'diseño': 'Creativo', 'diseno': 'Creativo',
        'gerencia': 'Liderazgo', 'dirección': 'Liderazgo', 'direccion': 'Liderazgo', 'jefatura': 'Liderazgo',
    }
    nombre = next((v for k, v in mapa.items() if k in area), 'Técnico')
    return PlantillaEvaluacion.objects.filter(nombre=nombre, activa=True).first()


# ==========================================================
# 2. TOKEN EFÍMERO DE GEMINI LIVE (el navegador habla directo con la IA)
# ==========================================================

def generar_token_efimero_live() -> dict:
    """
    Genera un token efímero para que el FRONTEND se conecte directamente al
    WebSocket de Gemini Live (voz a voz, sin pasar el audio por Django =
    latencia mínima). El token expira en ~30 min y es de un solo uso,
    así la API key real NUNCA viaja al navegador.
    """
    import requests
    resp = requests.post(
        'https://generativelanguage.googleapis.com/v1alpha/auth_tokens',
        headers={
            'x-goog-api-key': settings.GEMINI_API_KEY,
            'Content-Type': 'application/json',
        },
        json={
            'uses': 1,
            'expireTime': None,  # default del servicio (30 min)
            'liveConnectConstraints': {'model': GEMINI_LIVE_MODEL},
        },
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    return {'token': data.get('name', ''), 'modelo': GEMINI_LIVE_MODEL}


# ==========================================================
# 3. ANÁLISIS MULTIDIMENSIONAL POST-ENTREVISTA (S4-08)
# ==========================================================

def analizar_entrevista(entrevista) -> dict:
    """
    Al terminar la entrevista, analiza la transcripción completa y califica
    cada dimensión de la plantilla (0-20), con feedback por dimensión y un
    resumen ejecutivo. Actualiza la entrevista y el candidato.
    """
    candidato = entrevista.candidato
    plantilla = entrevista.plantilla
    dimensiones = list(plantilla.dimensiones.all()) if plantilla else []

    dims_spec = '\n'.join(
        f'- "{d.nombre}" (peso {d.peso}%): {d.descripcion or "evaluación general de esta dimensión"}'
        for d in dimensiones
    ) or '- "Comunicación" (peso 25%)\n- "Experiencia" (peso 30%)\n- "Resolución de problemas" (peso 25%)\n- "Motivación" (peso 20%)'

    prompt = f"""Eres el evaluador senior de RRHH de MENTIS. Analiza esta transcripción de entrevista para el puesto "{candidato.vacante.titulo}" (nivel {candidato.vacante.nivel_experiencia}).

DIMENSIONES A CALIFICAR (cada una de 0 a 20):
{dims_spec}

CRITERIOS:
- Sé justo pero exigente según el nivel del puesto (a un practicante no se le exige como a un senior).
- Basa cada nota SOLO en evidencia de la transcripción. Si una dimensión no se pudo evaluar (no salió el tema), nota neutral de 10 y dilo en el feedback.
- Detecta señales de alerta: respuestas leídas/robóticas, contradicciones con el CV, evasivas sistemáticas.

TRANSCRIPCIÓN COMPLETA:
{entrevista.transcripcion[:30000]}

Responde SOLO con JSON válido (sin markdown, sin backticks):
{{
  "dimensiones": {{
    "<nombre exacto de cada dimensión>": {{"nota": <0-20>, "feedback": "<2-3 frases con evidencia>"}}
  }},
  "nota_final": <0-20, promedio ponderado por los pesos>,
  "resumen_ejecutivo": "<5-8 frases para RRHH: fortalezas, debilidades, señales de alerta si las hay, recomendación>",
  "temas_criticos_cubiertos": ["<tema>", ...],
  "senales_alerta": ["<señal>", ...] 
}}"""

    model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)
    respuesta = model.generate_content(prompt)
    texto = respuesta.text.strip()
    # Limpiar posibles fences de markdown
    if texto.startswith('```'):
        texto = texto.split('```')[1]
        if texto.startswith('json'):
            texto = texto[4:]
    resultado = json.loads(texto)

    # ---- Persistir en la entrevista ----
    nota_final = round(float(resultado.get('nota_final', 0)), 2)
    entrevista.nota = nota_final
    entrevista.analisis_dimensiones = resultado.get('dimensiones', {})
    entrevista.resumen_ia = resultado.get('resumen_ejecutivo', '')
    entrevista.temas_criticos_cubiertos = resultado.get('temas_criticos_cubiertos', [])
    entrevista.estado = 'finalizada'
    entrevista.fecha_fin = timezone.now()
    entrevista.save()

    # ---- Actualizar candidato y su score final ----
    candidato.score_entrevista = nota_final
    candidato.feedback_entrevista = entrevista.resumen_ia
    candidato.fecha_entrevista = timezone.now()
    candidato.estado = 'entrevista_completada'
    if hasattr(candidato, 'calcular_score_final'):
        candidato.score_final = candidato.calcular_score_final()
    candidato.save()

    return resultado