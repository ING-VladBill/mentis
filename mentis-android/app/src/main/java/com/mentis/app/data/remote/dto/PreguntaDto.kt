package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class PreguntaDto(
    @SerializedName("id") val id: Int,
    @SerializedName("orden") val orden: Int,
    @SerializedName("tipo") val tipo: String, // "multiple" | "abierta"
    @SerializedName("categoria") val categoria: String,
    @SerializedName("enunciado") val enunciado: String,
    @SerializedName("opciones") val opciones: List<String>,
    @SerializedName("puntos") val puntos: Int,
    @SerializedName("respuestaCandidato") val respuestaCandidato: String?,
    @SerializedName("respondida") val respondida: Boolean
)