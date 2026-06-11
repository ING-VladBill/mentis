# Sprint 1 - Fundación del Sistema

**Duración:** 7 días  
**Estado:** 🟢 En progreso  
**Objetivo:** Establecer la base del sistema con CRUD funcional de vacantes y candidatos

## 🎯 Objetivos del Sprint

- [x] Configurar repositorio Git y estructura de proyecto
- [X] Setup Django + MySQL
- [X] Crear modelos Vacante y Candidato
- [X] Implementar API REST con DRF
- [X] Setup React + Axios
- [X] Crear vistas de gestión de vacantes
- [X] Implementar formulario de registro de candidatos

## 📋 Tareas Detalladas

### Backend (Django)
- [X] Instalar Django, DRF, mysqlclient, django-cors-headers
- [X] Crear apps: `vacantes`, `candidatos`
- [X] Configurar `settings.py` con MySQL
- [X] Modelo `Vacante`: título, descripción, requisitos, estado, fecha_creacion
- [X] Modelo `Candidato`: nombre, email, teléfono, cv (FileField), vacante (FK)
- [X] Serializers para ambos modelos
- [X] ViewSets con CRUD completo
- [ ] Configurar URLs y CORS
- [X] Probar endpoints en Postman

### Frontend (React)
- [X] Setup con Vite
- [X] Instalar Axios, React Router
- [X] Estructura de carpetas: components, pages, services, utils
- [X] Página `VacantesList.jsx` con tabla
- [X] Página `VacanteForm.jsx` para crear/editar
- [x] Página `CandidatoList.jsx` con tabla
- [X] Página `CandidatoForm.jsx` con upload de CV
- [X] Service `api.js` para centralizar llamadas Axios
- [X] Routing básico

### Base de Datos
- [X] Iniciar MySQL desde XAMPP
- [X] Crear database `mentis_db` en phpMyAdmin
- [X] Configurar Django para usar MySQL (mysqlclient)
- [X] Ejecutar migraciones Django
- [X] Verificar tablas creadas en phpMyAdmin

## 📦 Entregables

- ✅ Repositorio Git configurado
- ⏳ API REST funcional con endpoints `/api/vacantes/` y `/api/candidatos/`
- ⏳ Frontend React conectado al backend
- ⏳ Subida de archivos CV funcionando
- ⏳ Base de datos MySQL configurada

## 🧪 Criterios de Aceptación

1. Puedo crear una vacante desde el frontend y se guarda en la BD
2. Puedo listar todas las vacantes
3. Puedo registrar un candidato asociado a una vacante
4. El archivo PDF del CV se sube correctamente
5. Puedo consultar los candidatos por vacante

## 🚀 Comandos de Inicio

```bash
# Backend
cd backend-django
python manage.py runserver

# Frontend
cd frontend-web
npm run dev
```

## 📝 Notas del Sprint

- El upload de CV usa `multipart/form-data`
- CORS configurado para `http://localhost:5173` (Vite)
- Archivo `.env` no se sube a Git (credenciales DB)
- Base de datos: MySQL 8.0 via XAMPP (puerto 3306)

---

**Inicio:** 06-05-2026  
**Finalización estimada:** 12-05-2026
