package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// Body para POST /api/usuario/examen/evento
data class EventoRequest(
    @SerializedName("tipo") val tipo: String,
    @SerializedName("detalle") val detalle: String
)

// Respuesta de POST /api/usuario/examen/evento
data class EventoResponse(
    @SerializedName("registrado") val registrado: Boolean,
    @SerializedName("severidad") val severidad: String,
    @SerializedName("total_eventos") val totalEventos: Int
)