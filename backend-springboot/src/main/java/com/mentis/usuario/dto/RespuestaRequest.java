package com.mentis.usuario.dto;

import jakarta.validation.constraints.NotNull;

public record RespuestaRequest(@NotNull Long preguntaId, String respuesta) {}
