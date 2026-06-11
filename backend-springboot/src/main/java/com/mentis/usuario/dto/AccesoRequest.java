package com.mentis.usuario.dto;

import jakarta.validation.constraints.NotBlank;

public record AccesoRequest(@NotBlank String token) {}
