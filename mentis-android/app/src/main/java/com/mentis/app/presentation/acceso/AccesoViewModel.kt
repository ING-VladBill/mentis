package com.mentis.app.presentation.acceso

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mentis.app.core.Resource
import com.mentis.app.domain.usecase.AccederUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AccesoUiState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val exitoEstado: String? = null  // estado del candidato al acceder con éxito
)

@HiltViewModel
class AccesoViewModel @Inject constructor(
    private val accederUseCase: AccederUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AccesoUiState())
    val uiState: StateFlow<AccesoUiState> = _uiState

    fun acceder(token: String) {
        viewModelScope.launch {
            _uiState.value = AccesoUiState(isLoading = true)
            when (val result = accederUseCase(token)) {
                is Resource.Loading -> Unit
                is Resource.Success -> {
                    _uiState.value = AccesoUiState(exitoEstado = result.data.candidato.estado)
                }
                is Resource.Error -> {
                    _uiState.value = AccesoUiState(errorMessage = result.message)
                }
            }
        }
    }

    fun limpiarError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}
