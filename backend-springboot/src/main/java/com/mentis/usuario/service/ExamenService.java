package com.mentis.usuario.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentis.usuario.dto.PreguntaDTO;
import com.mentis.usuario.entity.*;
import com.mentis.usuario.exception.ApiException;
import com.mentis.usuario.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ExamenService {

    private static final Logger log = LoggerFactory.getLogger(ExamenService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Severidad de cada tipo de evento de auditoría (para el semáforo de RRHH). */
    private static final Map<String, String> SEVERIDAD_EVENTO = Map.of(
            "perdida_foco",      "media",
            "cambio_ventana",    "alta",
            "copy_paste",        "alta",
            "click_derecho",     "baja",
            "devtools",          "alta",
            "inactividad",       "baja",
            "pantalla_dividida", "alta",
            "otro",              "baja"
    );

    private final ExamenRepository examenRepo;
    private final PreguntaExamenRepository preguntaRepo;
    private final CandidatoRepository candidatoRepo;
    private final TokenAccesoRepository tokenRepo;
    private final EventoAuditoriaRepository eventoRepo;
    private final GeminiService gemini;

    @Value("${mentis.examen.duracion-minutos:45}")
    private int duracionMinutos;

    public ExamenService(ExamenRepository examenRepo, PreguntaExamenRepository preguntaRepo,
                         CandidatoRepository candidatoRepo, TokenAccesoRepository tokenRepo,
                         EventoAuditoriaRepository eventoRepo, GeminiService gemini) {
        this.examenRepo = examenRepo;
        this.preguntaRepo = preguntaRepo;
        this.candidatoRepo = candidatoRepo;
        this.tokenRepo = tokenRepo;
        this.eventoRepo = eventoRepo;
        this.gemini = gemini;
    }

    // ==========================================
    // INICIAR (genera preguntas si es la primera vez)
    // ==========================================
    @Transactional
    public Map<String, Object> iniciar(Long candidatoId) {
        Candidato candidato = obtenerCandidato(candidatoId);
        validarPuedeRendir(candidato);

        Examen examen = examenRepo.findByCandidatoId(candidatoId).orElse(null);

        if (examen == null) {
            // Primera vez: crear examen y generar preguntas con Gemini
            examen = new Examen();
            examen.setCandidato(candidato);
            examen.setVacante(candidato.getVacante());
            examen.setDuracionMinutos(duracionMinutos);
            examen.setEstado("pendiente");
            examen = examenRepo.save(examen);

            List<GeminiService.PreguntaGenerada> generadas =
                    gemini.generarPreguntas(candidato, candidato.getVacante());

            for (GeminiService.PreguntaGenerada g : generadas) {
                PreguntaExamen p = new PreguntaExamen();
                p.setExamen(examen);
                p.setOrden(g.orden());
                p.setTipo(g.tipo());
                p.setCategoria(g.categoria());
                p.setEnunciado(g.enunciado());
                p.setOpciones(serializar(g.opciones()));
                p.setRespuestaCorrecta(g.respuestaCorrecta());
                p.setPuntos(2);
                preguntaRepo.save(p);
            }
            examen.setEstado("generado");
            examen.setFechaGeneracion(ahora());
            examenRepo.save(examen);
        }

        if ("finalizado".equals(examen.getEstado())) {
            throw ApiException.gone("Ya completaste este examen.");
        }

        // Marcar inicio (solo la primera vez que entra)
        if (examen.getFechaInicio() == null) {
            examen.setFechaInicio(ahora());
            examen.setEstado("en_curso");
            examenRepo.save(examen);
            candidato.setEstado("examen_en_curso");
            candidatoRepo.save(candidato);
        }

        verificarTiempo(examen); // si ya venció, lo autofinaliza y lanza excepción

        return estadoExamen(examen);
    }

    // ==========================================
    // ESTADO / RETOMAR
    // ==========================================
    @Transactional
    public Map<String, Object> estado(Long candidatoId) {
        Examen examen = examenRepo.findByCandidatoId(candidatoId)
                .orElseThrow(() -> ApiException.notFound("Aún no has iniciado el examen."));
        if (!"finalizado".equals(examen.getEstado())) {
            verificarTiempo(examen);
        }
        return estadoExamen(examen);
    }

    // ==========================================
    // RESPONDER UNA PREGUNTA (guardado incremental para poder retomar)
    // ==========================================
    @Transactional
    public Map<String, Object> responder(Long candidatoId, Long preguntaId, String respuesta) {
        Examen examen = examenActivo(candidatoId);
        verificarTiempo(examen);

        PreguntaExamen p = preguntaRepo.findByIdAndExamenId(preguntaId, examen.getId())
                .orElseThrow(() -> ApiException.notFound("Pregunta no encontrada en tu examen."));

        p.setRespuestaCandidato(respuesta != null ? respuesta.trim() : "");
        p.setRespondidaEn(ahora());

        // Las múltiple opción se califican al instante (el resultado NO se revela)
        if ("multiple".equals(p.getTipo())) {
            boolean correcta = p.getRespuestaCorrecta() != null &&
                    p.getRespuestaCorrecta().trim().equalsIgnoreCase(p.getRespuestaCandidato());
            p.setEsCorrecta(correcta);
            p.setPuntosObtenidos(correcta ? BigDecimal.valueOf(p.getPuntos()) : BigDecimal.ZERO);
        }
        preguntaRepo.save(p);

        long respondidas = examen.getPreguntas() == null ? 0 :
                preguntaRepo.findByExamenIdOrderByOrdenAsc(examen.getId()).stream()
                        .filter(q -> q.getRespondidaEn() != null).count();

        return Map.of(
                "mensaje", "Respuesta guardada.",
                "respondidas", respondidas,
                "total", 10
        );
    }

    // ==========================================
    // FINALIZAR Y CALIFICAR
    // ==========================================
    @Transactional
    public Map<String, Object> finalizar(Long candidatoId) {
        Examen examen = examenActivo(candidatoId);
        return calificarYCerrar(examen, false);
    }

    private Map<String, Object> calificarYCerrar(Examen examen, boolean porTiempo) {
        List<PreguntaExamen> preguntas = preguntaRepo.findByExamenIdOrderByOrdenAsc(examen.getId());

        // 1. Calificar abiertas con Gemini (las MC ya están calificadas al responder)
        List<PreguntaExamen> abiertas = preguntas.stream()
                .filter(p -> "abierta".equals(p.getTipo())).toList();

        Map<Integer, GeminiService.CalificacionAbierta> calificaciones =
                gemini.calificarAbiertas(abiertas, examen.getVacante());

        for (PreguntaExamen p : abiertas) {
            GeminiService.CalificacionAbierta cal = calificaciones.get(p.getOrden());
            int puntos = cal != null ? cal.puntos() : 0;
            p.setPuntosObtenidos(BigDecimal.valueOf(puntos));
            p.setEsCorrecta(puntos == 2);
            p.setFeedbackIa(cal != null ? cal.feedback() : "");
            preguntaRepo.save(p);
        }

        // 2. Nota final sobre 20
        BigDecimal nota = preguntas.stream()
                .map(p -> p.getPuntosObtenidos() != null ? p.getPuntosObtenidos() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal notaMinima = examen.getVacante().getNotaMinimaExamen() != null
                ? examen.getVacante().getNotaMinimaExamen() : new BigDecimal("13.00");
        boolean aprobado = nota.compareTo(notaMinima) >= 0;

        // 3. Cerrar examen
        examen.setNota(nota);
        examen.setAprobado(aprobado);
        examen.setEstado(porTiempo ? "expirado" : "finalizado");
        examen.setFechaFin(ahora());
        examenRepo.save(examen);

        // 4. Actualizar candidato
        Candidato c = examen.getCandidato();
        c.setScoreExamen(nota);
        c.setExamenAprobado(aprobado);
        c.setFechaExamen(ahora());
        c.setEstado(aprobado ? "examen_aprobado" : "examen_rechazado");
        recalcularScoreFinal(c);
        candidatoRepo.save(c);

        // 5. Invalidar el token de acceso (un examen, un uso)
        tokenRepo.findAll().stream()
                .filter(t -> t.getCandidato().getId().equals(c.getId()) && "examen".equals(t.getTipo()))
                .forEach(t -> { t.setUsado(true); tokenRepo.save(t); });

        // 6. Recalcular ranking de la vacante
        recalcularRanking(examen.getVacante().getId());

        // Política de silencio profesional: NO se revela la nota al candidato.
        return Map.of(
                "mensaje", "Tu examen fue enviado correctamente. Si avanzas en el proceso, te contactaremos por correo.",
                "estado", "finalizado"
        );
    }

    // ==========================================
    // AUDITORÍA
    // ==========================================
    @Transactional
    public Map<String, Object> registrarEvento(Long candidatoId, String tipo, String detalle) {
        Examen examen = examenRepo.findByCandidatoId(candidatoId)
                .orElseThrow(() -> ApiException.notFound("No tienes un examen activo."));

        String severidad = SEVERIDAD_EVENTO.getOrDefault(tipo, "baja");

        EventoAuditoria e = new EventoAuditoria();
        e.setExamen(examen);
        e.setTipo(tipo);
        e.setSeveridad(severidad);
        e.setDetalle(detalle != null ? detalle : "");
        e.setTimestamp(ahora());
        eventoRepo.save(e);

        return Map.of(
                "registrado", true,
                "severidad", severidad,
                "total_eventos", eventoRepo.countByExamenId(examen.getId())
        );
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private Map<String, Object> estadoExamen(Examen examen) {
        List<PreguntaExamen> preguntas = preguntaRepo.findByExamenIdOrderByOrdenAsc(examen.getId());

        List<PreguntaDTO> dtos = preguntas.stream().map(p -> new PreguntaDTO(
                p.getId(), p.getOrden(), p.getTipo(), p.getCategoria(), p.getEnunciado(),
                deserializar(p.getOpciones()), p.getPuntos(),
                p.getRespuestaCandidato(), p.getRespondidaEn() != null
        )).toList();

        Long segundosRestantes = null;
        if (examen.getFechaInicio() != null && !"finalizado".equals(examen.getEstado())) {
            LocalDateTime limite = examen.getFechaInicio().plusMinutes(examen.getDuracionMinutos());
            segundosRestantes = Math.max(0, ChronoUnit.SECONDS.between(ahora(), limite));
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("examen_id", examen.getId());
        resp.put("estado", examen.getEstado());
        resp.put("duracion_minutos", examen.getDuracionMinutos());
        resp.put("segundos_restantes", segundosRestantes);
        resp.put("vacante", examen.getVacante().getTitulo());
        resp.put("preguntas", dtos);
        return resp;
    }

    private void verificarTiempo(Examen examen) {
        if (examen.getFechaInicio() == null) return;
        LocalDateTime limite = examen.getFechaInicio().plusMinutes(examen.getDuracionMinutos());
        if (ahora().isAfter(limite) && !"finalizado".equals(examen.getEstado()) && !"expirado".equals(examen.getEstado())) {
            log.info("Examen {} excedió el tiempo. Autofinalizando.", examen.getId());
            calificarYCerrar(examen, true);
            throw ApiException.gone("El tiempo del examen terminó. Tus respuestas guardadas fueron enviadas automáticamente.");
        }
    }

    private Examen examenActivo(Long candidatoId) {
        Examen examen = examenRepo.findByCandidatoId(candidatoId)
                .orElseThrow(() -> ApiException.notFound("Aún no has iniciado el examen."));
        if ("finalizado".equals(examen.getEstado()) || "expirado".equals(examen.getEstado())) {
            throw ApiException.gone("Este examen ya fue finalizado.");
        }
        return examen;
    }

    private Candidato obtenerCandidato(Long id) {
        return candidatoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Candidato no encontrado."));
    }

    private void validarPuedeRendir(Candidato c) {
        Set<String> estadosValidos = Set.of("cv_aprobado", "examen_pendiente", "examen_en_curso");
        if (!estadosValidos.contains(c.getEstado())) {
            if ("examen_aprobado".equals(c.getEstado()) || "examen_rechazado".equals(c.getEstado())) {
                throw ApiException.gone("Ya rendiste este examen.");
            }
            throw ApiException.forbidden("Tu proceso no está en etapa de examen.");
        }
    }

    /** Misma fórmula que Django: pesos renormalizados según fases completadas. */
    private void recalcularScoreFinal(Candidato c) {
        double suma = 0, pesos = 0;
        if (c.getScoreCv() != null) {
            suma += (c.getScoreCv() / 100.0 * 20) * 0.25;
            pesos += 0.25;
        }
        if (c.getScoreExamen() != null) {
            suma += c.getScoreExamen().doubleValue() * 0.40;
            pesos += 0.40;
        }
        if (c.getScoreEntrevista() != null) {
            suma += c.getScoreEntrevista().doubleValue() * 0.35;
            pesos += 0.35;
        }
        if (pesos > 0) {
            c.setScoreFinal(BigDecimal.valueOf(suma / pesos).setScale(2, RoundingMode.HALF_UP));
        }
    }

    private void recalcularRanking(Long vacanteId) {
        List<Candidato> ranking = candidatoRepo.rankingDeVacante(vacanteId);
        int pos = 1;
        for (Candidato c : ranking) {
            c.setPosicionRanking(pos++);
            candidatoRepo.save(c);
        }
    }

    /** Django guarda fechas en UTC (USE_TZ=True). Operamos siempre en UTC. */
    private LocalDateTime ahora() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    private String serializar(List<String> lista) {
        try { return MAPPER.writeValueAsString(lista != null ? lista : List.of()); }
        catch (Exception e) { return "[]"; }
    }

    private List<String> deserializar(String json) {
        try {
            if (json == null || json.isBlank()) return List.of();
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) { return List.of(); }
    }
}
