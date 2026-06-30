package com.mentis.app.data.repository

import com.mentis.app.core.Resource
import com.mentis.app.data.local.dao.PreguntaDao
import com.mentis.app.data.local.entity.PreguntaEntity
import com.mentis.app.data.remote.api.MentisApi
import com.mentis.app.data.remote.dto.EventoRequest
import com.mentis.app.data.remote.dto.EventoResponse
import com.mentis.app.data.remote.dto.ExamenResponse
import com.mentis.app.data.remote.dto.FinalizarExamenResponse
import com.mentis.app.data.remote.dto.GuardarRespuestaResponse
import com.mentis.app.data.remote.dto.PreguntaDto
import com.mentis.app.data.remote.dto.RespuestaRequest
import com.mentis.app.domain.model.Examen
import com.mentis.app.domain.model.Pregunta
import com.mentis.app.domain.repository.ExamenRepository
import retrofit2.HttpException
import javax.inject.Inject

class ExamenRepositoryImpl @Inject constructor(
    private val api: MentisApi,
    private val preguntaDao: PreguntaDao
) : ExamenRepository {

    private var ultimoExamenId: Int = -1

    override suspend fun iniciarExamen(): Resource<Examen> {
        return try {
            val response = api.iniciarExamen()
            cachearPreguntas(response)
            Resource.Success(response.toDomain())
        } catch (e: HttpException) {
            Resource.Error(mensajeDeError(e))
        } catch (e: Exception) {
            Resource.Error("No se pudo conectar. Verifica tu conexión.")
        }
    }

    override suspend fun obtenerEstadoExamen(): Resource<Examen> {
        return try {
            val response = api.obtenerEstadoExamen()
            cachearPreguntas(response)
            Resource.Success(response.toDomain())
        } catch (e: HttpException) {
            if (e.code() != 401) {
                val locales = preguntaDao.obtenerPreguntas(examenId = ultimoExamenId)
                if (locales.isNotEmpty()) return Resource.Success(locales.toDomainExamen())
            }
            Resource.Error(mensajeDeError(e))
        } catch (e: Exception) {
            val locales = preguntaDao.obtenerPreguntas(examenId = ultimoExamenId)
            if (locales.isNotEmpty()) {
                Resource.Success(locales.toDomainExamen())
            } else {
                Resource.Error("No se pudo conectar. Verifica tu conexión.")
            }
        }
    }

    override suspend fun guardarRespuesta(preguntaId: Int, respuesta: String): Resource<GuardarRespuestaResponse> {
        return try {
            val response = api.guardarRespuesta(RespuestaRequest(preguntaId, respuesta))
            preguntaDao.guardarRespuestaLocal(preguntaId, respuesta, sincronizada = true)
            Resource.Success(response)
        } catch (e: HttpException) {
            preguntaDao.guardarRespuestaLocal(preguntaId, respuesta, sincronizada = false)
            Resource.Error(mensajeDeError(e))
        } catch (e: Exception) {
            preguntaDao.guardarRespuestaLocal(preguntaId, respuesta, sincronizada = false)
            Resource.Error("Sin conexión. Tu respuesta se guardó localmente.")
        }
    }

    override suspend fun finalizarExamen(): Resource<FinalizarExamenResponse> {
        return try {
            val response = api.finalizarExamen()
            preguntaDao.limpiarExamen(examenId = ultimoExamenId)
            Resource.Success(response)
        } catch (e: HttpException) {
            Resource.Error(mensajeDeError(e))
        } catch (e: Exception) {
            Resource.Error("No se pudo conectar. Verifica tu conexión.")
        }
    }

    override suspend fun registrarEvento(tipo: String, detalle: String): Resource<EventoResponse> {
        return try {
            Resource.Success(api.registrarEvento(EventoRequest(tipo, detalle)))
        } catch (e: HttpException) {
            Resource.Error(mensajeDeError(e))
        } catch (e: Exception) {
            Resource.Error("No se pudo registrar el evento.")
        }
    }

    private suspend fun cachearPreguntas(response: ExamenResponse) {
        ultimoExamenId = response.examenId
        preguntaDao.insertarTodas(response.preguntas.map { it.toEntity(response.examenId) })
    }

    private fun mensajeDeError(e: HttpException): String = when (e.code()) {
        401 -> "Tu sesión expiró, vuelve a ingresar con tu token."
        404 -> "No se encontró el examen."
        409 -> "El examen ya fue finalizado."
        else -> "Error del servidor: ${e.code()}"
    }
}

private fun ExamenResponse.toDomain(): Examen = Examen(
    examenId = examenId,
    estado = estado,
    duracionMinutos = duracionMinutos,
    segundosRestantes = segundosRestantes,
    vacante = vacante,
    preguntas = preguntas.map { it.toDomain() }
)

private fun PreguntaDto.toDomain(): Pregunta = Pregunta(
    id = id, orden = orden, tipo = tipo, categoria = categoria,
    enunciado = enunciado, opciones = opciones, puntos = puntos,
    respuestaCandidato = respuestaCandidato, respondida = respondida
)

private fun PreguntaDto.toEntity(examenId: Int): PreguntaEntity = PreguntaEntity(
    id = id, examenId = examenId, orden = orden, tipo = tipo, categoria = categoria,
    enunciado = enunciado, opciones = opciones, puntos = puntos,
    respuestaCandidato = respuestaCandidato, respondida = respondida, sincronizada = true
)

private fun List<PreguntaEntity>.toDomainExamen(): Examen {
    val primera = this.first()
    return Examen(
        examenId = primera.examenId, estado = "en_curso", duracionMinutos = 0,
        segundosRestantes = 0, vacante = "",
        preguntas = this.sortedBy { it.orden }.map { it.toDomain() }
    )
}

private fun PreguntaEntity.toDomain(): Pregunta = Pregunta(
    id = id, orden = orden, tipo = tipo, categoria = categoria,
    enunciado = enunciado, opciones = opciones, puntos = puntos,
    respuestaCandidato = respuestaCandidato, respondida = respondida
)