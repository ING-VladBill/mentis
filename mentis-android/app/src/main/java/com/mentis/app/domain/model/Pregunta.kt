package com.mentis.app.domain.model

data class Pregunta(
    val id: Int,
    val orden: Int,
    val tipo: String,
    val categoria: String,
    val enunciado: String,
    val opciones: List<String>,
    val puntos: Int,
    val respuestaCandidato: String?,
    val respondida: Boolean
) {
    val esMultiple: Boolean get() = tipo == "multiple"
}