package com.mentis.app.presentation.finalizado

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mentis.app.presentation.theme.*

@Composable
fun FinalizadoScreen(
    onVerProgreso: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MentisBackground)
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = MentisPurpleLight,
                modifier = Modifier.size(72.dp)
            )

            Text(
                text = "¡Examen finalizado!",
                style = MaterialTheme.typography.headlineSmall,
                color = MentisOnSurface,
                textAlign = TextAlign.Center
            )

            Text(
                text = "Tus respuestas fueron registradas correctamente. " +
                        "El equipo de reclutamiento revisará tu examen y se pondrá en " +
                        "contacto contigo con los resultados del proceso.",
                style = MaterialTheme.typography.bodyMedium,
                color = MentisSubtext,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = onVerProgreso,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
            ) {
                Text(
                    text = "Ver mi progreso",
                    style = MaterialTheme.typography.titleMedium,
                    color = MentisOnPrimary
                )
            }
        }
    }
}