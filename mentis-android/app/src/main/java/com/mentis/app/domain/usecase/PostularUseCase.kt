package com.mentis.app.domain.usecase

import android.net.Uri
import com.mentis.app.core.Resource
import com.mentis.app.domain.repository.VacantesRepository
import javax.inject.Inject

class PostularUseCase @Inject constructor(
    private val vacantesRepository: VacantesRepository
) {
    suspend operator fun invoke(
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
    ): Resource<String> = vacantesRepository.postular(
        codigo, nombre, apellidoPaterno, apellidoMaterno, email, telefono,
        ciudad, linkedin, pretensionSalarial, disponibilidad,
        aceptaModalidad, aceptaCiudad, cvUri
    )
}