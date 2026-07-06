package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.domain.model.VacantePublica
import com.mentis.app.domain.repository.VacantesRepository
import javax.inject.Inject

class ObtenerVacantesPublicasUseCase @Inject constructor(
    private val vacantesRepository: VacantesRepository
) {
    suspend operator fun invoke(): Resource<List<VacantePublica>> =
        vacantesRepository.obtenerVacantesPublicas()
}