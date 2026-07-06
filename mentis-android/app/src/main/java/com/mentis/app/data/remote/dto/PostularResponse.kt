package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class PostularResponse(
    @SerializedName("mensaje")      val mensaje: String,
    @SerializedName("candidato_id") val candidatoId: Int
)