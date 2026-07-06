<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,20,24&height=200&section=header&text=MENTIS&fontSize=80&fontColor=ffffff&fontAlignY=35&desc=AI-Powered%20Recruitment%20Intelligence%20System&descSize=20&descAlignY=58&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&pause=1000&color=7C3AED&center=true&vCenter=true&multiline=true&width=700&height=100&lines=Sistema+Inteligente+de+Reclutamiento+con+IA;Django+%C2%B7+Spring+Boot+%C2%B7+React+%C2%B7+Kotlin+%C2%B7+Gemini;4+Sprints+%C2%B7+8+semanas+%C2%B7+~366+horas+de+desarrollo)](https://git.io/typing-svg)

<br/>

![Academic](https://img.shields.io/badge/Tecsup-Proyecto%20Integrador%202026--I-7C3AED?style=for-the-badge&logo=graduation-cap&logoColor=white)
![Group](https://img.shields.io/badge/Grupo-4--A%20%C2%B7%20Secci%C3%B3n%20C24-5B21B6?style=for-the-badge)
![Methodology](https://img.shields.io/badge/SCRUM-4%20Sprints%20%C3%97%202%20semanas-4F46E5?style=for-the-badge&logo=jira&logoColor=white)

<br/>

[![Django](https://img.shields.io/badge/Backend%20Admin-Django%204.2-092E20?style=flat-square&logo=django&logoColor=white)](./backend-django)
[![Spring Boot](https://img.shields.io/badge/Backend%20Evaluaciones-Spring%20Boot%203-6DB33F?style=flat-square&logo=spring&logoColor=white)](./backend-springboot)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)](./frontend-web)
[![Android](https://img.shields.io/badge/Mobile-Android%20Kotlin-3DDC84?style=flat-square&logo=android&logoColor=white)](./mentis-android)
[![Gemini](https://img.shields.io/badge/IA-Google%20Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)

</div>

---

## 🧠 ¿Qué es MENTIS?

**MENTIS** es un sistema integral de reclutamiento impulsado por inteligencia artificial que automatiza el proceso completo de selección de personal — desde la publicación de vacantes hasta la entrevista conversacional por voz en tiempo real.

El sistema elimina la revisión manual de CVs, genera exámenes técnicos personalizados con IA, aplica proctoring durante las evaluaciones y conduce entrevistas por voz usando **Gemini Live API** (WebSocket, voz a voz, latencia < 1s). Todo integrado en tres interfaces: panel web RRHH, portal web del candidato y app Android nativa.

```
Candidato postula → IA analiza CV (score 0-100) → Examen técnico (10 preguntas IA, 45min, proctoring)
→ Entrevista por voz con EVA (Gemini Live) → Score final ponderado → Ranking automático
```

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENTES                                 │
│                                                                   │
│  Panel Admin Web     Portal Candidato Web      App Android        │
│  React 19 + Vite     React 19 + Vite           Kotlin + Compose  │
│       │                    │    │                    │            │
└───────┼────────────────────┼────┼────────────────────┼────────────┘
        │ HTTPS/REST         │    │ HTTPS/REST         │ HTTPS/REST
┌───────┼────────────────────┼────┼────────────────────┼────────────┐
│       ▼                    │    ▼                    ▼            │
│  Backend Admin         WebSocket              Backend Evaluaciones│
│  Django 4.2 + DRF      Gemini Live            Spring Boot 3      │
│  JWT · Gemini IA        (voz a voz)           JWT · JPA           │
│       │                                            │              │
│       └──────────────── MySQL 8.0 ────────────────┘              │
│                    (base de datos compartida)                     │
└──────────────────────────────────────────────────────────────────┘
         │                    │                    │
    Google Gemini         Gmail SMTP           Indeed XML
    2.5 Flash            (correos auto)        Google for Jobs
```

---

## 📁 Estructura del Repositorio

```
mentis/
├── backend-django/          # API REST Admin (Python 3.12 + Django 4.2)
│   ├── autenticacion/       # JWT auth, usuarios RRHH, roles
│   ├── vacantes/            # CRUD vacantes, áreas, publicación
│   ├── candidatos/          # Candidatos, análisis IA, correos
│   ├── evaluaciones/        # Exámenes, entrevistas IA, auditoría
│   └── mentis_backend/      # Settings, URLs principales
│
├── backend-springboot/      # Microservicio Evaluaciones (Java 17 + Spring Boot 3)
│   └── src/main/java/com/mentis/usuario/
│       ├── controller/      # AuthController, ExamenController, ProgresoController
│       ├── service/         # Lógica de negocio (examen, entrevista, proctoring)
│       ├── entity/          # Candidato, Examen, TokenAcceso, PreguntaExamen
│       └── config/          # JWT filter, AuthInterceptor, CORS
│
├── frontend-web/            # SPA Admin + Portal Candidato (React 19 + Vite)
│   └── src/
│       ├── pages/           # 25+ páginas (admin RRHH y portal candidato)
│       ├── pages/candidato/ # Portal: Acceso, Examen, EntrevistaVoz, Progreso
│       ├── services/api.js  # Axios: instancia Django + instancia Spring Boot
│       ├── ThemeContext.jsx  # Dark/Light mode global
│       └── lib/             # TanStack Query: queryClient, queryKeys
│
└── mentis-android/          # App Android (Kotlin + Jetpack Compose)
    └── app/src/main/java/com/mentis/app/
        ├── data/            # Retrofit, Room, DTOs, interceptors
        ├── domain/          # Models, Repositories, UseCases (Clean Architecture)
        └── presentation/    # Screens: Acceso, Examen, Progreso, Finalizado
```

---

## 🚀 Stack Tecnológico

<div align="center">

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend Web** | React + Vite + TanStack Query | 19 / 8 / 5 |
| **Backend Admin** | Django REST Framework + SimpleJWT | 4.2 / 5.3 |
| **Backend Evaluaciones** | Spring Boot + JPA + JJWT | 3.x / Java 17 |
| **App Móvil** | Kotlin + Jetpack Compose + Retrofit + Room | Latest |
| **Base de datos** | MySQL | 8.0 |
| **IA Principal** | Google Gemini 2.5 Flash | Latest |
| **IA Entrevista** | Gemini Live API (WebSocket) | Latest |
| **Autenticación** | JWT — SimpleJWT (admin) + JJWT (Spring) | — |
| **PDF** | PyPDF2 + pdfminer.six | 3.0 / 2023 |
| **Correos** | Gmail SMTP + HTML templates | — |

</div>

---

## 🗓️ Sprints

<details>
<summary><strong>Sprint 1 — Fundación</strong> &nbsp;·&nbsp; <code>11 May 2026 → 12 May 2026</code></summary>

<br/>

**Objetivo:** Establecer la base técnica del proyecto.

| Entregable | Estado |
|-----------|--------|
| Configuración monorepo GitHub (4 carpetas) | ✅ |
| Django + DRF + MySQL conectados | ✅ |
| Modelos Vacante y Candidato (esquema base) | ✅ |
| API REST CRUD vacantes y candidatos | ✅ |
| Setup React + Vite + estructura de carpetas | ✅ |
| Diseño inicial de base de datos | ✅ |

**Rama:** `sprint-1` · **Horas:** ~39h · **Tareas:** 14

</details>

<details>
<summary><strong>Sprint 2 — Admin Completo + IA CV</strong> &nbsp;·&nbsp; <code>11 May 2026 → 16 Jun 2026</code></summary>

<br/>

**Objetivo:** Completar el módulo de administración RRHH e integrar Gemini para análisis de CVs.

| Entregable | Estado |
|-----------|--------|
| Auth JWT con roles (admin, reclutador, evaluador, gerente) | ✅ |
| 16 áreas predefinidas con instrucción IA por área | ✅ |
| Análisis de CV con Gemini: score 0-100, clasificación, resumen, habilidades | ✅ |
| Carga masiva de CVs con procesamiento en background | ✅ |
| Formulario público de postulación `/postular/:codigo` | ✅ |
| Feed XML para Indeed + schema.org para Google for Jobs | ✅ |
| Generador de textos multi-portal (LinkedIn, WhatsApp, Computrabajo) | ✅ |
| Sistema de correos automáticos HTML | ✅ |
| Frontend panel RRHH completo (vacantes, candidatos, ranking, usuarios) | ✅ |
| Buzón IMAP automático para recepción de CVs por correo | ✅ |

**Rama:** `sprint-2` · **Horas:** ~120h · **Tareas:** 55

</details>

<details>
<summary><strong>Sprint 3 — Módulo Usuario + Examen Técnico</strong> &nbsp;·&nbsp; <code>11 May 2026 → 04 Jul 2026</code></summary>

<br/>

**Objetivo:** Construir el microservicio Spring Boot y todas las interfaces del candidato.

| Entregable | Estado |
|-----------|--------|
| Spring Boot 3 + JPA + MySQL compartida | ✅ |
| Generación de 10 preguntas por IA según CV + vacante | ✅ |
| Calificación automática (MC al instante, abiertas con IA) | ✅ |
| Código de acceso corto MENTIS-XXXX-XXXX | ✅ |
| Sistema de retomar examen interrumpido | ✅ |
| Portal web candidato: acceso por token, instrucciones, examen, progreso | ✅ |
| Timer 45 min + mapa de preguntas + auto-guardado incremental | ✅ |
| Proctoring: foco, copy/paste, click derecho, DevTools, inactividad | ✅ |
| App Android: acceso, progreso, examen (Kotlin + Jetpack Compose + Room) | ✅ |
| Reenvío automático de correo según etapa del candidato | ✅ |

**Rama:** `sprint-3` · `sprint-3-mobile` · **Horas:** ~84h · **Tareas:** 26

</details>

<details>
<summary><strong>Sprint 4 — Entrevista IA por Voz</strong> &nbsp;·&nbsp; <code>05 Jul 2026 → 06 Jul 2026</code></summary>

<br/>

**Objetivo:** Integrar Gemini Live API para entrevista conversacional y completar el sistema.

| Entregable | Estado |
|-----------|--------|
| Entrevista por voz con EVA (Gemini Live, WebSocket + AudioWorklet PCM) | ✅ |
| Consentimiento de datos + verificación de identidad con IA | ✅ |
| Capturas periódicas de auditoría cada 3 minutos | ✅ |
| Timer con trigger automático de preguntas críticas a 5 min del final | ✅ |
| Análisis multidimensional post-entrevista con Gemini | ✅ |
| Vista 360° del candidato (radar de dimensiones, transcripción, audio) | ✅ |
| Dashboard de métricas con embudo de conversión | ✅ |
| Banco de talento | ✅ |
| TanStack Query: cache de datos en todo el admin | ✅ |
| Panel de entrevistas IA para RRHH | ✅ |

**Rama:** `sprint-4` · `sprint-4-mobile` · **Horas:** ~123h · **Tareas:** 25

</details>

---

## 🤖 Sistema de Scoring

```
Score Final = (Score_CV × 0.25) + (Nota_Examen × 0.40) + (Nota_Entrevista × 0.35)
```

| Etapa | Peso | Detalles | Umbral |
|-------|------|---------|--------|
| Análisis de CV | 25% | Score 0-100 generado por Gemini (habilidades, experiencia, coherencia) | ≥ 60 / 100 |
| Examen técnico | 40% | 10 preguntas IA, 45 min, calificación automática | ≥ 13 / 20 |
| Entrevista por voz | 35% | Conversación con EVA (Gemini Live), análisis multidimensional | — |

---

## 🛡️ Proctoring & Auditoría

| Control | Severidad | Sprint |
|---------|-----------|--------|
| Pérdida de foco de pestaña | 🟡 Amarillo | S3 |
| Cambio de ventana / Alt+Tab | 🟡 Amarillo | S3 |
| Inactividad > 2 minutos | 🟡 Amarillo | S3 |
| Copy / Paste bloqueado | 🔴 Rojo | S3 |
| Click derecho bloqueado | 🔴 Rojo | S3 |
| DevTools bloqueado (F12) | 🔴 Rojo | S3 |
| Detección de múltiples voces | 🔴 Rojo | S4 |
| Foto de identidad inicial (IA) | 🔴 Rojo | S4 |
| Fotos periódicas durante entrevista | 🟡 Amarillo | S4 |

> 🟢 Verde ≤6 pts &nbsp;·&nbsp; 🟡 Amarillo 7-18 pts &nbsp;·&nbsp; 🔴 Rojo >18 pts

---

## ⚙️ Instalación y Despliegue

### Prerrequisitos

```bash
Python 3.12+     # backend-django
Java 17+         # backend-springboot
Node.js 20+      # frontend-web
Android Studio   # mentis-android
MySQL 8.0+       # base de datos compartida
```

---

### 1️⃣ Backend Django (Puerto 8000)

```bash
cd backend-django

# Crear entorno virtual
python -m venv venv
source venv/bin/activate          # Linux/Mac
venv\Scripts\activate             # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Migraciones
python manage.py migrate

# Cargar datos iniciales (áreas predefinidas)
python manage.py cargar_areas

# Iniciar servidor
python manage.py runserver
# → http://localhost:8000
```

**Variables de entorno (`.env`):**

| Variable | Descripción |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DB_NAME` | Nombre de la base de datos MySQL |
| `DB_USER` | Usuario MySQL |
| `DB_PASSWORD` | Contraseña MySQL |
| `DB_HOST` | Host MySQL (default: `localhost`) |
| `DB_PORT` | Puerto MySQL (default: `3306`) |
| `GEMINI_API_KEY` | API Key de Google Gemini |
| `EMAIL_HOST_USER` | Correo Gmail para SMTP |
| `EMAIL_HOST_PASSWORD` | Contraseña de aplicación Gmail |
| `INTERNAL_SERVICE_KEY` | Clave compartida con Spring Boot |
| `ALLOWED_HOSTS` | Hosts permitidos (ej: `localhost,127.0.0.1`) |

---

### 2️⃣ Backend Spring Boot (Puerto 8080)

```bash
cd backend-springboot

# Compilar y ejecutar con Maven
mvn spring-boot:run

# O compilar el JAR y ejecutar
mvn clean package -DskipTests
java -jar target/mentis-springboot-*.jar
# → http://localhost:8080
```

**Variables de entorno:**

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `GEMINI_API_KEY` | API Key de Google Gemini |
| `DJANGO_BASE_URL` | URL del backend Django (default: `http://localhost:8000`) |
| `INTERNAL_SERVICE_KEY` | Clave compartida con Django (debe coincidir exactamente) |
| `DB_URL` | JDBC URL de MySQL (`jdbc:mysql://localhost:3306/mentis_db`) |
| `DB_USER` | Usuario MySQL |
| `DB_PASSWORD` | Contraseña MySQL |

---

### 3️⃣ Frontend Web (Puerto 5173)

```bash
cd frontend-web

# Instalar dependencias
npm install

# Configurar URLs de los backends en src/services/api.js:
# const DJANGO_URL = 'http://localhost:8000';
# const SPRING_URL = 'http://localhost:8080';

# Iniciar en modo desarrollo
npm run dev
# → http://localhost:5173

# Build para producción
npm run build
```

---

### 4️⃣ App Android

```bash
# Abrir en Android Studio: File → Open → /mentis-android

# Configurar BASE_URL del backend en NetworkModule.kt

# Requisitos mínimos:
# compileSdk 35 · minSdk 24 · Kotlin · Jetpack Compose · Hilt

# Ejecutar desde Android Studio en emulador o dispositivo físico
```

---

## 🔌 Endpoints Principales

### Django (`:8000`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login/` | Login RRHH → JWT |
| `POST` | `/api/auth/usuarios/crear/` | Crear usuario RRHH |
| `GET` | `/api/vacantes/` | Listar vacantes |
| `GET` | `/api/candidatos/` | Listar candidatos |
| `POST` | `/api/candidatos/{id}/analizar/` | Analizar CV con Gemini |
| `POST` | `/api/candidatos/{id}/reenviar-correo-etapa/` | Reenviar correo según etapa |
| `GET` | `/api/candidatos/ranking/` | Ranking por vacante |
| `GET` | `/api/evaluaciones/examenes/` | Listar exámenes |
| `GET` | `/api/evaluaciones/examenes/{id}/auditoria/` | Auditoría de proctoring |
| `POST` | `/api/postular/{codigo}/enviar/` | Postulación pública |

### Spring Boot (`:8080`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/usuario/auth/acceso` | Login candidato por token |
| `POST` | `/api/usuario/examen/iniciar` | Iniciar examen |
| `POST` | `/api/usuario/examen/respuesta` | Guardar respuesta |
| `POST` | `/api/usuario/examen/finalizar` | Finalizar y calificar |
| `GET` | `/api/usuario/progreso` | Estado del proceso |
| `POST` | `/api/evaluaciones/entrevista/acceso/` | Acceso a entrevista |
| `POST` | `/api/evaluaciones/entrevista/iniciar/` | Iniciar entrevista + token Gemini Live |
| `POST` | `/api/evaluaciones/entrevista/finalizar/` | Finalizar + análisis IA |
| `POST` | `/api/evaluaciones/entrevista/captura/` | Foto de auditoría |
| `POST` | `/api/evaluaciones/entrevista/evento/` | Evento de proctoring |

---

## 👥 Equipo

<div align="center">

| Nombre | Rol | Responsabilidad |
|--------|-----|----------------|
| **William Julon Mejía** | Scrum Master · Backend Lead | Django, Spring Boot, Google Gemini, base de datos, arquitectura |
| **Angel Gabriel Llanos Pacheco** | Frontend · Mobile Developer | React 19, portal candidato, App Android Kotlin |
| **Alexander Anthony Sanabria Martínez** | Desarrollador | Testing, documentación, diagramas |
| **Harold Eduardo Santivañez García** | Desarrollador | Datos de prueba, soporte frontend |

</div>

---

## 📊 Métricas del Proyecto

<div align="center">

| Sprint | Fechas reales | Tareas | Horas | Estado |
|--------|--------------|--------|-------|--------|
| Sprint 1 — Fundación | 11 May → 12 May 2026 | 14 | ~39h | ✅ |
| Sprint 2 — Admin + IA CV | 11 May → 16 Jun 2026 | 55 | ~120h | ✅ |
| Sprint 3 — Examen + Mobile | 11 May → 04 Jul 2026 | 26 | ~84h | ✅ |
| Sprint 4 — Entrevista por Voz | 05 Jul → 06 Jul 2026 | 25 | ~123h | ✅ |
| **Total** | **8 semanas** | **120** | **~366h** | ✅ |

</div>

---

<div align="center">

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white)
![Java](https://img.shields.io/badge/Java%2017-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat-square&logo=spring&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=flat-square&logo=kotlin&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL%208.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4154?style=flat-square&logo=react-query&logoColor=white)
![Jetpack Compose](https://img.shields.io/badge/Jetpack%20Compose-4285F4?style=flat-square&logo=android&logoColor=white)

<br/><br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,20,24&height=100&section=footer&fontSize=14&fontColor=ffffff&desc=MENTIS%20%C2%B7%20Tecsup%202026-I%20%C2%B7%20Grupo%204-A&descAlignY=65" width="100%"/>

</div>
