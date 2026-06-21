package com.mentis.usuario.service;

import com.mentis.usuario.entity.Candidato;
import com.mentis.usuario.entity.Examen;
import com.mentis.usuario.exception.ApiException;
import com.mentis.usuario.repository.CandidatoRepository;
import com.mentis.usuario.repository.ExamenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Devuelve el progreso del candidato en el proceso de selección.
 * Pensado para que la app móvil muestre una línea de tiempo:
 * Postulación → CV → Examen → Entrevista → Resultado.
 *
 * Respeta la política de silencio: NUNCA revela notas ni si aprobó/desaprobó.
 * Solo informa en qué fase va y qué sigue.
 */
@Service
public class ProgresoService {

    private final CandidatoRepository candidatoRepo;
    private final ExamenRepository examenRepo;

    public ProgresoService(CandidatoRepository candidatoRepo, ExamenRepository examenRepo) {
        this.candidatoRepo = candidatoRepo;
        this.examenRepo = examenRepo;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> consultar(Long candidatoId) {
        Candidato c = candidatoRepo.findById(candidatoId)
                .orElseThrow(() -> ApiException.notFound("Candidato no encontrado."));

        String estado = c.getEstado() != null ? c.getEstado() : "postulado";

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("candidato", c.getNombreCompleto());
        resp.put("vacante", c.getVacante() != null ? c.getVacante().getTitulo() : null);
        resp.put("estado_actual", estado);
        resp.put("etiqueta_estado", etiquetaAmigable(estado));
        resp.put("mensaje", mensajePara(estado));
        resp.put("fases", construirFases(c, estado));
        resp.put("accion_disponible", accionDisponible(estado));
        return resp;
    }

    /**
     * Construye la línea de tiempo de 5 fases con su estado:
     * completada | actual | pendiente | bloqueada
     */
    private List<Map<String, Object>> construirFases(Candidato c, String estado) {
        List<Map<String, Object>> fases = new ArrayList<>();

        int fase = ordenDeFase(estado);
        boolean descartado = "descartado".equals(estado)
                || "cv_rechazado".equals(estado)
                || "examen_rechazado".equals(estado);

        fases.add(fase("Postulación", "Tu CV fue recibido", estadoFase(1, fase, descartado)));
        fases.add(fase("Análisis de CV", "Revisión con IA de tu perfil", estadoFase(2, fase, descartado)));
        fases.add(fase("Examen técnico", "Evaluación de conocimientos", estadoFase(3, fase, descartado)));
        fases.add(fase("Entrevista", "Conversación con IA", estadoFase(4, fase, descartado)));
        fases.add(fase("Resultado", "Decisión final del proceso", estadoFase(5, fase, descartado)));

        return fases;
    }

    /** Mapea cada estado del candidato a un número de fase (1-5). */
    private int ordenDeFase(String estado) {
        return switch (estado) {
            case "postulado" -> 1;
            case "cv_analizando" -> 2;
            case "cv_aprobado", "cv_rechazado" -> 2;
            case "examen_pendiente", "examen_en_curso",
                 "examen_aprobado", "examen_rechazado" -> 3;
            case "entrevista_pendiente", "entrevista_en_curso",
                 "entrevista_completada" -> 4;
            case "finalista", "entrevista_presencial",
                 "contratado", "descartado" -> 5;
            default -> 1;
        };
    }

    private String estadoFase(int numeroFase, int faseActual, boolean descartado) {
        if (descartado && numeroFase > faseActual) return "bloqueada";
        if (numeroFase < faseActual) return "completada";
        if (numeroFase == faseActual) return descartado ? "bloqueada" : "actual";
        return "pendiente";
    }

    private Map<String, Object> fase(String titulo, String descripcion, String estado) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("titulo", titulo);
        f.put("descripcion", descripcion);
        f.put("estado", estado);
        return f;
    }

    /** Qué puede HACER el candidato ahora desde la app (sin revelar resultados). */
    private Map<String, Object> accionDisponible(String estado) {
        Map<String, Object> a = new LinkedHashMap<>();
        switch (estado) {
            case "examen_pendiente", "cv_aprobado" -> {
                a.put("tipo", "rendir_examen");
                a.put("titulo", "Rendir examen técnico");
                a.put("habilitada", true);
            }
            case "examen_en_curso" -> {
                a.put("tipo", "continuar_examen");
                a.put("titulo", "Continuar examen");
                a.put("habilitada", true);
            }
            case "entrevista_pendiente" -> {
                a.put("tipo", "rendir_entrevista");
                a.put("titulo", "Iniciar entrevista");
                a.put("habilitada", true);
            }
            default -> {
                a.put("tipo", "ninguna");
                a.put("titulo", null);
                a.put("habilitada", false);
            }
        }
        return a;
    }

    private String etiquetaAmigable(String estado) {
        return switch (estado) {
            case "postulado" -> "Postulación recibida";
            case "cv_analizando" -> "Analizando tu CV";
            case "cv_aprobado" -> "CV aprobado";
            case "cv_rechazado" -> "Proceso finalizado";
            case "examen_pendiente" -> "Examen disponible";
            case "examen_en_curso" -> "Examen en curso";
            case "examen_aprobado" -> "Examen completado";
            case "examen_rechazado" -> "Proceso finalizado";
            case "entrevista_pendiente" -> "Entrevista disponible";
            case "entrevista_en_curso" -> "Entrevista en curso";
            case "entrevista_completada" -> "Entrevista completada";
            case "finalista" -> "Eres finalista";
            case "entrevista_presencial" -> "Entrevista presencial agendada";
            case "contratado" -> "¡Felicidades!";
            case "descartado" -> "Proceso finalizado";
            default -> "En proceso";
        };
    }

    /**
     * Mensaje para el candidato. Política de silencio: no revela notas
     * ni aprobado/desaprobado en las fases de evaluación.
     */
    private String mensajePara(String estado) {
        return switch (estado) {
            case "postulado" ->
                "Recibimos tu postulación. Estamos revisando tu perfil.";
            case "cv_analizando" ->
                "Nuestro sistema está analizando tu CV. Te avisaremos por correo.";
            case "cv_aprobado", "examen_pendiente" ->
                "¡Avanzaste! Ya puedes rendir tu examen técnico.";
            case "examen_en_curso" ->
                "Tienes un examen en curso. Puedes continuarlo.";
            case "examen_aprobado" ->
                "Completaste tu examen. Si avanzas, te contactaremos por correo.";
            case "entrevista_pendiente" ->
                "¡Avanzaste a la entrevista! Ya puedes iniciarla cuando estés listo.";
            case "entrevista_en_curso" ->
                "Tienes una entrevista en curso.";
            case "entrevista_completada" ->
                "Completaste tu entrevista. El equipo evaluará tu proceso.";
            case "finalista" ->
                "¡Eres uno de los finalistas! El equipo se pondrá en contacto contigo.";
            case "entrevista_presencial" ->
                "Tienes una entrevista presencial agendada. Revisa tu correo.";
            case "contratado" ->
                "¡Felicidades! Has sido seleccionado. Bienvenido al equipo.";
            case "cv_rechazado", "examen_rechazado", "descartado" ->
                "Gracias por participar en este proceso. En esta ocasión no continuarás, "
                + "pero te invitamos a postular a futuras oportunidades.";
            default ->
                "Tu proceso está en evaluación.";
        };
    }
}
