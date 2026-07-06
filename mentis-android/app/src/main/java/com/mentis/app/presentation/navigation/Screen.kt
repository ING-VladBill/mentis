package com.mentis.app.presentation.navigation

sealed class Screen(val route: String) {
    object Home     : Screen("home")
    object Acceso   : Screen("acceso")
    object Progreso : Screen("progreso")

    // Postulación pública (sin código, sin login)
    object Vacantes : Screen("vacantes")
    object Postular : Screen("postular/{codigo}") {
        fun crearRuta(codigo: String) = "postular/$codigo"
    }

    // Pantallas de Harold (examen)
    object Instrucciones : Screen("instrucciones")
    object Examen        : Screen("examen")
    object Finalizado    : Screen("finalizado")
}