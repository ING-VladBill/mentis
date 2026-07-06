package com.mentis.app.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mentis.app.presentation.theme.*

@Composable
fun HomeScreen(
    onPostular: () -> Unit,
    onRendirExamen: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize().background(MentisBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Text("MENTIS", style = MaterialTheme.typography.headlineLarge, color = MentisPurpleLight)
            Text(
                "Sistema de Reclutamiento con IA",
                style = MaterialTheme.typography.bodyMedium,
                color = MentisSubtext,
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(16.dp))

            HomeOptionCard(
                titulo = "Postula aquí",
                descripcion = "Explora las vacantes abiertas y postula con tu CV. No necesitas ningún código.",
                textoBoton = "Ver vacantes",
                onClick = onPostular
            )

            HomeOptionCard(
                titulo = "Rendir examen",
                descripcion = "¿Ya postulaste y te llegó un correo? Ingresa aquí con tu código de acceso.",
                textoBoton = "Ingresar código",
                onClick = onRendirExamen
            )
        }
    }
}

@Composable
private fun HomeOptionCard(
    titulo: String,
    descripcion: String,
    textoBoton: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MentisSurface)
    ) {
        Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(titulo, style = MaterialTheme.typography.titleLarge, color = MentisOnSurface)
            Text(descripcion, style = MaterialTheme.typography.bodyMedium, color = MentisSubtext)

            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
            ) {
                Text(textoBoton, style = MaterialTheme.typography.titleMedium, color = MentisOnPrimary)
            }
        }
    }
}