package com.mentis.app.data.repository

import android.content.Context
import android.net.Uri
import com.google.gson.Gson
import com.mentis.app.core.Resource
import com.mentis.app.data.remote.api.VacantesApi
import com.mentis.app.domain.model.VacantePublica
import com.mentis.app.domain.repository.VacantesRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

class VacantesRepositoryImpl @Inject constructor(
    private val api: VacantesApi,
    @ApplicationContext private val context: Context
) : VacantesRepository {

    override suspend fun obtenerVacantesPublicas(): Resource<List<VacantePublica>> {
        return try {
            val response = api.obtenerVacantesPublicas()
            val vacantes = response.vacantes.map {
                VacantePublica(
                    codigo = it.codigo,
                    titulo = it.titulo,
                    area = it.area,
                    nivel = it.nivel,
                    modalidad = it.modalidad,
                    ciudad = it.ciudad,
                    tipoContrato = it.tipoContrato,
                    salarioMinimo = it.salarioMinimo,
                    salarioMaximo = it.salarioMaximo,
                    moneda = it.moneda,
                    posicionesDisponibles = it.posicionesDisponibles
                )
            }
            Resource.Success(vacantes)
        } catch (e: retrofit2.HttpException) {
            Resource.Error("No se pudieron cargar las vacantes (${e.code()}). Verifica que Django esté corriendo.")
        } catch (e: Exception) {
            Resource.Error("No se pudo conectar. Verifica tu conexión.")
        }
    }

    override suspend fun postular(
        codigo: String,
        nombre: String,
        apellidoPaterno: String,
        apellidoMaterno: String,
        email: String,
        telefono: String,
        ciudad: String,
        linkedin: String,
        pretensionSalarial: String?,
        disponibilidad: String,
        aceptaModalidad: Boolean,
        aceptaCiudad: Boolean,
        cvUri: Uri
    ): Resource<String> {
        return try {
            val texto = { v: String -> v.toRequestBody("text/plain".toMediaTypeOrNull()) }

            val response = api.postular(
                codigo = codigo,
                nombre = texto(nombre),
                apellidoPaterno = texto(apellidoPaterno),
                apellidoMaterno = texto(apellidoMaterno),
                email = texto(email),
                telefono = texto(telefono),
                ciudad = texto(ciudad),
                linkedin = texto(linkedin),
                pretensionSalarial = pretensionSalarial?.let { texto(it) },
                disponibilidad = texto(disponibilidad),
                aceptaModalidad = texto(aceptaModalidad.toString()),
                aceptaCiudad = texto(aceptaCiudad.toString()),
                cv = uriAMultipart(cvUri)
            )
            Resource.Success(response.mensaje)
        } catch (e: retrofit2.HttpException) {
            val msg = leerErrorDelBackend(e) ?: when (e.code()) {
                400 -> "Revisa los datos: falta algún campo obligatorio."
                404 -> "Esta vacante ya no está disponible."
                410 -> "Esta vacante ya cubrió todas sus posiciones."
                else -> "Error del servidor: ${e.code()}"
            }
            Resource.Error(msg)
        } catch (e: Exception) {
            Resource.Error("No se pudo conectar. Verifica tu conexión.")
        }
    }

    private fun leerErrorDelBackend(e: retrofit2.HttpException): String? {
        return try {
            val body = e.response()?.errorBody()?.string() ?: return null
            Gson().fromJson(body, Map::class.java)["error"] as? String
        } catch (ex: Exception) {
            null
        }
    }

    // Retrofit necesita un File/stream de tamaño conocido: copiamos el PDF elegido a un temporal.
    private fun uriAMultipart(uri: Uri): MultipartBody.Part {
        val inputStream = context.contentResolver.openInputStream(uri)
            ?: throw IllegalStateException("No se pudo leer el archivo seleccionado.")
        val archivoTemp = File(context.cacheDir, "cv_postulacion.pdf")
        FileOutputStream(archivoTemp).use { output -> inputStream.copyTo(output) }
        val requestFile = archivoTemp.asRequestBody("application/pdf".toMediaTypeOrNull())
        return MultipartBody.Part.createFormData("cv", "cv_postulacion.pdf", requestFile)
    }
}