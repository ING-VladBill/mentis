package com.mentis.app.data.remote.api

import com.mentis.app.data.remote.dto.PostularResponse
import com.mentis.app.data.remote.dto.VacantesPublicasResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path

// Este backend es Django (no Spring Boot). Sin JWT, es público.
interface VacantesApi {

    @GET("api/vacantes/publicas/")
    suspend fun obtenerVacantesPublicas(): VacantesPublicasResponse

    @Multipart
    @POST("api/postular/{codigo}/enviar/")
    suspend fun postular(
        @Path("codigo") codigo: String,
        @Part("nombre") nombre: RequestBody,
        @Part("apellido_paterno") apellidoPaterno: RequestBody,
        @Part("apellido_materno") apellidoMaterno: RequestBody,
        @Part("email") email: RequestBody,
        @Part("telefono") telefono: RequestBody,
        @Part("ciudad") ciudad: RequestBody,
        @Part("linkedin") linkedin: RequestBody,
        @Part("pretension_salarial") pretensionSalarial: RequestBody?,
        @Part("disponibilidad") disponibilidad: RequestBody,
        @Part("acepta_modalidad") aceptaModalidad: RequestBody,
        @Part("acepta_ciudad") aceptaCiudad: RequestBody,
        @Part cv: MultipartBody.Part
    ): PostularResponse
}