# MENTIS — Módulo Usuario (Spring Boot)

Backend del módulo Usuario: exámenes técnicos generados y calificados por IA (Gemini),
con auditoría básica y ranking automático. Comparte la base de datos MySQL con el
backend Django del módulo Administración.

## Regla de oro
**Django es el dueño del esquema.** Este proyecto tiene `ddl-auto=none`: nunca crea
ni modifica tablas. Antes de arrancar, aplica las migraciones de Django (paso 1).

## Setup

### 1. Actualizar el esquema en Django (UNA VEZ)
Reemplaza `backend-django/evaluaciones/models.py` con el archivo
`django-update/evaluaciones_models.py` incluido en esta entrega, y corre:
```
python manage.py makemigrations evaluaciones
python manage.py migrate
```

### 2. Configurar el .env
Copia `.env.example` como `.env` (junto al pom.xml) y completa:
```
DB_NAME=mentis_db
DB_USER=root
DB_PASSWORD=
GEMINI_API_KEY=AIza...
JWT_SECRET=un-secreto-de-32-caracteres-minimo
```

### 3. Arrancar
```
mvn spring-boot:run
```
Corre en http://localhost:8080. Probar: `GET /api/usuario/health`

## Flujo del examen

```
1. Candidato recibe correo con link único (lo envía Django al aprobar su CV)
2. POST /api/usuario/auth/acceso  { "token": "<uuid del link>" }
   → valida el token (48h), devuelve JWT + datos del candidato
3. POST /api/usuario/examen/iniciar   (Bearer JWT)
   → 1ra vez: Gemini genera 10 preguntas personalizadas (6 MC + 4 abiertas)
   → marca inicio, arranca el timer de 45 min
4. POST /api/usuario/examen/respuesta { "preguntaId": 1, "respuesta": "..." }
   → guardado incremental: el candidato puede retomar si se interrumpe
5. POST /api/usuario/examen/evento    { "tipo": "perdida_foco", "detalle": "..." }
   → auditoría básica (el front lo llama al detectar el evento)
6. POST /api/usuario/examen/finalizar
   → MC ya calificadas + Gemini califica las abiertas en batch
   → nota sobre 20, aprueba si >= nota_minima de la vacante (default 13)
   → actualiza candidato (score_examen, estado, score_final) y ranking
   → invalida el token (un examen, un uso)
   → NO revela la nota (política de silencio profesional)
7. GET /api/usuario/examen → estado/retomar (devuelve segundos_restantes)
```

Si el tiempo se agota, el examen se autofinaliza con las respuestas guardadas.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET  | /api/usuario/health | — | Health check |
| POST | /api/usuario/auth/acceso | — | Canjea token UUID por JWT |
| POST | /api/usuario/examen/iniciar | JWT | Genera (1ra vez) e inicia |
| GET  | /api/usuario/examen | JWT | Estado / retomar |
| POST | /api/usuario/examen/respuesta | JWT | Guarda una respuesta |
| POST | /api/usuario/examen/finalizar | JWT | Califica y cierra |
| POST | /api/usuario/examen/evento | JWT | Registra evento auditoría |

Tipos de evento de auditoría: `perdida_foco`, `cambio_ventana`, `copy_paste`,
`click_derecho`, `devtools`, `inactividad`, `otro`.

## Notas técnicas
- Los UUID de Django se guardan SIN guiones en MySQL: el AuthService los normaliza.
- Django guarda fechas en UTC: todo el módulo opera en UTC (connectionTimeZone=UTC).
- La respuesta correcta NUNCA viaja al frontend (PreguntaDTO la excluye).
- El score final usa la misma fórmula renormalizada de Django:
  (CV×0.25 + Examen×0.40 + Entrevista×0.35) / pesos_presentes.
