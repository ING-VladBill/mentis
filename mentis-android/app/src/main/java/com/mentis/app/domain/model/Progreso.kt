package com.mentis.app.domain.model

data class Progreso(
    val candidato: String,
    val vacante: String?,
    val estadoActual: String,
    val etiquetaEstado: String,
    val mensaje: String,
    val fases: List<Fase>,
    val accionDisponible: Accion
)

data class Fase(
    val titulo: String,
    val descripcion: String,
    val estado: String  // completada | actual | pendiente | bloqueada
)

data class Accion(
    val tipo: String,
    val titulo: String?,
    val habilitada: Boolean
)
