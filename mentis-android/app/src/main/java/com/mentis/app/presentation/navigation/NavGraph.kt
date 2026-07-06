package com.mentis.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mentis.app.presentation.acceso.AccesoScreen
import com.mentis.app.presentation.examen.ExamenScreen
import com.mentis.app.presentation.finalizado.FinalizadoScreen
import com.mentis.app.presentation.home.HomeScreen
import com.mentis.app.presentation.instrucciones.InstruccionesScreen
import com.mentis.app.presentation.postular.PostularScreen
import com.mentis.app.presentation.progreso.ProgresoScreen
import com.mentis.app.presentation.vacantes.VacantesScreen

@Composable
fun NavGraph(navController: NavHostController = rememberNavController()) {
    NavHost(
        navController    = navController,
        startDestination = Screen.Home.route
    ) {
        // ── PANTALLA 0: Inicio — "Postula aquí" / "Rendir examen" ──
        composable(Screen.Home.route) {
            HomeScreen(
                onPostular     = { navController.navigate(Screen.Vacantes.route) },
                onRendirExamen = { navController.navigate(Screen.Acceso.route) }
            )
        }

        // ── Lista pública de vacantes (sin login) ──
        composable(Screen.Vacantes.route) {
            VacantesScreen(
                onSeleccionarVacante = { codigo ->
                    navController.navigate(Screen.Postular.crearRuta(codigo))
                },
                onVolver = { navController.popBackStack() }
            )
        }

        // ── Formulario de postulación pública (sin login) ──
        composable(
            route = Screen.Postular.route,
            arguments = listOf(navArgument("codigo") { type = NavType.StringType })
        ) { backStackEntry ->
            val codigo = backStackEntry.arguments?.getString("codigo").orEmpty()
            PostularScreen(
                codigo = codigo,
                onPostulacionEnviada = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                },
                onVolver = { navController.popBackStack() }
            )
        }

        // ── PANTALLA 1: Acceso por código (ALEX) — solo desde "Rendir examen" ──
        composable(Screen.Acceso.route) {
            AccesoScreen(
                onAccesoExitoso = { estado ->
                    when (estado) {
                        "examen_en_curso" -> navController.navigate(Screen.Examen.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
                        }
                        else -> navController.navigate(Screen.Progreso.route) {
                            popUpTo(Screen.Home.route) { inclusive = true }
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
                    navController.navigate(Screen.Home.route) {
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