package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// Body para POST /api/usuario/examen/respuesta
data class RespuestaRequest(
    @SerializedName("preguntaId") val preguntaId: Int,
    @SerializedName("respuesta") val respuesta: String
)

// Respuesta de POST /api/usuario/examen/respuesta
data class GuardarRespuestaResponse(
    @SerializedName("mensaje") val mensaje: String,
    @SerializedName("respondidas") val respondidas: Int,
    @SerializedName("total") val total: Int
)

// Respuesta de POST /api/usuario/examen/finalizar (política de silencio: sin nota)
data class FinalizarExamenResponse(
    @SerializedName("mensaje") val mensaje: String,
    @SerializedName("estado") val estado: String
)