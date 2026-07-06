package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ProgresoResponse(
    @SerializedName("candidato")        val candidato: String,
    @SerializedName("vacante")          val vacante: String?,
    @SerializedName("estado_actual")    val estadoActual: String,
    @SerializedName("etiqueta_estado")  val etiquetaEstado: String,
    @SerializedName("mensaje")          val mensaje: String,
    @SerializedName("fases")            val fases: List<FaseDto>,
    @SerializedName("accion_disponible") val accionDisponible: AccionDto
)

data class FaseDto(
    @SerializedName("titulo")      val titulo: String,
    @SerializedName("descripcion") val descripcion: String,
    @SerializedName("estado")      val estado: String  // completada | actual | pendiente | bloqueada
)

data class AccionDto(
    @SerializedName("tipo")       val tipo: String,     // rendir_examen | continuar_examen | rendir_entrevista | ninguna
    @SerializedName("titulo")     val titulo: String?,
    @SerializedName("habilitada") val habilitada: Boolean
)
