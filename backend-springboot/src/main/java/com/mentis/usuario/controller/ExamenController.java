package com.mentis.usuario.controller;

import com.mentis.usuario.dto.EventoRequest;
import com.mentis.usuario.dto.RespuestaRequest;
import com.mentis.usuario.service.ExamenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuario/examen")
public class ExamenController {

    private final ExamenService examenService;

    public ExamenController(ExamenService examenService) {
        this.examenService = examenService;
    }

    private Long candidatoId(HttpServletRequest req) {
        return (Long) req.getAttribute("candidatoId");
    }

    /** POST /api/usuario/examen/iniciar — genera el examen (1ra vez) y lo inicia. */
    @PostMapping("/iniciar")
    public Map<String, Object> iniciar(HttpServletRequest req) {
        return examenService.iniciar(candidatoId(req));
    }

    /** GET /api/usuario/examen — estado actual (para retomar). */
    @GetMapping
    public Map<String, Object> estado(HttpServletRequest req) {
        return examenService.estado(candidatoId(req));
    }

    /** POST /api/usuario/examen/respuesta — guarda una respuesta individual. */
    @PostMapping("/respuesta")
    public Map<String, Object> responder(@Valid @RequestBody RespuestaRequest body, HttpServletRequest req) {
        return examenService.responder(candidatoId(req), body.preguntaId(), body.respuesta());
    }

    /** POST /api/usuario/examen/finalizar — califica todo y cierra. */
    @PostMapping("/finalizar")
    public Map<String, Object> finalizar(HttpServletRequest req) {
        return examenService.finalizar(candidatoId(req));
    }

    /** POST /api/usuario/examen/evento — registra evento de auditoría. */
    @PostMapping("/evento")
    public Map<String, Object> evento(@Valid @RequestBody EventoRequest body, HttpServletRequest req) {
        return examenService.registrarEvento(candidatoId(req), body.tipo(), body.detalle());
    }
}
