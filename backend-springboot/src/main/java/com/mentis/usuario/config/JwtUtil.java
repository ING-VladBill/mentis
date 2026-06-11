package com.mentis.usuario.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        // El secreto debe tener al menos 32 caracteres para HS256
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Genera un JWT para el candidato. Expira junto con el token de acceso original. */
    public String generar(Long candidatoId, Long examenTokenId, Date expiracion) {
        return Jwts.builder()
                .subject(String.valueOf(candidatoId))
                .claim("token_id", examenTokenId)
                .issuedAt(new Date())
                .expiration(expiracion)
                .signWith(key)
                .compact();
    }

    /** Valida y devuelve los claims. Lanza JwtException si es inválido/expirado. */
    public Claims validar(String jwt) throws JwtException {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(jwt).getPayload();
    }
}
