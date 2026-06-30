package com.mentis.app.data.remote.api

import com.mentis.app.data.remote.dto.AccesoRequest
import com.mentis.app.data.remote.dto.AccesoResponse
import com.mentis.app.data.remote.dto.EventoRequest
import com.mentis.app.data.remote.dto.EventoResponse
import com.mentis.app.data.remote.dto.ExamenResponse
import com.mentis.app.data.remote.dto.FinalizarExamenResponse
import com.mentis.app.data.remote.dto.GuardarRespuestaResponse
import com.mentis.app.data.remote.dto.ProgresoResponse
import com.mentis.app.data.remote.dto.RespuestaRequest
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

    // 9.3 Iniciar examen (genera preguntas con IA la primera vez) — HAROLD
    @POST("api/usuario/examen/iniciar")
    suspend fun iniciarExamen(): ExamenResponse

    // 9.4 Estado del examen (retomar si cierra la app) — HAROLD
    @GET("api/usuario/examen")
    suspend fun obtenerEstadoExamen(): ExamenResponse

    // 9.5 Guardar respuesta (auto-guardado) — HAROLD
    @POST("api/usuario/examen/respuesta")
    suspend fun guardarRespuesta(@Body request: RespuestaRequest): GuardarRespuestaResponse

    // 9.6 Finalizar examen (política de silencio: no devuelve nota) — HAROLD
    @POST("api/usuario/examen/finalizar")
    suspend fun finalizarExamen(): FinalizarExamenResponse

    // 9.7 Registrar evento de auditoría (proctoring) — HAROLD
    @POST("api/usuario/examen/evento")
    suspend fun registrarEvento(@Body request: EventoRequest): EventoResponse

    // 9.8 Progreso del candidato (requiere JWT via interceptor)
    @GET("api/usuario/progreso")
    suspend fun obtenerProgreso(): ProgresoResponse
}