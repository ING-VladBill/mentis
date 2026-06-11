package com.mentis.usuario.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentis.usuario.entity.Candidato;
import com.mentis.usuario.entity.PreguntaExamen;
import com.mentis.usuario.entity.Vacante;
import com.mentis.usuario.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Cliente directo de la API de Gemini (REST).
 * El módulo usuario es autónomo: genera y califica exámenes sin pasar por Django.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiService(@Value("${gemini.api.key}") String apiKey,
                         @Value("${gemini.model}") String model) {
        this.apiKey = apiKey;
        this.model  = model;
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    // ==========================================
    // GENERACIÓN DEL EXAMEN
    // ==========================================

    /**
     * Genera 10 preguntas personalizadas (6 múltiple opción + 4 abiertas)
     * según el CV del candidato y los requisitos de la vacante.
     */
    public List<PreguntaGenerada> generarPreguntas(Candidato candidato, Vacante vacante) {
        String instruccionArea = vacante.getArea() != null && vacante.getArea().getInstruccionIa() != null
                ? vacante.getArea().getInstruccionIa() : "Evalúa los conocimientos específicos del puesto.";

        String cv = candidato.getCvTextoExtraido() != null ? candidato.getCvTextoExtraido() : "";
        if (cv.length() > 6000) cv = cv.substring(0, 6000);

        String prompt = """
            Eres un evaluador técnico experto de recursos humanos. Genera un examen de selección.

            VACANTE: %s
            ÁREA: %s
            INSTRUCCIÓN DEL ÁREA: %s
            REQUISITOS: %s
            HABILIDADES REQUERIDAS: %s
            TECNOLOGÍAS: %s
            CONOCIMIENTOS A EVALUAR: %s
            NIVEL: %s (%d años de experiencia requeridos)

            CV DEL CANDIDATO (para personalizar dificultad y enfoque):
            %s

            REGLAS ESTRICTAS:
            1. Genera EXACTAMENTE 10 preguntas: las primeras 6 de tipo "multiple" y las últimas 4 de tipo "abierta".
            2. Distribuye las preguntas según el peso de las habilidades requeridas por la vacante.
            3. NUNCA preguntes sobre habilidades que la vacante NO requiere, aunque el candidato las tenga.
            4. La dificultad debe ser acorde al nivel del puesto.
            5. Las preguntas "multiple" llevan exactamente 4 opciones y UNA correcta.
            6. En "respuesta_correcta" de las multiple: el texto EXACTO de la opción correcta.
            7. En "respuesta_correcta" de las abiertas: los criterios que debe cumplir una respuesta ideal (esto se usará para calificar).
            8. Todo en español. Preguntas claras y profesionales.

            Responde ÚNICAMENTE con un array JSON válido, sin texto adicional ni markdown:
            [
              {"orden":1,"tipo":"multiple","categoria":"...","enunciado":"...","opciones":["...","...","...","..."],"respuesta_correcta":"..."},
              ...
              {"orden":7,"tipo":"abierta","categoria":"...","enunciado":"...","opciones":[],"respuesta_correcta":"criterios de respuesta ideal"}
            ]
            """.formatted(
                vacante.getTitulo(),
                vacante.getArea() != null ? vacante.getArea().getNombre() : "General",
                instruccionArea,
                nvl(vacante.getRequisitos()),
                nvl(vacante.getHabilidades()),
                nvl(vacante.getTecnologias()),
                nvl(vacante.getConocimientosEspecificos()),
                nvl(vacante.getNivelExperiencia()),
                vacante.getAniosExperiencia() != null ? vacante.getAniosExperiencia() : 0,
                cv
        );

        String jsonRespuesta = llamarGemini(prompt, 0.7);

        try {
            JsonNode arr = MAPPER.readTree(limpiarJson(jsonRespuesta));
            List<PreguntaGenerada> preguntas = new ArrayList<>();
            for (JsonNode n : arr) {
                List<String> opciones = new ArrayList<>();
                if (n.has("opciones") && n.get("opciones").isArray()) {
                    n.get("opciones").forEach(o -> opciones.add(o.asText()));
                }
                preguntas.add(new PreguntaGenerada(
                        n.path("orden").asInt(),
                        n.path("tipo").asText("multiple"),
                        n.path("categoria").asText(""),
                        n.path("enunciado").asText(),
                        opciones,
                        n.path("respuesta_correcta").asText()
                ));
            }
            if (preguntas.size() != 10) {
                log.warn("Gemini generó {} preguntas en vez de 10", preguntas.size());
            }
            if (preguntas.isEmpty()) {
                throw ApiException.badRequest("La IA no pudo generar el examen. Intenta nuevamente.");
            }
            return preguntas;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error parseando preguntas de Gemini: {}", jsonRespuesta, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Error generando el examen con IA. Intenta nuevamente.");
        }
    }

    // ==========================================
    // CALIFICACIÓN DE PREGUNTAS ABIERTAS (batch)
    // ==========================================

    /**
     * Califica todas las preguntas abiertas en UNA sola llamada (menos latencia).
     * Devuelve mapa orden -> resultado {puntos 0|1|2, feedback}.
     */
    public Map<Integer, CalificacionAbierta> calificarAbiertas(List<PreguntaExamen> abiertas, Vacante vacante) {
        if (abiertas.isEmpty()) return Map.of();

        StringBuilder bloque = new StringBuilder();
        for (PreguntaExamen p : abiertas) {
            bloque.append("""
                ---
                ORDEN: %d
                PREGUNTA: %s
                CRITERIOS DE RESPUESTA IDEAL: %s
                RESPUESTA DEL CANDIDATO: %s
                """.formatted(p.getOrden(), p.getEnunciado(), nvl(p.getRespuestaCorrecta()),
                              p.getRespuestaCandidato() == null || p.getRespuestaCandidato().isBlank()
                                  ? "(no respondió)" : p.getRespuestaCandidato()));
        }

        String prompt = """
            Eres un evaluador justo y riguroso. Califica las siguientes respuestas abiertas
            de un examen para la vacante "%s".

            Escala por pregunta:
            - 2 puntos: respuesta correcta y completa según los criterios
            - 1 punto: respuesta parcialmente correcta
            - 0 puntos: incorrecta, vacía o sin relación

            %s

            Responde ÚNICAMENTE con un array JSON válido, sin texto adicional:
            [{"orden":7,"puntos":2,"feedback":"breve justificación en español"}, ...]
            """.formatted(vacante.getTitulo(), bloque);

        String jsonRespuesta = llamarGemini(prompt, 0.2);

        try {
            JsonNode arr = MAPPER.readTree(limpiarJson(jsonRespuesta));
            Map<Integer, CalificacionAbierta> resultado = new java.util.HashMap<>();
            for (JsonNode n : arr) {
                int puntos = Math.max(0, Math.min(2, n.path("puntos").asInt(0)));
                resultado.put(n.path("orden").asInt(),
                        new CalificacionAbierta(puntos, n.path("feedback").asText("")));
            }
            return resultado;
        } catch (Exception e) {
            log.error("Error parseando calificación de Gemini: {}", jsonRespuesta, e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Error calificando el examen con IA.");
        }
    }

    // ==========================================
    // LLAMADA HTTP A GEMINI
    // ==========================================

    private String llamarGemini(String prompt, double temperature) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "GEMINI_API_KEY no configurada en el módulo usuario (.env).");
        }
        try {
            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                    "responseMimeType", "application/json",
                    "temperature", temperature
                )
            );

            JsonNode resp = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return resp.path("candidates").get(0)
                       .path("content").path("parts").get(0)
                       .path("text").asText();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error llamando a Gemini", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "No se pudo contactar a la IA. Verifica la API key y la conexión.");
        }
    }

    private String limpiarJson(String s) {
        return s.replace("```json", "").replace("```", "").trim();
    }

    private String nvl(String s) { return s == null || s.isBlank() ? "(no especificado)" : s; }

    // ==========================================
    // RECORDS DE APOYO
    // ==========================================
    public record PreguntaGenerada(int orden, String tipo, String categoria,
                                   String enunciado, List<String> opciones, String respuestaCorrecta) {}

    public record CalificacionAbierta(int puntos, String feedback) {}
}
