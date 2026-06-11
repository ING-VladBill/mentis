package com.mentis.usuario.dto;

import java.util.List;

/** Pregunta enviada al candidato. NUNCA incluye la respuesta correcta. */
public record PreguntaDTO(
    Long id,
    Integer orden,
    String tipo,
    String categoria,
    String enunciado,
    List<String> opciones,
    Integer puntos,
    String respuestaCandidato,
    boolean respondida
) {}
