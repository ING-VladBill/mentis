package com.mentis.app.presentation.vacantes

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mentis.app.domain.model.VacantePublica
import com.mentis.app.presentation.theme.*

@Composable
fun VacantesScreen(
    onSeleccionarVacante: (String) -> Unit,
    onVolver: () -> Unit,
    viewModel: VacantesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(modifier = Modifier.fillMaxSize().background(MentisBackground)) {
        Column(modifier = Modifier.fillMaxSize()) {
            TopAppBar(
                title = { Text("Vacantes disponibles", color = MentisOnSurface) },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = MentisOnSurface)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MentisSurface)
            )

            when {
                uiState.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MentisPurple)
                }

                uiState.errorMessage != null -> Box(
                    Modifier.fillMaxSize().padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(uiState.errorMessage!!, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.cargarVacantes() },
                            colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
                        ) {
                            Text("Reintentar", color = MentisOnPrimary)
                        }
                    }
                }

                uiState.vacantes.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        "No hay vacantes abiertas por ahora. Vuelve pronto.",
                        color = MentisSubtext,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(24.dp)
                    )
                }

                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.vacantes) { vacante ->
                        VacanteCard(vacante = vacante, onClick = { onSeleccionarVacante(vacante.codigo) })
                    }
                }
            }
        }
    }
}

@Composable
private fun VacanteCard(vacante: VacantePublica, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MentisSurface),
        onClick = onClick
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(vacante.titulo, style = MaterialTheme.typography.titleLarge, color = MentisOnSurface)
            Text("${vacante.area} · ${vacante.nivel}", style = MaterialTheme.typography.bodyMedium, color = MentisPurpleLight)
            Text(
                "${vacante.modalidad} · ${vacante.ciudad} · ${vacante.tipoContrato}",
                style = MaterialTheme.typography.bodySmall,
                color = MentisSubtext
            )
            if (vacante.salarioMinimo != null && vacante.salarioMaximo != null) {
                Text(
                    "${vacante.moneda} ${vacante.salarioMinimo} – ${vacante.salarioMaximo}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MentisSubtext
                )
            }
        }
    }
}