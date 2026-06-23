package com.mentis.app.presentation.progreso

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mentis.app.domain.model.Fase
import com.mentis.app.presentation.theme.*

@Composable
fun ProgresoScreen(
    onRendirExamen: () -> Unit,
    onCerrarSesion: () -> Unit,
    viewModel: ProgresoViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MentisBackground)
    ) {
        when {
            uiState.isLoading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = MentisPurple
                )
            }

            uiState.errorMessage != null -> {
                ErrorContent(
                    mensaje = uiState.errorMessage!!,
                    onReintentar = { viewModel.cargarProgreso() },
                    onCerrarSesion = {
                        viewModel.cerrarSesion()
                        onCerrarSesion()
                    }
                )
            }

            uiState.progreso != null -> {
                val progreso = uiState.progreso!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 24.dp, vertical = 32.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    Text(
                        text = "Hola, ${progreso.candidato.split(" ").first()}",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MentisOnSurface
                    )
                    Text(
                        text = progreso.vacante ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MentisPurpleLight
                    )

                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = MentisPurple.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = progreso.etiquetaEstado,
                            style = MaterialTheme.typography.labelSmall,
                            color = MentisPurpleLight,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }

                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MentisSurface)
                    ) {
                        Text(
                            text = progreso.mensaje,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MentisOnSurface,
                            modifier = Modifier.padding(16.dp)
                        )
                    }

                    Text(
                        text = "Tu progreso",
                        style = MaterialTheme.typography.titleLarge,
                        color = MentisOnSurface
                    )
                    LineaDeTiempo(fases = progreso.fases)

                    if (progreso.accionDisponible.habilitada) {
                        Button(
                            onClick = onRendirExamen,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
                        ) {
                            Text(
                                text = progreso.accionDisponible.titulo ?: "Continuar",
                                color = MentisOnPrimary,
                                style = MaterialTheme.typography.titleLarge
                            )
                        }
                    }

                    TextButton(
                        onClick = {
                            viewModel.cerrarSesion()
                            onCerrarSesion()
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(text = "Cerrar sesión", color = MentisSubtext)
                    }
                }
            }
        }
    }
}

@Composable
private fun LineaDeTiempo(fases: List<Fase>) {
    Column(verticalArrangement = Arrangement.spacedBy(0.dp)) {
        fases.forEachIndexed { index, fase ->
            FaseItem(fase = fase, esUltima = index == fases.lastIndex)
        }
    }
}

@Composable
private fun FaseItem(fase: Fase, esUltima: Boolean) {
    val iconoColor = when (fase.estado) {
        "completada" -> FaseCompletada
        "actual"     -> FaseActual
        "bloqueada"  -> FaseBloqueada
        else         -> FasePendiente
    }

    Row(modifier = Modifier.fillMaxWidth()) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(40.dp)
        ) {
            when (fase.estado) {
                "completada" -> Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = fase.estado,
                    tint = iconoColor,
                    modifier = Modifier.size(28.dp)
                )
                "actual" -> Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = fase.estado,
                    tint = iconoColor,
                    modifier = Modifier.size(28.dp)
                )
                "bloqueada" -> Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = fase.estado,
                    tint = iconoColor,
                    modifier = Modifier.size(28.dp)
                )
                else -> Canvas(modifier = Modifier.size(28.dp)) {
                    drawCircle(
                        color = iconoColor,
                        radius = size.minDimension / 2,
                        style = Stroke(width = 4f)
                    )
                }
            }

            if (!esUltima) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(48.dp)
                        .clip(CircleShape)
                        .background(
                            if (fase.estado == "completada") FaseCompletada.copy(alpha = 0.5f)
                            else MentisSubtext.copy(alpha = 0.3f)
                        )
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.padding(bottom = if (esUltima) 0.dp else 8.dp)) {
            Text(
                text = fase.titulo,
                style = MaterialTheme.typography.bodyLarge,
                color = if (fase.estado == "bloqueada") MentisSubtext else MentisOnSurface
            )
            Text(
                text = fase.descripcion,
                style = MaterialTheme.typography.bodyMedium,
                color = MentisSubtext
            )
        }
    }
}

@Composable
private fun BoxScope.ErrorContent(
    mensaje: String,
    onReintentar: () -> Unit,
    onCerrarSesion: () -> Unit
) {
    Column(
        modifier = Modifier
            .align(Alignment.Center)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = mensaje,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodyLarge
        )
        Button(
            onClick = onReintentar,
            colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
        ) {
            Text("Reintentar", color = MentisOnPrimary)
        }
        if (mensaje.contains("sesión", ignoreCase = true) ||
            mensaje.contains("token", ignoreCase = true)
        ) {
            TextButton(onClick = onCerrarSesion) {
                Text("Volver al inicio", color = MentisSubtext)
            }
        }
    }
}