package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.dto.FinalizarExamenResponse
import com.mentis.app.domain.repository.ExamenRepository
import javax.inject.Inject

class FinalizarExamenUseCase @Inject constructor(
    private val examenRepository: ExamenRepository
) {
    suspend operator fun invoke(): Resource<FinalizarExamenResponse> {
        return examenRepository.finalizarExamen()
    }
}