package com.mentis.app.presentation.acceso

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mentis.app.presentation.theme.*

@Composable
fun AccesoScreen(
    onAccesoExitoso: (estado: String) -> Unit,
    viewModel: AccesoViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var tokenInput by remember { mutableStateOf("") }
    val keyboard = LocalSoftwareKeyboardController.current

    // Navegar cuando el acceso es exitoso
    LaunchedEffect(uiState.exitoEstado) {
        uiState.exitoEstado?.let { estado ->
            onAccesoExitoso(estado)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MentisBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Logo / Título
            Text(
                text = "MENTIS",
                style = MaterialTheme.typography.headlineLarge,
                color = MentisPurpleLight
            )
            Text(
                text = "Sistema de Reclutamiento con IA",
                style = MaterialTheme.typography.bodyMedium,
                color = MentisSubtext,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Card de acceso
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MentisSurface)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Ingresa tu token de acceso",
                        style = MaterialTheme.typography.titleLarge,
                        color = MentisOnSurface
                    )
                    Text(
                        text = "Encuéntralo en el correo que recibiste del equipo de reclutamiento.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MentisSubtext
                    )

                    OutlinedTextField(
                        value = tokenInput,
                        onValueChange = {
                            tokenInput = it
                            viewModel.limpiarError()
                        },
                        label = { Text("Token UUID") },
                        placeholder = { Text("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        isError = uiState.errorMessage != null,
                        supportingText = {
                            uiState.errorMessage?.let {
                                Text(text = it, color = MaterialTheme.colorScheme.error)
                            }
                        },
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = {
                            keyboard?.hide()
                            viewModel.acceder(tokenInput)
                        }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor   = MentisPurple,
                            unfocusedBorderColor = MentisSubtext,
                            focusedLabelColor    = MentisPurple,
                            cursorColor          = MentisPurple
                        )
                    )

                    Button(
                        onClick = {
                            keyboard?.hide()
                            viewModel.acceder(tokenInput)
                        },
                        enabled  = !uiState.isLoading && tokenInput.isNotBlank(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape  = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color    = MentisOnPrimary,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text  = "Acceder",
                                style = MaterialTheme.typography.titleLarge,
                                color = MentisOnPrimary
                            )
                        }
                    }
                }
            }
        }
    }
}
