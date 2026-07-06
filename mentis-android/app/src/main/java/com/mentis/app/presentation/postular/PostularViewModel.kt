package com.mentis.app.presentation.postular

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mentis.app.core.Resource
import com.mentis.app.domain.usecase.PostularUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PostularUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val mensajeExito: String? = null
)

@HiltViewModel
class PostularViewModel @Inject constructor(
    private val postularUseCase: PostularUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(PostularUiState())
    val uiState: StateFlow<PostularUiState> = _uiState

    fun postular(
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
        cvUri: Uri?
    ) {
        if (cvUri == null) {
            _uiState.value = _uiState.value.copy(errorMessage = "Adjunta tu CV en PDF antes de postular.")
            return
        }
        if (nombre.isBlank() || apellidoPaterno.isBlank() || email.isBlank()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Nombre, apellido y correo son obligatorios.")
            return
        }

        viewModelScope.launch {
            _uiState.value = PostularUiState(isLoading = true)
            when (val result = postularUseCase(
                codigo, nombre, apellidoPaterno, apellidoMaterno, email, telefono,
                ciudad, linkedin, pretensionSalarial, disponibilidad,
                aceptaModalidad, aceptaCiudad, cvUri
            )) {
                is Resource.Loading -> Unit
                is Resource.Success -> _uiState.value = PostularUiState(mensajeExito = result.data)
                is Resource.Error -> _uiState.value = PostularUiState(errorMessage = result.message)
            }
        }
    }

    fun limpiarError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}