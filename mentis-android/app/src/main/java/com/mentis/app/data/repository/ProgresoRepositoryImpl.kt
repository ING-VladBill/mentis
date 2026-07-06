package com.mentis.app.data.repository

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.api.MentisApi
import com.mentis.app.domain.model.Accion
import com.mentis.app.domain.model.Fase
import com.mentis.app.domain.model.Progreso
import com.mentis.app.domain.repository.ProgresoRepository
import javax.inject.Inject

class ProgresoRepositoryImpl @Inject constructor(
    private val api: MentisApi
) : ProgresoRepository {

    override suspend fun obtenerProgreso(): Resource<Progreso> {
        return try {
            val dto = api.obtenerProgreso()
            val progreso = Progreso(
                candidato      = dto.candidato,
                vacante        = dto.vacante,
                estadoActual   = dto.estadoActual,
                etiquetaEstado = dto.etiquetaEstado,
                mensaje        = dto.mensaje,
                fases          = dto.fases.map { Fase(it.titulo, it.descripcion, it.estado) },
                accionDisponible = Accion(
                    tipo      = dto.accionDisponible.tipo,
                    titulo    = dto.accionDisponible.titulo,
                    habilitada = dto.accionDisponible.habilitada
                )
            )
            Resource.Success(progreso)
        } catch (e: retrofit2.HttpException) {
            val msg = when (e.code()) {
                401 -> "Tu sesión expiró. Vuelve a ingresar con tu token."
                else -> "Error del servidor: ${e.code()}"
            }
            Resource.Error(msg)
        } catch (e: Exception) {
            Resource.Error("No se pudo conectar. Verifica tu conexión.")
        }
    }
}
