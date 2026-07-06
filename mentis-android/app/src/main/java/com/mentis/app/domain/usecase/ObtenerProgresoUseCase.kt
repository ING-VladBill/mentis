package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.domain.model.Progreso
import com.mentis.app.domain.repository.ProgresoRepository
import javax.inject.Inject

class ObtenerProgresoUseCase @Inject constructor(
    private val progresoRepository: ProgresoRepository
) {
    suspend operator fun invoke(): Resource<Progreso> =
        progresoRepository.obtenerProgreso()
}
