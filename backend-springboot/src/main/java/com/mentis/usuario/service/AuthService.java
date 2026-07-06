package com.mentis.usuario.service;

import com.mentis.usuario.config.JwtUtil;
import com.mentis.usuario.entity.Candidato;
import com.mentis.usuario.entity.TokenAcceso;
import com.mentis.usuario.exception.ApiException;
import com.mentis.usuario.repository.TokenAccesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Acceso del candidato con el token UUID que recibió por correo.
 * Si el token es válido, se emite un JWT propio del módulo usuario
 * que expira junto con el token original.
 */
@Service
public class AuthService {

    private final TokenAccesoRepository tokenRepo;
    private final JwtUtil jwtUtil;

    public AuthService(TokenAccesoRepository tokenRepo, JwtUtil jwtUtil) {
        this.tokenRepo = tokenRepo;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public Map<String, Object> acceder(String tokenRaw, String ip) {
        // Django guarda los UUID sin guiones en MySQL
        String token = tokenRaw.replace("-", "").trim().toLowerCase();

        TokenAcceso t = tokenRepo.findByToken(token)
                .orElseThrow(() -> ApiException.notFound("El link no es válido. Verifica tu correo."));

        LocalDateTime ahoraUtc = LocalDateTime.now(ZoneOffset.UTC);

        if (t.getFechaExpiracion() != null && t.getFechaExpiracion().isBefore(ahoraUtc)) {
            throw ApiException.gone("Este link ya expiró. Contacta al equipo de reclutamiento.");
        }
        if (Boolean.TRUE.equals(t.getUsado())) {
            throw ApiException.gone("Este link ya fue utilizado.");
        }
        if (!"examen".equals(t.getTipo())) {
            throw ApiException.badRequest("Este link no corresponde a un examen.");
        }

        // Registrar primer uso (no marca como usado: eso pasa al finalizar el examen)
        if (t.getFechaUso() == null) {
            t.setFechaUso(ahoraUtc);
            t.setIpUso(ip);
            tokenRepo.save(t);
        }

        Candidato c = t.getCandidato();

        Date exp = Date.from(t.getFechaExpiracion().toInstant(ZoneOffset.UTC));
        String jwt = jwtUtil.generar(c.getId(), t.getId(), exp);

        Map<String, Object> resp = new HashMap<>();
        resp.put("access", jwt);
        resp.put("candidato", Map.of(
                "id", c.getId(),
                "nombre", c.getNombreCompleto(),
                "email", c.getEmail(),
                "estado", c.getEstado()
        ));
        resp.put("vacante", Map.of(
                "codigo", c.getVacante().getCodigo(),
                "titulo", c.getVacante().getTitulo()
        ));
        resp.put("expira_en", t.getFechaExpiracion().toString());
        return resp;
    }
}
