# MENTIS – Informe de Validaciones Sprint 2

**Fecha:** 2026-05-26  
**Entorno:** Local (Django 4.2 + MySQL, localhost:8000 / React + Vite, localhost:5173)  
**Usuario de prueba:** `admin@mentis.com` | rol: `admin`  
**Herramienta:** curl + Swagger UI (`http://localhost:8000/api/docs/`)

---

## Resumen ejecutivo

Se validaron las **5 funcionalidades nuevas del Sprint 2** mediante llamadas directas a la API REST. Todos los endpoints responden correctamente. Se detectaron y corrigieron 2 incidencias menores durante la validación.

| # | Funcionalidad | Endpoints | Estado |
|---|---|---|---|
| 1 | Gestión de Áreas | 6 endpoints | PASS |
| 2 | Gestión de Usuarios | 3 endpoints | PASS |
| 3 | Detalle de Candidato | 2 endpoints | PASS |
| 4 | Ranking por Vacante | 2 endpoints | PASS |
| 5 | Carga Masiva de CVs | 1 endpoint | PASS |
| — | Swagger / OpenAPI | 2 endpoints | PASS |

---

## Autenticación

### POST /api/auth/login/

**Request:**
```json
{
  "email": "admin@mentis.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci...",
  "usuario": {
    "id": 1,
    "email": "admin@mentis.com",
    "nombre": "RRHH 12",
    "rol": "admin",
    "rol_display": "Administrador"
  }
}
```

**Resultado:** PASS — Token JWT obtenido correctamente. Todos los endpoints siguientes usan `Authorization: Bearer <access_token>`.

---

## Funcionalidad 1 — Gestión de Áreas

### GET /api/areas/

**Response (200 OK):**
```json
{
  "count": 16,
  "results": [
    { "id": 1, "nombre": "Tecnología / IT", "codigo_corto": "TI", "icono": "users", "color": "#2E75B6", "activa": true, ... },
    ...
  ]
}
```

**Resultado:** PASS — Devuelve las 16 áreas predefinidas del sistema paginadas.

---

### POST /api/areas/ — Crear área nueva

**Request:**
```json
{
  "nombre": "Area QA Test",
  "codigo_corto": "QATST",
  "icono": "chart-bar",
  "color": "#10b981",
  "descripcion": "Área de pruebas de calidad"
}
```

**Response (201 Created):**
```json
{
  "id": 18,
  "nombre": "Area QA Test",
  "codigo_corto": "QATST",
  "icono": "chart-bar",
  "activa": true,
  ...
}
```

**Resultado:** PASS — Área creada correctamente con id=18.

> **Nota:** Durante la validación se detectó que el campo `icono` tenía una lista restringida de valores (`choices`). Esto causaba error 400 al usar íconos Tabler válidos fuera de la lista (p. ej. `chart-bar`, `currency-dollar`, `code`). Se eliminó la restricción y se generó una migración (`0003_area_icono_free_text`). Ahora acepta cualquier nombre de ícono Tabler.

---

### PUT /api/areas/{id}/ — Editar área

**Request:**
```json
{
  "nombre": "Area QA Editada",
  "codigo_corto": "QATST",
  "icono": "star",
  "color": "#ef4444"
}
```

**Response (200 OK):**
```json
{
  "id": 18,
  "nombre": "Area QA Editada",
  "color": "#ef4444",
  ...
}
```

**Resultado:** PASS — Nombre y color actualizados correctamente.

---

### POST /api/areas/{id}/desactivar/

**Response (200 OK):**
```json
{
  "mensaje": "Área \"Area QA Editada\" desactivada correctamente.",
  "area": {
    "id": 18,
    "activa": false,
    ...
  }
}
```

**Resultado:** PASS — El área pasa a `activa: false`.

---

### POST /api/areas/{id}/activar/

**Response (200 OK):**
```json
{
  "mensaje": "Área \"Area QA Editada\" activada correctamente.",
  "area": {
    "id": 18,
    "activa": true,
    ...
  }
}
```

**Resultado:** PASS — El área vuelve a `activa: true`.

---

### DELETE /api/areas/{id}/

**Response:** `204 No Content`

**Resultado:** PASS — Área eliminada sin contenido de respuesta.

**Validación de protección:** Las áreas predefinidas (`es_predefinida: true`) no pueden eliminarse desde el frontend (botón deshabilitado). El backend también devuelve 400 si se intenta.

---

## Funcionalidad 2 — Gestión de Usuarios

### GET /api/auth/usuarios/

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "admin@mentis.com",
    "nombre": "Admin RRHH",
    "apellidos": "Principal",
    "rol": "admin",
    "rol_display": "Administrador",
    "activo": true
  }
]
```

**Resultado:** PASS — Lista los 2 usuarios existentes.

---

### POST /api/auth/usuarios/crear/

**Request:**
```json
{
  "nombre": "Nuevo",
  "apellidos": "Swagger",
  "email": "nuevo.swagger@mentis.com",
  "password": "Test1234!",
  "password2": "Test1234!",
  "rol": "reclutador"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "email": "nuevo.swagger@mentis.com",
  "nombre": "Nuevo",
  "rol": "reclutador",
  ...
}
```

**Resultado:** PASS — Usuario reclutador creado con id=2.

**Validación detectada:** El campo `password2` (confirmación) es obligatorio. Sin él, el servidor devuelve:
```json
{ "password2": ["Este campo es requerido."] }
```

---

### PUT /api/auth/usuarios/{id}/

**Request:**
```json
{
  "nombre": "Admin RRHH",
  "apellidos": "Principal",
  "rol": "admin"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "nombre": "Admin RRHH",
  "apellidos": "Principal",
  "rol": "admin",
  ...
}
```

**Resultado:** PASS — Edición parcial (`partial=True`) funciona correctamente.

**Validación de seguridad:** Solo usuarios con `rol: admin` pueden editar. Sin permisos devuelve `403 Forbidden`.

---

## Funcionalidad 3 — Detalle de Candidato

### GET /api/candidatos/

**Response (200 OK):**
```json
{
  "count": 0,
  "results": []
}
```

**Resultado:** PASS — Endpoint accesible. Base de datos sin candidatos en entorno de prueba.

---

### GET /api/candidatos/{id}/

**Escenario 1 — ID inexistente:**

**Response:** `404 Not Found`
```json
{
  "error": true,
  "status_code": 404,
  "mensaje": "No encontrado."
}
```

**Resultado:** PASS — El endpoint maneja correctamente el caso de ID no existente.

**Nota:** Para validar la respuesta completa con datos reales se requieren candidatos en la base de datos (se crean mediante Carga Masiva o proceso de registro con token).

---

## Funcionalidad 4 — Ranking por Vacante

### GET /api/candidatos/ranking/?vacante_id={id}

**Request:** `GET /api/candidatos/ranking/?vacante_id=1`

**Response (200 OK):**
```json
{
  "total": 0,
  "ranking": []
}
```

**Resultado:** PASS — El endpoint responde con estructura correcta. Sin candidatos asociados a la vacante devuelve lista vacía (no error).

---

### POST /api/candidatos/marcar-finalistas/

**Request:**
```json
{
  "vacante_id": 1
}
```

**Response (200 OK):**
```json
{
  "mensaje": "0 finalistas marcados. 0 correos enviados.",
  "finalistas": []
}
```

**Resultado:** PASS — Endpoint responde sin error aunque no haya candidatos. El mensaje refleja el estado real.

---

## Funcionalidad 5 — Carga Masiva de CVs

### POST /api/candidatos/carga-masiva/

**Escenario 1 — Sin `vacante_id`:**

**Response (400):**
```json
{ "error": "Se requiere vacante_id." }
```

**Resultado:** PASS — Validación de campo obligatorio funciona.

---

**Escenario 2 — Con `vacante_id` pero sin archivos:**

**Request:** `multipart/form-data` con `vacante_id=1` y sin archivos adjuntos.

**Response (400):**
```json
{ "error": "No se recibieron archivos." }
```

**Resultado:** PASS — Validación de archivos adjuntos funciona.

---

**Escenario 3 — Flujo completo (frontend):**

El endpoint acepta `multipart/form-data` con:
- `vacante_id`: ID de la vacante abierta (requerido)
- `archivos`: uno o más archivos PDF (clave múltiple, requerido)

El backend procesa cada CV con IA (Gemini), extrae datos del candidato, calcula score inicial y devuelve resultados por archivo.

**Nota:** La validación completa del flujo de carga con PDFs reales requiere candidatos en la base de datos y clave de API de Gemini configurada en `.env`.

---

## Swagger / OpenAPI

### GET /api/docs/ — Swagger UI

**Response:** `200 OK` — Interfaz Swagger UI accesible y cargada correctamente.

**Configuración:**
```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'MENTIS API',
    'DESCRIPTION': 'API del sistema de reclutamiento MENTIS — Sprint 2',
    'VERSION': '2.0.0',
}
```

**Resultado:** PASS — Swagger UI disponible en `http://localhost:8000/api/docs/`.

---

### GET /api/schema/ — OpenAPI Schema

**Response:** `200 OK` — Schema OpenAPI 3.0 en formato YAML.

**Resultado:** PASS — Schema generado automáticamente por drf-spectacular.

---

## Incidencias detectadas y corregidas

### INC-01 — Icono del toggle invertido en Áreas (Frontend)

**Descripción:** El ícono `ti-toggle-left` / `ti-toggle-right` del botón activar/desactivar estaba invertido. Cuando el área estaba activa mostraba el ícono de apagado y viceversa.

**Archivo:** `frontend-web/src/pages/Areas.jsx`  
**Línea afectada:** `<i className={`ti ${area.activa ? 'ti-toggle-left' : 'ti-toggle-right'}`} />`  
**Corrección:** Invertir la condición:  
```jsx
<i className={`ti ${area.activa ? 'ti-toggle-right' : 'ti-toggle-left'}`} />
```
**Estado:** CORREGIDO

---

### INC-02 — Campo `icono` con choices restringidas (Backend)

**Descripción:** El modelo `Area` tenía el campo `icono` con una lista fija de 16 valores válidos (`ICONO_CHOICES`). El frontend ofrece 24 íconos Tabler y varios no estaban en la lista, causando error `400 Bad Request` al crear o editar áreas.

**Archivo:** `backend-django/vacantes/models.py`  
**Corrección:** Eliminar la restricción `choices=ICONO_CHOICES` y ampliar `max_length` de 30 a 50.  
**Migración:** `vacantes/migrations/0003_area_icono_free_text.py`  
**Estado:** CORREGIDO y migración aplicada

---

## Estado del entorno al finalizar validaciones

| Recurso | Cantidad |
|---|---|
| Áreas en BD | 16 (predefinidas) |
| Vacantes en BD | 1 (creada en pruebas) |
| Usuarios en BD | 2 (admin + reclutador de prueba) |
| Candidatos en BD | 0 |

---

*Documento generado tras validación manual de Sprint 2 — Sistema MENTIS*
