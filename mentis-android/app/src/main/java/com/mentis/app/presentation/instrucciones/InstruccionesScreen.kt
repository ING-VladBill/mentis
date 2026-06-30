package com.mentis.app.presentation.instrucciones

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mentis.app.presentation.theme.*

@Composable
fun InstruccionesScreen(
    onComenzarExamen: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MentisBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Text(
                text = "Antes de comenzar",
                style = MaterialTheme.typography.headlineSmall,
                color = MentisOnSurface
            )
            Text(
                text = "Lee con atención. Una vez que inicies, el cronómetro no se detiene.",
                style = MaterialTheme.typography.bodyMedium,
                color = MentisSubtext
            )

            InstruccionItem(
                icono = Icons.Default.AccessTime,
                titulo = "Tiempo límite",
                descripcion = "El examen tiene una duración fija. Cuando el tiempo se agote, se enviará automáticamente."
            )
            InstruccionItem(
                icono = Icons.Default.CheckCircle,
                titulo = "Auto-guardado",
                descripcion = "Cada respuesta se guarda al instante. Puedes cerrar la app y retomar donde quedaste."
            )
            InstruccionItem(
                icono = Icons.Default.Warning,
                titulo = "Política de silencio",
                descripcion = "No verás tu calificación al finalizar. El resultado lo comunicará el equipo de reclutamiento."
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = onComenzarExamen,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MentisPurple)
            ) {
                Text(
                    text = "Comenzar examen",
                    style = MaterialTheme.typography.titleLarge,
                    color = MentisOnPrimary
                )
            }
        }
    }
}

@Composable
private fun InstruccionItem(
    icono: androidx.compose.ui.graphics.vector.ImageVector,
    titulo: String,
    descripcion: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MentisSurface)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = icono,
                contentDescription = null,
                tint = MentisPurpleLight,
                modifier = Modifier.size(28.dp)
            )
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = titulo,
                    style = MaterialTheme.typography.titleMedium,
                    color = MentisOnSurface
                )
                Text(
                    text = descripcion,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MentisSubtext
                )
            }
        }
    }
}