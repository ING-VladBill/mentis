package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class AccesoResponse(
    @SerializedName("access")     val access: String,
    @SerializedName("candidato")  val candidato: CandidatoDto,
    @SerializedName("vacante")    val vacante: VacanteDto,
    @SerializedName("expira_en")  val expiraEn: String
)

data class CandidatoDto(
    @SerializedName("id")     val id: Long,
    @SerializedName("nombre") val nombre: String,
    @SerializedName("email")  val email: String,
    @SerializedName("estado") val estado: String
)

data class VacanteDto(
    @SerializedName("codigo") val codigo: String,
    @SerializedName("titulo") val titulo: String
)
