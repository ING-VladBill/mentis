package com.mentis.app.domain.repository

import com.mentis.app.core.Resource
import com.mentis.app.domain.model.Progreso

interface ProgresoRepository {
    suspend fun obtenerProgreso(): Resource<Progreso>
}
