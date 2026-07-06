package com.mentis.app.domain.repository

import com.mentis.app.core.Resource
import com.mentis.app.data.remote.dto.AccesoResponse

interface AuthRepository {
    suspend fun acceder(token: String): Resource<AccesoResponse>
    suspend fun cerrarSesion()
}
