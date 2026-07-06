package com.mentis.app.presentation.vacantes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mentis.app.core.Resource
import com.mentis.app.domain.model.VacantePublica
import com.mentis.app.domain.usecase.ObtenerVacantesPublicasUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VacantesUiState(
    val isLoading: Boolean = true,
    val vacantes: List<VacantePublica> = emptyList(),
    val errorMessage: String? = null
)

@HiltViewModel
class VacantesViewModel @Inject constructor(
    private val obtenerVacantesPublicasUseCase: ObtenerVacantesPublicasUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(VacantesUiState())
    val uiState: StateFlow<VacantesUiState> = _uiState

    init { cargarVacantes() }

    fun cargarVacantes() {
        viewModelScope.launch {
            _uiState.value = VacantesUiState(isLoading = true)
            when (val result = obtenerVacantesPublicasUseCase()) {
                is Resource.Loading -> Unit
                is Resource.Success -> _uiState.value = VacantesUiState(isLoading = false, vacantes = result.data)
                is Resource.Error -> _uiState.value = VacantesUiState(isLoading = false, errorMessage = result.message)
            }
        }
    }
}