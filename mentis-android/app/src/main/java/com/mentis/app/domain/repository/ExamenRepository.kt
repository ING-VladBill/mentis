package com.mentis.app.domain.repository

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.dto.EventoResponse
import com.mentis.app.data.remote.dto.FinalizarExamenResponse
import com.mentis.app.data.remote.dto.GuardarRespuestaResponse
import com.mentis.app.domain.model.Examen

interface   ExamenRepository {
    suspend fun iniciarExamen(): Resource<Examen>
    suspend fun obtenerEstadoExamen(): Resource<Examen>
    suspend fun guardarRespuesta(preguntaId: Int, respuesta: String): Resource<GuardarRespuestaResponse>
    suspend fun finalizarExamen(): Resource<FinalizarExamenResponse>
    suspend fun registrarEvento(tipo: String, detalle: String): Resource<EventoResponse>
}