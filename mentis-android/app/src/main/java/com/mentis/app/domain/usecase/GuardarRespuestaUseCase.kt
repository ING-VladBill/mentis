package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.dto.GuardarRespuestaResponse
import com.mentis.app.domain.repository.ExamenRepository
import javax.inject.Inject

class GuardarRespuestaUseCase @Inject constructor(
    private val examenRepository: ExamenRepository
) {
    suspend operator fun invoke(preguntaId: Int, respuesta: String): Resource<GuardarRespuestaResponse> {
        if (respuesta.isBlank()) {
            return Resource.Error("La respuesta no puede estar vacía.")
        }
        return examenRepository.guardarRespuesta(preguntaId, respuesta.trim())
    }
}