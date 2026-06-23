package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class AccesoRequest(
    @SerializedName("token") val token: String
)
