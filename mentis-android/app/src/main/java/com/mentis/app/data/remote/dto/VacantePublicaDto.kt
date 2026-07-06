package com.mentis.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class VacantesPublicasResponse(
    @SerializedName("total")    val total: Int,
    @SerializedName("vacantes") val vacantes: List<VacantePublicaDto>
)

data class VacantePublicaDto(
    @SerializedName("codigo")                 val codigo: String,
    @SerializedName("titulo")                 val titulo: String,
    @SerializedName("area")                   val area: String,
    @SerializedName("nivel")                  val nivel: String,
    @SerializedName("modalidad")              val modalidad: String,
    @SerializedName("ciudad")                 val ciudad: String,
    @SerializedName("tipo_contrato")          val tipoContrato: String,
    @SerializedName("salario_minimo")         val salarioMinimo: String?,
    @SerializedName("salario_maximo")         val salarioMaximo: String?,
    @SerializedName("moneda")                 val moneda: String?,
    @SerializedName("posiciones_disponibles") val posicionesDisponibles: Int
)