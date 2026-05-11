#  MENTIS - Sistema Inteligente de Reclutamiento

![Status](https://img.shields.io/badge/Status-Sprint%201-blue)
![Python](https://img.shields.io/badge/Python-3.10+-green)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

Sistema MVP de automatización de procesos de selección de personal utilizando Inteligencia Artificial.

## 📦 Estructura del Monorepo

```bash
mentis/
├── backend-django/          # API principal - Gestión de vacantes y candidatos
├── backend-springboot/      # Microservicio de evaluaciones técnicas
├── frontend-web/            # Dashboard RRHH (React + Vite)
├── mobile-android/          # App para candidatos (Kotlin)
└── docs/                    # Documentación de sprints
```
## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend Web** | React 18, Vite, Axios, React Router |
| **Backend Admin** | Django 4.2, Django REST Framework, PostgreSQL |
| **Backend Evaluaciones** | Spring Boot 3, Java 17, JPA |
| **Mobile** | Kotlin, Jetpack Compose, Retrofit |
| **Base de Datos** | PostgreSQL 15 |
| **IA** | OpenAI API (GPT-4) |
| **DevOps** | Git, GitHub, Docker (opcional) |

## 🏃 Plan de Sprints

| Sprint | Duración | Estado | Objetivos |
|--------|----------|--------|-----------|
| **Sprint 1** | 2 días | 🟢 En progreso | Fundación: CRUD vacantes y candidatos |
| **Sprint 2** | 3 días | ⚪ Pendiente | IA: Análisis automático de CV |
| **Sprint 3** | 3 días | ⚪ Pendiente | Evaluaciones técnicas automatizadas |
| **Sprint 4** | 3 días | ⚪ Pendiente | Entrevista con IA |
| **Sprint 5** | 3 días | ⚪ Pendiente | Integración final y demo |

📄 Ver detalles en [`docs/sprint-1.md`](docs/sprint-1.md)

## 🚀 Setup Rápido

### Backend Django
```bash
cd backend-django
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend React
```bash
cd frontend-web
npm install
npm run dev
```

### Base de Datos
```sql
CREATE DATABASE mentis_db;
CREATE USER mentis_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE mentis_db TO mentis_user;
```

## 📊 Flujo del Sistema

```
RRHH crea vacante → 2. Candidato se registra → 3. IA analiza CV →
 Sistema clasifica → 5. Envía evaluación → 6. Candidato responde →
IA evalúa respuestas → 8. RRHH revisa finalistas
```

## 👥 Equipo Scrum

- **Scrum Master & Dev Lead:** William Julon 
- **Desarrolladores:** Gabriel Llanos, Alexander Sanabria y Harold Eduardo Santivañez.

## 📝 Commits Convention

**-** ```git commit -m "[Sprint x] Descripción breve"```
```
Ejemplos:
"[Sprint 1] Setup Django project + MySql"
[Sprint 1] Create Vacante model and CRUD endpoints
[Sprint 2] Integrate OpenAI for CV analysis
```
## 📜 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles

---

**Última actualización:** Sprint 1 - Día 1