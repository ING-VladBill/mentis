package com.mentis.app.presentation.progreso

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mentis.app.core.Resource
import com.mentis.app.domain.model.Progreso
import com.mentis.app.domain.repository.AuthRepository
import com.mentis.app.domain.usecase.ObtenerProgresoUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProgresoUiState(
    val isLoading: Boolean = false,
    val progreso: Progreso? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class ProgresoViewModel @Inject constructor(
    private val obtenerProgresoUseCase: ObtenerProgresoUseCase,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProgresoUiState(isLoading = true))
    val uiState: StateFlow<ProgresoUiState> = _uiState

    init {
        cargarProgreso()
    }

    fun cargarProgreso() {
        viewModelScope.launch {
            _uiState.value = ProgresoUiState(isLoading = true)
            when (val result = obtenerProgresoUseCase()) {
                is Resource.Loading -> Unit
                is Resource.Success -> {
                    _uiState.value = ProgresoUiState(progreso = result.data)
                }
                is Resource.Error -> {
                    _uiState.value = ProgresoUiState(errorMessage = result.message)
                }
            }
        }
    }

    fun cerrarSesion() {
        viewModelScope.launch {
            authRepository.cerrarSesion()
        }
    }
}
