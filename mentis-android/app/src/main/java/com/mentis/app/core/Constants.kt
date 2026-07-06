package com.mentis.app.core

object Constants {
    // Emulador Android → 10.0.2.2 apunta al localhost del PC
    // Celular físico → cambia por la IP del PC de William en la misma WiFi
    // Producción → URL de Railway (William la dará cuando despliegue)
    const val BASE_URL = "http://10.0.2.2:8000/"

    const val TOKEN_KEY = "jwt_token"
    const val DATASTORE_NAME = "mentis_prefs"
}
