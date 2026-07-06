package com.mentis.app.domain.model

data class Examen(
    val examenId: Int,
    val estado: String,
    val duracionMinutos: Int,
    val segundosRestantes: Int,
    val vacante: String,
    val preguntas: List<Pregunta>
) {
    val totalPreguntas: Int get() = preguntas.size
    val respondidas: Int get() = preguntas.count { it.respondida }
    val finalizado: Boolean get() = estado == "finalizado"
}