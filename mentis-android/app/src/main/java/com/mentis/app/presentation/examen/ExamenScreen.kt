package com.mentis.app.presentation.examen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.mentis.app.domain.model.Pregunta
import com.mentis.app.presentation.theme.*

@Composable
fun ExamenScreen(
    onExamenFinalizado: () -> Unit,
    viewModel: ExamenViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var mostrarConfirmacionFinalizar by remember { mutableStateOf(false) }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_STOP -> viewModel.registrarEvento(
                    tipo = "app_segundo_plano",
                    detalle = "El candidato salió de la app durante el examen"
                )
                Lifecycle.Event.ON_RESUME -> viewModel.registrarEvento(
                    tipo = "app_reanudada",
                    detalle = "El candidato volvió a la app"
                )
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(uiState.examenFinalizado) {
        if (uiState.examenFinalizado) onExamenFinalizado()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MentisBackground)
    ) {
        when {
            uiState.isLoading -> CargandoExamen()
            uiState.errorMessage != null -> ErrorExamen(uiState.errorMessage!!)
            uiState.preguntaActual != null -> ContenidoExamen(
                uiState = uiState,
                onRespuestaCambiada = viewModel::responder,
                onSiguiente = viewModel::siguientePregunta,
                onAnterior = viewModel::preguntaAnterior,
                onPedirFinalizar = { mostrarConfirmacionFinalizar = true }
            )
        }

        if (mostrarConfirmacionFinalizar) {
            AlertDialog(
                onDismissRequest = { mostrarConfirmacionFinalizar = false },
                containerColor = MentisSurface,
                title = { Text("¿Finalizar examen?", color = MentisOnSurface) },
                text = {
                    Text(
                        "Una vez que finalices no podrás volver a editar tus respuestas.",
                        color = MentisSubtext
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        mostrarConfirmacionFinalizar = false
                        viewModel.finalizarExamen()
                    }) {
                        Text("Finalizar", color = MentisPurpleLight)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { mostrarConfirmacionFinalizar = false }) {
                        Text("Cancelar", color = MentisSubtext)
                    }
                }
            )
        }
    }
}

@Composable
private fun CargandoExamen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = MentisPurple)
            Spacer(modifier = Modifier.height(16.dp))
            Text("Preparando tu examen...", color = MentisSubtext)
        }
    }
}

@Composable
private fun ErrorExamen(mensaje: String) {
    Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Text(mensaje, color = MaterialTheme.colorScheme.error, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}

@Composable
private fun ContenidoExamen(
    uiState: ExamenUiState,
    onRespuestaCambiada: (String) -> Unit,
    onSiguiente: () -> Unit,
    onAnterior: () -> Unit,
    onPedirFinalizar: () -> Unit
) {
    val pregunta = uiState.preguntaActual ?: return

    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Pregunta ${uiState.preguntaActualIndex + 1} de ${uiState.totalPreguntas}",
                style = MaterialTheme.typography.bodyMedium,
                color = MentisSubtext
            )
            Cronometro(uiState.segundosRestantes)
        }

        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { (uiState.preguntaActualIndex + 1) / uiState.totalPreguntas.toFloat() },
            modifier = Modifier.fillMaxWidth(),
            color = MentisPurple,
            trackColor = MentisSurface
        )

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            modifier = Modifier.fillMaxWidth().weight(1f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MentisSurface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    pregunta.categoria.uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = MentisPurpleLight
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    pregunta.enunciado,
                    style = MaterialTheme.typography.titleLarge,
                    color = MentisOnSurface
                )
                Spacer(modifier = Modifier.height(20.dp))

                if (pregunta.esMultiple) {
                    OpcionesMultiple(pregunta = pregunta, onSeleccionar = onRespuestaCambiada)
                } else {
                    RespuestaAbierta(pregunta = pregunta, onCambiar = onRespuestaCambiada)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onAnterior,
                enabled = !uiState.esPrimeraPregunta,
                modifier = Modifier.weight(1f)
            ) {
                Text("Anterior")
            }

            if (uiState.esUltimaPregunta) {
                Button(
                    onClick = onPedirFinalizar,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
                ) {
                    Text("Finalizar", color = MentisOnPrimary)
                }
            } else {
                Button(
                    onClick = onSiguiente,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
                ) {
                    Text("Siguiente", color = MentisOnPrimary)
                }
            }
        }
    }
}

@Composable
private fun Cronometro(segundosRestantes: Int) {
    val minutos = segundosRestantes / 60
    val segundos = segundosRestantes % 60
    val urgente = segundosRestantes <= 60

    Text(
        text = "%02d:%02d".format(minutos, segundos),
        style = MaterialTheme.typography.titleMedium,
        color = if (urgente) MaterialTheme.colorScheme.error else MentisPurpleLight
    )
}

@Composable
private fun OpcionesMultiple(pregunta: Pregunta, onSeleccionar: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        pregunta.opciones.forEach { opcion ->
            val seleccionada = pregunta.respuestaCandidato == opcion
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = if (seleccionada) MentisPurple.copy(alpha = 0.2f) else MentisBackground,
                        shape = RoundedCornerShape(12.dp)
                    )
                    .selectable(selected = seleccionada, onClick = { onSeleccionar(opcion) })
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                RadioButton(
                    selected = seleccionada,
                    onClick = { onSeleccionar(opcion) },
                    colors = RadioButtonDefaults.colors(selectedColor = MentisPurple)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(opcion, color = MentisOnSurface)
            }
        }
    }
}

@Composable
private fun RespuestaAbierta(pregunta: Pregunta, onCambiar: (String) -> Unit) {
    var texto by remember(pregunta.id) { mutableStateOf(pregunta.respuestaCandidato ?: "") }

    OutlinedTextField(
        value = texto,
        onValueChange = {
            texto = it
            onCambiar(it)
        },
        modifier = Modifier.fillMaxWidth().heightIn(min = 140.dp),
        placeholder = { Text("Escribe tu respuesta aquí...") },
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MentisPurple,
            unfocusedBorderColor = MentisSubtext,
            cursorColor = MentisPurple
        )
    )
}