# MENTIS — Contexto del Proyecto para Claude Code

## ¿Qué es MENTIS?

Sistema MVP de automatización de procesos de selección de personal usando Inteligencia Artificial. Desarrollado como proyecto integrador en Tecsup (2026) por un equipo Scrum de 4 personas.

---

## Estructura del monorepo

```
mentis/
├── backend-django/       # API principal — Django 4.2 + DRF
├── backend-springboot/   # Microservicio evaluaciones — Sprint 3+
├── frontend-web/         # Dashboard RRHH — React 18 + Vite
├── mobile-android/       # App candidatos — Kotlin — Sprint 3+
└── docs/
    ├── sprint-1.md
    └── sprint-2.md
```

---

## Equipo

| Rol | Persona |
|---|---|
| Scrum Master / Dev Lead | William Julon |
| Frontend React | Gabriel Llanos |
| Backend / IA | Alexander Sanabria |
| Backend / IA | Harold Eduardo Santivañez |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite, Axios, React Router v6, react-hot-toast, react-dropzone |
| Estilos | CSS-in-JS (inline styles), Tabler Icons (CDN webfont), Tailwind CSS v4 instalado |
| Backend | Django 4.2, Django REST Framework, simplejwt, django-cors-headers |
| Base de datos | MySQL 8.0 via XAMPP |
| IA | Google Gemini (gemini-2.5-flash) — NO OpenAI |
| Auth | JWT (access token 60min + refresh token 7 días) |

---

## Estado actual — Sprint 2 completado

### Backend corriendo en `http://localhost:8000`
### Frontend corriendo en `http://localhost:5173`

---

## Frontend — Estructura de archivos

```
frontend-web/
├── index.html                        # Incluye CDN Tabler Icons
├── vite.config.js                    # Plugin tailwindcss + react
├── src/
│   ├── main.jsx                      # Entry point — NO modificar
│   ├── index.css                     # @import "tailwindcss"
│   ├── App.jsx                       # Layout, sidebar, routing, ThemeContext
│   ├── components/
│   │   └── ProtectedRoute.jsx        # Guard JWT
│   ├── pages/
│   │   ├── Login.jsx                 # Auth — logo es el toggle dark/light
│   │   ├── VacantesList.jsx          # Lista con stats y filtros
│   │   ├── VacanteForm.jsx           # Crear/editar vacante
│   │   ├── CandidatosList.jsx        # Lista con botón IA y 15 estados
│   │   └── CandidatoForm.jsx        # Registrar candidato con PDF
│   └── services/
│       └── api.js                    # Axios con interceptores JWT
```

---

## App.jsx — Decisiones clave

### ThemeContext
```jsx
export const ThemeContext = createContext();
export function useTheme() { return useContext(ThemeContext); }
```
Todos los componentes importan `useTheme` desde `../App`. El tema se persiste en `localStorage` con key `mentis-theme`.

### Tokens del tema
```js
// dark=true → fondo oscuro #13131a, sidebar #0c0c10
// dark=false → fondo claro #f4f4f8, sidebar #ffffff
// Accent color siempre: #7c3aed (violet)
```

### Rutas
```jsx
// Pública
<Route path="/login" element={<Login />} />

// Ruta raíz — redirige según token
<Route path="/" element={
  localStorage.getItem('access_token')
    ? <Navigate to="/vacantes" replace />
    : <Navigate to="/login" replace />
} />

// Protegidas — dentro del Layout con sidebar
<Route path="/vacantes"             element={<ProtectedRoute><VacantesList /></ProtectedRoute>} />
<Route path="/vacantes/nueva"       element={<ProtectedRoute><VacanteForm /></ProtectedRoute>} />
<Route path="/vacantes/:id/editar"  element={<ProtectedRoute><VacanteForm /></ProtectedRoute>} />
<Route path="/candidatos"           element={<ProtectedRoute><CandidatosList /></ProtectedRoute>} />
<Route path="/candidatos/registrar" element={<ProtectedRoute><CandidatoForm /></ProtectedRoute>} />
```

---

## api.js — Interceptores JWT

```js
// baseURL: 'http://localhost:8000' — SIN /api al final
// Cada llamada debe incluir /api/ al inicio: api.get('/api/vacantes/')

// Interceptor REQUEST: agrega Authorization: Bearer {access_token}
// Interceptor RESPONSE: si 401 → refresca token → reintenta
//   Si refresh falla → localStorage.clear() → redirige a /login
```

---

## Endpoints del backend (todos requieren JWT excepto login)

### Auth
```
POST /api/auth/login/          → { access, refresh, usuario }
POST /api/auth/logout/         → { refresh } en body
POST /api/auth/refresh/        → { refresh } → { access }
GET  /api/auth/perfil/         → datos del usuario logueado
```

### Vacantes
```
GET    /api/vacantes/              → { count, next, previous, results: [...] }
POST   /api/vacantes/              → crear vacante
GET    /api/vacantes/{id}/         → detalle
PUT    /api/vacantes/{id}/         → editar
DELETE /api/vacantes/{id}/         → eliminar
GET    /api/vacantes/abiertas/     → { total, vacantes: [...] }
GET    /api/areas/activas/         → lista de áreas para select
```

### Candidatos
```
GET  /api/candidatos/              → { count, next, previous, results: [...] }
POST /api/candidatos/              → registrar (multipart/form-data)
GET  /api/candidatos/{id}/         → detalle
POST /api/candidatos/{id}/analizar/→ análisis IA → { pasa_filtro, score, candidato }
GET  /api/candidatos/ranking/      → ?vacante_id=X
```

---

## Modelos del backend

### Usuario (custom)
```python
USERNAME_FIELD = 'email'
roles = ['admin', 'reclutador', 'evaluador', 'gerente']
campos: nombre, apellidos, email, rol, is_active
```

### Area
```python
campos: nombre, codigo_corto, icono, color, es_predefinida, orden
# Poblar con: python manage.py cargar_areas
```

### Vacante
```python
# Campos principales
titulo, area (FK→Area), departamento, industria
descripcion, requisitos, responsabilidades, requisitos_deseables
beneficios, habilidades, tecnologias, conocimientos_especificos
nivel_experiencia, anios_experiencia, nivel_educativo, carrera_afin
modalidad, tipo_contrato, ciudad, pais
salario_minimo, salario_maximo, moneda, mostrar_salario
estado, prioridad
# Configuración IA
score_cv_minimo, nota_minima_examen, top_candidatos_finalistas
# Generado automáticamente
codigo  # formato: TI-2025-001

# nivel_experiencia choices: practicante, junior, semi_senior, senior, lider, gerencial
# modalidad choices: presencial, remoto, hibrido
# tipo_contrato choices: indefinido, plazo_fijo, por_obra, practicas, freelance, part_time
# estado choices: borrador, abierta, en_proceso, pausada, cerrada, cancelada
# prioridad choices: baja, media, alta, urgente
```

### Candidato
```python
# Campos principales
vacante (FK→Vacante)
nombre, apellido_paterno, apellido_materno
tipo_documento  # DNI / CE / PASSPORT (mayúsculas)
numero_documento, genero  # M / F / NB / NI
email, telefono, ciudad, pais
linkedin, github, portfolio  # NO linkedin_url / github_url
nivel_educativo  # NO nivel_educacion
carrera, universidad, anios_experiencia  # NO años_experiencia
cargo_actual, empresa_actual, habilidades_declaradas
cv (FileField PDF), carta_presentacion (FileField PDF opcional)
# Generado por IA
score_cv, clasificacion_ia, estado
```

### Estados del candidato (15)
```
postulado → cv_analizando → cv_aprobado / cv_rechazado
→ examen_pendiente → examen_en_curso → examen_aprobado / examen_rechazado
→ entrevista_pendiente → entrevista_en_curso → entrevista_completada
→ entrevista_presencial → finalista → contratado / descartado
```

### Clasificación IA
```
altamente_recomendado / recomendado / requiere_revision / no_apto
```

---

## Respuesta paginada (importante)

El backend Sprint 2 devuelve listas paginadas:
```js
// INCORRECTO
const { data } = await api.get('/api/vacantes/');
setVacantes(data);  // ← falla, data es objeto no array

// CORRECTO
setVacantes(data.results || data);
```

---

## Vacantes abiertas para CandidatoForm
```js
// El endpoint devuelve: { total: N, vacantes: [...] }
api.get('/api/vacantes/abiertas/')
  .then(r => setVac(r.data.vacantes || r.data))
```

---

## localStorage — claves usadas
```
access_token   → JWT access token
refresh_token  → JWT refresh token
usuario        → JSON.stringify({ nombre, apellidos, rol, rol_display, ... })
mentis-theme   → 'dark' | 'light'
```

---

## Reglas críticas del frontend

### 1. NUNCA definir componentes dentro de componentes
```jsx
// MAL — causa pérdida de foco en inputs
export default function Form() {
  function Field({ children }) { ... }  // ← bug
  return <Field><input /></Field>
}

// BIEN — siempre fuera del componente padre
function Field({ children }) { ... }
export default function Form() {
  return <Field><input /></Field>
}
```

### 2. Selects en modo claro necesitan colorScheme
```js
// Agregar a los estilos de input/select para que el dropdown sea legible
colorScheme: dark ? 'dark' : 'light',
```

### 3. URLs siempre con /api/
```js
// baseURL es http://localhost:8000 (sin /api)
// Por tanto todas las llamadas deben incluir /api/
api.get('/api/vacantes/')     // correcto
api.get('/vacantes/')         // incorrecto → 404
```

---

## Convención de commits
```
[Sprint X] Descripción breve de lo que se hizo
```
Ejemplos:
```
[Sprint 2] Frontend: auth JWT, IA analysis button, Sprint 2 compatibility
[Sprint 2] Fix: data.results pagination on VacantesList and CandidatosList
[Sprint 3] Backend: evaluaciones técnicas model and endpoints
```

---

## Comandos útiles

```bash
# Backend
cd backend-django
venv\Scripts\activate            # Windows
source venv/bin/activate         # Linux/Mac
python manage.py runserver
python manage.py migrate
python manage.py createsuperuser
python manage.py cargar_areas    # Inyectar áreas predefinidas
python manage.py shell

# Frontend
cd frontend-web
npm run dev
npm install react-hot-toast react-dropzone   # dependencias Sprint 2

# Git
git checkout sprint-1
git checkout sprint-2
git add .
git commit -m "[Sprint 2] descripción"
git push origin sprint-2
```

---

## Variables de entorno — backend-django/.env

```
SECRET_KEY=clave-secreta-larga
DEBUG=True
DB_NAME=mentis_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=tu-api-key-gemini
EMAIL_HOST_USER=correo@gmail.com
EMAIL_HOST_PASSWORD=app-password-gmail
```

---

## Próximos sprints

| Sprint | Objetivo |
|---|---|
| Sprint 3 | Evaluaciones técnicas automatizadas |
| Sprint 4 | Entrevista con IA |
| Sprint 5 | Integración final y demo |

Los módulos "Evaluaciones", "Entrevistas IA", "Resultados", "Auditoría" y "Configuración" están en la sidebar con badge "Pronto" — ya tienen rutas reservadas para Sprint 3+.

---

## Notas importantes

- La IA usa **Google Gemini**, no OpenAI (el README original decía GPT-4 pero se cambió)
- El campo `area` de Vacante es FK — **no texto libre**
- El código de vacante lo genera el backend automáticamente — **no hay input para eso en el form**
- Los tipos de documento van en **mayúsculas**: `DNI`, `CE`, `PASSPORT`
- El género del candidato usa códigos cortos: `M`, `F`, `NB`, `NI`
- XAMPP debe tener Apache + MySQL en verde antes de iniciar Django
