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
| **Backend Admin** | Django 4.2, Django REST Framework, MySQL |
| **Backend Evaluaciones** | Spring Boot 3, Java 17, JPA |
| **Mobile** | Kotlin, Jetpack Compose, Retrofit |
| **Base de Datos** | MySQL 8.0 (XAMPP) |
| **IA** | OpenAI API (GPT-4) |
| **DevOps** | Git, GitHub |

## 🏃 Plan de Sprints

| Sprint | Duración | Estado | Objetivos |
|--------|----------|--------|-----------|
| **Sprint 1** | 2 días | 🔵 Completado | Fundación: CRUD vacantes y candidatos |
| **Sprint 2** | 3 días | ⚪ Pendiente | IA: Análisis automático de CV |
| **Sprint 3** | 3 días | ⚪ Pendiente | Evaluaciones técnicas automatizadas |
| **Sprint 4** | 3 días | ⚪ Pendiente | Entrevista con IA |
| **Sprint 5** | 3 días | ⚪ Pendiente | Integración final y demo |

📄 Ver detalles en [`docs/sprint-1.md`](docs/sprint-1.md)

## 🚀 Setup Rápido

### Base de Datos (MySQL)
1. Abrir XAMPP Control Panel
2. Start Apache y MySQL
3. Abrir phpMyAdmin (http://localhost/phpmyadmin)
4. Crear database: `mentis_db`

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

## 📊 Flujo del Sistema

```
1. RRHH crea vacante → 2. Candidato se registra → 
3. IA analiza CV → 4. Sistema clasifica → 
5. Envía evaluación → 6. Candidato responde →
7. IA evalúa respuestas → 8. RRHH revisa finalistas
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
