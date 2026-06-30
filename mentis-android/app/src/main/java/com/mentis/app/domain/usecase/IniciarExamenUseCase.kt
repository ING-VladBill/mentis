package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.domain.model.Examen
import com.mentis.app.domain.repository.ExamenRepository
import javax.inject.Inject

class IniciarExamenUseCase @Inject constructor(
    private val examenRepository: ExamenRepository
) {
    suspend operator fun invoke(): Resource<Examen> {
        return examenRepository.iniciarExamen()
    }
}