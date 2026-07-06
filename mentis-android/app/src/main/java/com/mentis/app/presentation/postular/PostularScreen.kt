package com.mentis.app.presentation.postular

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mentis.app.presentation.theme.*

@Composable
fun PostularScreen(
    codigo: String,
    onPostulacionEnviada: () -> Unit,
    onVolver: () -> Unit,
    viewModel: PostularViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    var nombre by remember { mutableStateOf("") }
    var apellidoPaterno by remember { mutableStateOf("") }
    var apellidoMaterno by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telefono by remember { mutableStateOf("") }
    var ciudad by remember { mutableStateOf("") }
    var linkedin by remember { mutableStateOf("") }
    var disponibilidad by remember { mutableStateOf("") }
    var aceptaModalidad by remember { mutableStateOf(false) }
    var aceptaCiudad by remember { mutableStateOf(false) }
    var cvUri by remember { mutableStateOf<Uri?>(null) }
    var cvNombre by remember { mutableStateOf<String?>(null) }

    val seleccionarPdf = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            cvUri = uri
            cvNombre = uri.lastPathSegment ?: "cv.pdf"
        }
    }

    LaunchedEffect(uiState.mensajeExito) {
        if (uiState.mensajeExito != null) onPostulacionEnviada()
    }

    Box(modifier = Modifier.fillMaxSize().background(MentisBackground)) {
        Column(modifier = Modifier.fillMaxSize()) {
            TopAppBar(
                title = { Text("Postular a $codigo", color = MentisOnSurface) },
                navigationIcon = {
                    IconButton(onClick = onVolver) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = MentisOnSurface)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MentisSurface)
            )

            Column(
                modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                uiState.errorMessage?.let {
                    Text(it, color = MaterialTheme.colorScheme.error)
                }

                CampoTexto("Nombre*", nombre) { nombre = it; viewModel.limpiarError() }
                CampoTexto("Apellido paterno*", apellidoPaterno) { apellidoPaterno = it; viewModel.limpiarError() }
                CampoTexto("Apellido materno", apellidoMaterno) { apellidoMaterno = it }
                CampoTexto("Correo*", email, KeyboardType.Email) { email = it; viewModel.limpiarError() }
                CampoTexto("Teléfono", telefono, KeyboardType.Phone) { telefono = it }
                CampoTexto("Ciudad", ciudad) { ciudad = it }
                CampoTexto("LinkedIn", linkedin) { linkedin = it }
                CampoTexto("Disponibilidad (ej: inmediata)", disponibilidad) { disponibilidad = it }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = aceptaModalidad, onCheckedChange = { aceptaModalidad = it }, colors = CheckboxDefaults.colors(checkedColor = MentisPurple))
                    Text("Acepto la modalidad de trabajo de esta vacante", color = MentisOnSurface)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = aceptaCiudad, onCheckedChange = { aceptaCiudad = it }, colors = CheckboxDefaults.colors(checkedColor = MentisPurple))
                    Text("Acepto la ubicación de esta vacante", color = MentisOnSurface)
                }

                OutlinedButton(
                    onClick = { seleccionarPdf.launch("application/pdf") },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(if (cvUri != null) Icons.Default.CheckCircle else Icons.Default.AttachFile, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(cvNombre ?: "Adjuntar CV (PDF)*")
                }

                Spacer(Modifier.height(8.dp))

                Button(
                    onClick = {
                        viewModel.postular(
                            codigo, nombre, apellidoPaterno, apellidoMaterno, email, telefono,
                            ciudad, linkedin, pretensionSalarial = null, disponibilidad = disponibilidad,
                            aceptaModalidad = aceptaModalidad, aceptaCiudad = aceptaCiudad, cvUri = cvUri
                        )
                    },
                    enabled = !uiState.isLoading,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MentisOnPrimary, strokeWidth = 2.dp)
                    } else {
                        Text("Enviar postulación", color = MentisOnPrimary)
                    }
                }
            }
        }
    }
}

@Composable
private fun CampoTexto(
    label: String,
    value: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    onValueChange: (String) -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor   = MentisPurple,
            unfocusedBorderColor = MentisSubtext,
            focusedLabelColor    = MentisPurple,
            cursorColor          = MentisPurple
        )
    )
}