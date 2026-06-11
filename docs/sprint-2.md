# Sprint 2 - Autenticación + Análisis de CV con IA

**Duración:** 7 días  
**Estado:** 🟢 En progreso  
**Objetivo:** Implementar autenticación JWT con roles, integración de IA para análisis de CV con Google Gemini, y actualización del frontend para compatibilidad con el nuevo backend

## 🎯 Objetivos del Sprint

- [x] Sistema de autenticación JWT con roles de usuario
- [x] Modelo de usuario personalizado con email como identificador
- [x] Sistema de áreas como FK dinámica en vacantes
- [x] Análisis automático de CV con Google Gemini
- [x] Sistema de correos automáticos para candidatos
- [x] Frontend con login, rutas protegidas y dark/light mode
- [x] Botón de análisis de CV con IA en lista de candidatos
- [x] Inyección de datos de áreas predefinidas

## 📋 Tareas Detalladas

### Backend (Django)

#### Autenticación
- [x] Instalar `djangorestframework-simplejwt`
- [x] Modelo `Usuario` personalizado con `AbstractBaseUser`
- [x] Roles: `admin`, `reclutador`, `evaluador`, `gerente`
- [x] `USERNAME_FIELD = 'email'`
- [x] Endpoints: `login`, `logout`, `refresh`, `perfil`, `validar-token`
- [x] Blacklist de refresh tokens al hacer logout
- [x] Tokens de acceso único para candidatos via correo

#### Vacantes
- [x] Modelo `Area` como FK dinámica (reemplaza campo `area` de texto libre)
- [x] Código de vacante generado automáticamente: `{AREA}-{AÑO}-{NNN}`
- [x] Campos nuevos: `industria`, `requisitos_deseables`, `conocimientos_especificos`
- [x] Campos de configuración IA: `score_cv_minimo`, `nota_minima_examen`, `top_candidatos_finalistas`
- [x] Respuesta paginada en todos los endpoints de listado
- [x] Endpoint `GET /api/areas/activas/` para poblar selects del frontend
- [x] Comando `python manage.py cargar_areas` para inyección de datos

#### Candidatos
- [x] Campos renombrados: `anios_experiencia`, `linkedin`, `github`, `nivel_educativo`
- [x] Campos nuevos: `universidad`, `cargo_actual`, `empresa_actual`, `habilidades_declaradas`, `portfolio`
- [x] 15 estados del proceso: `postulado`, `cv_analizando`, `cv_aprobado`, `cv_rechazado`, `examen_pendiente`, `examen_en_curso`, `examen_aprobado`, `examen_rechazado`, `entrevista_pendiente`, `entrevista_en_curso`, `entrevista_completada`, `finalista`, `entrevista_presencial`, `contratado`, `descartado`
- [x] Endpoint `POST /api/candidatos/{id}/analizar/` para análisis con IA
- [x] Endpoint `GET /api/candidatos/ranking/?vacante_id=X`
- [x] `score_cv` y `clasificacion_ia` guardados en el modelo

#### IA y correos
- [x] Integración con Google Gemini (`gemini-2.5-flash`)
- [x] Extracción de texto de PDF con PyPDF2 y pdfminer
- [x] Análisis de compatibilidad CV vs requisitos de la vacante
- [x] Clasificación: `altamente_recomendado`, `recomendado`, `requiere_revision`, `no_apto`
- [x] Correo automático al candidato cuando aprueba el filtro de CV
- [x] Configurar variables de entorno: `GEMINI_API_KEY`, `EMAIL_HOST_USER`

### Frontend (React)

#### Autenticación
- [x] Reemplazar `api.js` con interceptores JWT (request + response)
- [x] Refresh automático de token al recibir 401
- [x] Página `Login.jsx` con formulario email/contraseña
- [x] Logo como botón de toggle dark/light mode en Login
- [x] Componente `ProtectedRoute.jsx` para guardar rutas
- [x] Logout funcional que invalida el refresh token en el backend
- [x] Usuario real (nombre, rol, iniciales) leído desde localStorage

#### Actualización de formularios
- [x] `VacanteForm.jsx`: eliminar campo `codigo` (ahora automático)
- [x] `VacanteForm.jsx`: campo `area` como select dinámico desde `GET /api/areas/activas/`
- [x] `VacanteForm.jsx`: campos nuevos del Sprint 2 (industria, score mínimo, etc.)
- [x] `CandidatoForm.jsx`: renombrar campos (`anios_experiencia`, `linkedin`, `github`, `nivel_educativo`)
- [x] `CandidatoForm.jsx`: corrección lectura vacantes abiertas (`r.data.vacantes`)
- [x] `CandidatoForm.jsx`: campos nuevos (universidad, cargo actual, habilidades declaradas)

#### Listas
- [x] `VacantesList.jsx`: soporte para respuesta paginada (`data.results || data`)
- [x] `CandidatosList.jsx`: soporte para respuesta paginada (`data.results || data`)
- [x] `CandidatosList.jsx`: 15 estados con colores y badges diferenciados
- [x] `CandidatosList.jsx`: animación de pulso en estado `cv_analizando`
- [x] `CandidatosList.jsx`: botón "Analizar IA" con optimistic update y spinner
- [x] Toasts de éxito/error con `react-hot-toast`

#### App.jsx
- [x] Ruta `/` redirige a `/login` o `/vacantes` según si hay token
- [x] `ProtectedRoute` aplicado en cada ruta individual
- [x] `Toaster` configurado globalmente con estilos dark/light
- [x] Sidebar con badge Sprint 2 y barra de progreso

### Base de Datos
- [x] Migraciones para modelo `Usuario` personalizado
- [x] Migraciones para modelo `Area`
- [x] Migraciones para nuevos campos de `Vacante` y `Candidato`
- [x] Ejecutar `python manage.py cargar_areas` para datos iniciales
- [x] Crear superusuario con `python manage.py createsuperuser`

## 📦 Entregables

- ✅ Sistema JWT con login, logout y refresh automático
- ✅ Modelo de usuario con roles operativo
- ✅ Áreas como FK con inyección de datos
- ✅ Análisis de CV con Google Gemini funcionando
- ✅ Frontend actualizado y compatible con Sprint 2
- ✅ Rutas protegidas con redirección al login
- ✅ Dark/light mode con persistencia en localStorage

## 🧪 Criterios de Aceptación

1. El login con email y contraseña devuelve tokens JWT y redirige al dashboard
2. Sin token, cualquier ruta redirige automáticamente a `/login`
3. El token se refresca automáticamente al expirar sin cerrar sesión
4. Puedo crear una vacante seleccionando el área desde un dropdown dinámico
5. El código de la vacante se genera automáticamente al guardar
6. El botón "Analizar IA" procesa el CV y actualiza el estado del candidato
7. Si el candidato aprueba el score mínimo, recibe un correo automático
8. El dark/light mode persiste al recargar la página

## 🚀 Comandos de Inicio

```bash
# Backend
cd backend-django
venv\Scripts\activate
python manage.py runserver

# Frontend
cd frontend-web
npm run dev
```

## ⚙️ Variables de entorno requeridas (.env)

```
SECRET_KEY=clave-secreta-django
DEBUG=True
DB_NAME=mentis_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=tu-api-key-de-google-gemini
EMAIL_HOST_USER=tu-correo@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
```

## 📝 Notas del Sprint

- La IA usa Google Gemini (`gemini-2.5-flash`), no OpenAI como se planeó en el README inicial
- El campo `area` de vacante es ahora FK — los selects del frontend cargan desde `GET /api/areas/activas/`
- El código de vacante se genera automáticamente con formato `{CODIGO_AREA}-{AÑO}-{NNN}`
- Las respuestas de listado ahora son paginadas: `{ count, next, previous, results }`
- El tipo de documento del candidato va en mayúsculas: `DNI`, `CE`, `PASSPORT`
- `react-hot-toast` y `react-dropzone` son dependencias nuevas del frontend

---

**Inicio:** 13-05-2026  
**Finalización estimada:** 21-05-2026
