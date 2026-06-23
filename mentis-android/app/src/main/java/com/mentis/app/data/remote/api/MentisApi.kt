package com.mentis.app.data.remote.api

import com.mentis.app.data.remote.dto.AccesoRequest
import com.mentis.app.data.remote.dto.AccesoResponse
import com.mentis.app.data.remote.dto.ProgresoResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface MentisApi {

    // 9.1 Health
    @GET("api/usuario/health")
    suspend fun health(): Map<String, String>

    // 9.2 Acceso por token → devuelve JWT
    @POST("api/usuario/auth/acceso")
    suspend fun acceder(@Body request: AccesoRequest): AccesoResponse

    // 9.8 Progreso del candidato (requiere JWT via interceptor)
    @GET("api/usuario/progreso")
    suspend fun obtenerProgreso(): ProgresoResponse
}
