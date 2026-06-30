package com.mentis.app.presentation.examen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mentis.app.core.Resource
import com.mentis.app.domain.model.Examen
import com.mentis.app.domain.model.Pregunta
import com.mentis.app.domain.usecase.FinalizarExamenUseCase
import com.mentis.app.domain.usecase.GuardarRespuestaUseCase
import com.mentis.app.domain.usecase.IniciarExamenUseCase
import com.mentis.app.domain.usecase.ObtenerEstadoExamenUseCase
import com.mentis.app.domain.usecase.RegistrarEventoUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ExamenUiState(
    val isLoading: Boolean = true,
    val examen: Examen? = null,
    val preguntaActualIndex: Int = 0,
    val segundosRestantes: Int = 0,
    val errorMessage: String? = null,
    val finalizando: Boolean = false,
    val examenFinalizado: Boolean = false
) {
    val preguntaActual: Pregunta? get() = examen?.preguntas?.getOrNull(preguntaActualIndex)
    val totalPreguntas: Int get() = examen?.preguntas?.size ?: 0
    val esUltimaPregunta: Boolean get() = preguntaActualIndex == totalPreguntas - 1
    val esPrimeraPregunta: Boolean get() = preguntaActualIndex == 0
}

@HiltViewModel
class ExamenViewModel @Inject constructor(
    private val iniciarExamenUseCase: IniciarExamenUseCase,
    private val obtenerEstadoExamenUseCase: ObtenerEstadoExamenUseCase,
    private val guardarRespuestaUseCase: GuardarRespuestaUseCase,
    private val finalizarExamenUseCase: FinalizarExamenUseCase,
    private val registrarEventoUseCase: RegistrarEventoUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(ExamenUiState())
    val uiState: StateFlow<ExamenUiState> = _uiState

    private var timerJob: Job? = null
    private var guardadoJob: Job? = null

    init {
        cargarExamen()
    }

    private fun cargarExamen() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            when (val estado = obtenerEstadoExamenUseCase()) {
                is Resource.Success -> aplicarExamenCargado(estado.data)
                else -> when (val inicio = iniciarExamenUseCase()) {
                    is Resource.Success -> aplicarExamenCargado(inicio.data)
                    is Resource.Error -> _uiState.value = ExamenUiState(
                        isLoading = false,
                        errorMessage = inicio.message
                    )
                    is Resource.Loading -> Unit
                }
            }
        }
    }

    private fun aplicarExamenCargado(examen: Examen) {
        if (examen.finalizado) {
            _uiState.value = _uiState.value.copy(isLoading = false, examenFinalizado = true)
            return
        }
        _uiState.value = _uiState.value.copy(
            isLoading = false,
            examen = examen,
            segundosRestantes = examen.segundosRestantes
        )
        iniciarTimer()
    }

    private fun iniciarTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (_uiState.value.segundosRestantes > 0 && !_uiState.value.examenFinalizado) {
                delay(1000)
                _uiState.value = _uiState.value.copy(
                    segundosRestantes = (_uiState.value.segundosRestantes - 1).coerceAtLeast(0)
                )
            }
            if (_uiState.value.segundosRestantes <= 0 && !_uiState.value.examenFinalizado) {
                registrarEvento("tiempo_agotado", "El cronómetro llegó a cero")
                finalizarExamen()
            }
        }
    }

    fun responder(respuesta: String) {
        val pregunta = _uiState.value.preguntaActual ?: return

        val preguntasActualizadas = _uiState.value.examen?.preguntas?.map {
            if (it.id == pregunta.id) it.copy(respuestaCandidato = respuesta, respondida = respuesta.isNotBlank()) else it
        } ?: return
        _uiState.value = _uiState.value.copy(examen = _uiState.value.examen?.copy(preguntas = preguntasActualizadas))

        guardadoJob?.cancel()
        guardadoJob = viewModelScope.launch {
            delay(600)
            guardarRespuestaUseCase(pregunta.id, respuesta)
        }
    }

    fun siguientePregunta() {
        if (!_uiState.value.esUltimaPregunta) {
            _uiState.value = _uiState.value.copy(preguntaActualIndex = _uiState.value.preguntaActualIndex + 1)
        }
    }

    fun preguntaAnterior() {
        if (!_uiState.value.esPrimeraPregunta) {
            _uiState.value = _uiState.value.copy(preguntaActualIndex = _uiState.value.preguntaActualIndex - 1)
        }
    }

    fun finalizarExamen() {
        if (_uiState.value.finalizando) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(finalizando = true)
            timerJob?.cancel()
            guardadoJob?.cancel()
            when (finalizarExamenUseCase()) {
                is Resource.Success -> _uiState.value = _uiState.value.copy(
                    finalizando = false,
                    examenFinalizado = true
                )
                is Resource.Error -> _uiState.value = _uiState.value.copy(
                    finalizando = false,
                    examenFinalizado = true
                )
                is Resource.Loading -> Unit
            }
        }
    }

    fun registrarEvento(tipo: String, detalle: String) {
        viewModelScope.launch {
            registrarEventoUseCase(tipo, detalle)
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
        guardadoJob?.cancel()
    }
}