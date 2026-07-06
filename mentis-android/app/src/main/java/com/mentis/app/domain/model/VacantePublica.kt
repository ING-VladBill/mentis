package com.mentis.app.domain.model

data class
VacantePublica(
    val codigo: String,
    val titulo: String,
    val area: String,
    val nivel: String,
    val modalidad: String,
    val ciudad: String,
    val tipoContrato: String,
    val salarioMinimo: String?,
    val salarioMaximo: String?,
    val moneda: String?,
    val posicionesDisponibles: Int
)