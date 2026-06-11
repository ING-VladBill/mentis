package com.mentis.usuario.config;

import com.mentis.usuario.exception.ApiException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Protege las rutas del examen. El front manda:
 *   Authorization: Bearer <jwt>
 * El JWT se obtiene en POST /api/usuario/auth/acceso con el token UUID del correo.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    public AuthInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Las peticiones OPTIONS (preflight CORS) pasan libres
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw ApiException.unauthorized("Se requiere autenticación. Usa el link de tu correo para acceder.");
        }
        try {
            Claims claims = jwtUtil.validar(header.substring(7));
            request.setAttribute("candidatoId", Long.parseLong(claims.getSubject()));
        } catch (JwtException e) {
            throw ApiException.unauthorized("Tu sesión expiró o es inválida. Vuelve a entrar desde el link de tu correo.");
        }
        return true;
    }
}
