package com.mentis.usuario.dto;

import jakarta.validation.constraints.NotBlank;

public record EventoRequest(@NotBlank String tipo, String detalle) {}
