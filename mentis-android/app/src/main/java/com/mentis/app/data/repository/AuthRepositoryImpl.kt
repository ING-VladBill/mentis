package com.mentis.app.data.repository

import com.mentis.app.core.Resource
import com.mentis.app.data.local.datastore.TokenManager
import com.mentis.app.data.remote.api.MentisApi
import com.mentis.app.data.remote.dto.AccesoRequest
import com.mentis.app.data.remote.dto.AccesoResponse
import com.mentis.app.domain.repository.AuthRepository
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val api: MentisApi,
    private val tokenManager: TokenManager
) : AuthRepository {

    override suspend fun acceder(token: String): Resource<AccesoResponse> {
        return try {
            val response = api.acceder(AccesoRequest(token))
            tokenManager.guardarToken(response.access)
            Resource.Success(response)
        } catch (e: retrofit2.HttpException) {
            val msg = when (e.code()) {
                401 -> "Token inválido o expirado."
                410 -> "Este link ya fue utilizado o expiró."
                else -> "Error del servidor: ${e.code()}"
            }
            Resource.Error(msg)
        } catch (e: Exception) {
            Resource.Error("No se pudo conectar. Verifica tu conexión.")
        }
    }

    override suspend fun cerrarSesion() {
        tokenManager.limpiarToken()
    }
}
