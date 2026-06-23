package com.mentis.app.presentation.navigation

sealed class Screen(val route: String) {
    object Acceso       : Screen("acceso")
    object Progreso     : Screen("progreso")

    // Pantallas de Harold (examen)
    object Instrucciones : Screen("instrucciones")
    object Examen        : Screen("examen")
    object Finalizado    : Screen("finalizado")
}
