package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ExamenResponse(
    @SerializedName("examen_id") val examenId: Int,
    @SerializedName("estado") val estado: String, // "en_curso" | "finalizado"
    @SerializedName("duracion_minutos") val duracionMinutos: Int,
    @SerializedName("segundos_restantes") val segundosRestantes: Int,
    @SerializedName("vacante") val vacante: String,
    @SerializedName("preguntas") val preguntas: List<PreguntaDto>
)