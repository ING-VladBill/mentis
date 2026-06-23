package com.mentis.app.domain.usecase

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.dto.AccesoResponse
import com.mentis.app.domain.repository.AuthRepository
import javax.inject.Inject

class AccederUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(token: String): Resource<AccesoResponse> {
        if (token.isBlank()) return Resource.Error("Ingresa tu token de acceso.")
        return authRepository.acceder(token.trim())
    }
}
