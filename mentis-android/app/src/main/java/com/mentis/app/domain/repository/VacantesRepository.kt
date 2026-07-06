package com.mentis.app.domain.repository

import android.net.Uri
import com.mentis.app.core.Resource
import com.mentis.app.domain.model.VacantePublica

interface VacantesRepository {
    suspend fun obtenerVacantesPublicas(): Resource<List<VacantePublica>>

    suspend fun postular(
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
    ): Resource<String>
}