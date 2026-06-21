package com.mentis.usuario.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    // Orígenes extra (Vercel, etc.) separados por coma desde la variable CORS_EXTRA_ORIGINS.
    @Value("${CORS_EXTRA_ORIGINS:}")
    private String corsExtraOrigins;

    public WebConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/usuario/examen/**", "/api/usuario/progreso/**");
        // /api/usuario/auth/** y /health quedan públicos
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Orígenes fijos de desarrollo
        java.util.List<String> origins = new java.util.ArrayList<>(java.util.List.of(
                "http://localhost:5173",   // frontend admin (dev)
                "http://localhost:5174",   // frontend postulante (dev)
                "http://localhost:3000"
        ));
        // Orígenes extra desde variable de entorno (producción)
        if (corsExtraOrigins != null && !corsExtraOrigins.isBlank()) {
            for (String o : corsExtraOrigins.split(",")) {
                if (!o.trim().isEmpty()) origins.add(o.trim());
            }
        }

        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(new String[0]))
                // Acepta cualquier URL de Vercel del equipo y de Railway
                .allowedOriginPatterns("https://mentis*.vercel.app", "https://*.up.railway.app")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}