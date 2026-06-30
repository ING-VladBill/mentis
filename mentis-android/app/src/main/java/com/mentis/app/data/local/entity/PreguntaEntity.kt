package com.mentis.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "preguntas_examen")
data class PreguntaEntity(
    @PrimaryKey
    val id: Int,
    val examenId: Int,
    val orden: Int,
    val tipo: String,
    val categoria: String,
    val enunciado: String,
    val opciones: List<String>,
    val puntos: Int,
    val respuestaCandidato: String?,
    val respondida: Boolean,
    val sincronizada: Boolean = true
)