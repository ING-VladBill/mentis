package com.mentis.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mentis.app.presentation.acceso.AccesoScreen
import com.mentis.app.presentation.examen.ExamenScreen
import com.mentis.app.presentation.finalizado.FinalizadoScreen
import com.mentis.app.presentation.instrucciones.InstruccionesScreen
import com.mentis.app.presentation.progreso.ProgresoScreen

@Composable
fun NavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(
        navController   = navController,
        startDestination = Screen.Acceso.route
    ) {
        // ── PANTALLA 1: Acceso por token (ALEX) ──
        composable(Screen.Acceso.route) {
            AccesoScreen(
                onAccesoExitoso = { estado ->
                    // Si ya tiene examen en curso, va directo; si no, a instrucciones
                    when (estado) {
                        "examen_en_curso" -> navController.navigate(Screen.Examen.route) {
                            popUpTo(Screen.Acceso.route) { inclusive = true }
                        }
                        else -> navController.navigate(Screen.Progreso.route) {
                            popUpTo(Screen.Acceso.route) { inclusive = true }
                        }
                    }
                }
            )
        }

        // ── PANTALLA 5: Progreso / Línea de tiempo (ALEX) ──
        composable(Screen.Progreso.route) {
            ProgresoScreen(
                onRendirExamen = {
                    navController.navigate(Screen.Instrucciones.route)
                },
                onCerrarSesion = {
                    navController.navigate(Screen.Acceso.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // ── PANTALLA 2: Instrucciones (HAROLD) ──
        composable(Screen.Instrucciones.route) {
            InstruccionesScreen(
                onComenzarExamen = {
                    navController.navigate(Screen.Examen.route) {
                        popUpTo(Screen.Instrucciones.route) { inclusive = true }
                    }
                }
            )
        }

        // ── PANTALLA 3: Examen (HAROLD) ──
        composable(Screen.Examen.route) {
            ExamenScreen(
                onExamenFinalizado = {
                    navController.navigate(Screen.Finalizado.route) {
                        popUpTo(Screen.Examen.route) { inclusive = true }
                    }
                }
            )
        }

        // ── PANTALLA 4: Finalizado (HAROLD) ──
        composable(Screen.Finalizado.route) {
            FinalizadoScreen(
                onVerProgreso = {
                    navController.navigate(Screen.Progreso.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}