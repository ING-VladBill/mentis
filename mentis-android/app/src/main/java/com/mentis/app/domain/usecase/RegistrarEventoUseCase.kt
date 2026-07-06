package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.dto.EventoResponse
import com.mentis.app.domain.repository.ExamenRepository
import javax.inject.Inject

class RegistrarEventoUseCase @Inject constructor(
    private val examenRepository: ExamenRepository
) {
    suspend operator fun invoke(tipo: String, detalle: String): Resource<EventoResponse> {
        return examenRepository.registrarEvento(tipo, detalle)
    }
}