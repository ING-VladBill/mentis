package com.mentis.usuario.controller;

import com.mentis.usuario.service.ProgresoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Progreso del candidato en su proceso de selección.
 * Usado por la app móvil para mostrar la línea de tiempo.
 * Requiere el JWT del candidato (lo valida el AuthInterceptor).
 */
@RestController
@RequestMapping("/api/usuario/progreso")
public class ProgresoController {

    private final ProgresoService progresoService;

    public ProgresoController(ProgresoService progresoService) {
        this.progresoService = progresoService;
    }

    private Long candidatoId(HttpServletRequest req) {
        return (Long) req.getAttribute("candidatoId");
    }

    /** GET /api/usuario/progreso — estado y línea de tiempo del candidato autenticado. */
    @GetMapping
    public Map<String, Object> miProgreso(HttpServletRequest req) {
        return progresoService.consultar(candidatoId(req));
    }
}
