package com.mentis.app.core

object Constants {
    // Backend Spring Boot (login candidato + examen)
    // Emulador → 10.0.2.2 apunta al localhost del PC
    // Celular físico → cambia por la IP del PC de William en la misma WiFi
    const val BASE_URL = "http://10.0.2.2:8080/"

    // Backend Django (vacantes + postulación pública, sin login)
    // Puerto por defecto de "python manage.py runserver" es 8000.
    // Si William corre Django en otro puerto, cambia SOLO este valor.
    const val DJANGO_BASE_URL = "http://10.0.2.2:8000/"

    const val TOKEN_KEY = "jwt_token"
    const val DATASTORE_NAME = "mentis_prefs"
}