package com.mentis.usuario.controller;

import com.mentis.usuario.dto.AccesoRequest;
import com.mentis.usuario.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuario/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/usuario/auth/acceso
     * Body: { "token": "uuid-del-correo" }
     * El candidato entra con el link de su correo. Devuelve JWT + datos.
     */
    @PostMapping("/acceso")
    public Map<String, Object> acceso(@Valid @RequestBody AccesoRequest req, HttpServletRequest http) {
        return authService.acceder(req.token(), http.getRemoteAddr());
    }
}
