# Sprint 1 - Fundación del Sistema

**Duración:** 7 días  
**Estado:** 🟢 En progreso  
**Objetivo:** Establecer la base del sistema con CRUD funcional de vacantes y candidatos

## 🎯 Objetivos del Sprint

- [x] Configurar repositorio Git y estructura de proyecto
- [ ] Setup Django + PostgreSQL
- [ ] Crear modelos Vacante y Candidato
- [ ] Implementar API REST con DRF
- [ ] Setup React + Axios
- [ ] Crear vistas de gestión de vacantes
- [ ] Implementar formulario de registro de candidatos

## 📋 Tareas Detalladas

### Backend (Django)
- [ ] Instalar Django, DRF, psycopg2, django-cors-headers
- [ ] Crear apps: `vacantes`, `candidatos`
- [ ] Configurar `settings.py` con PostgreSQL
- [ ] Modelo `Vacante`: título, descripción, requisitos, estado, fecha_creacion
- [ ] Modelo `Candidato`: nombre, email, teléfono, cv (FileField), vacante (FK)
- [ ] Serializers para ambos modelos
- [ ] ViewSets con CRUD completo
- [ ] Configurar URLs y CORS
- [ ] Probar endpoints en Postman

### Frontend (React)
- [ ] Setup con Vite
- [ ] Instalar Axios, React Router
- [ ] Estructura de carpetas: components, pages, services, utils
- [ ] Página `VacantesList.jsx` con tabla
- [ ] Página `VacanteForm.jsx` para crear/editar
- [ ] Página `CandidatoForm.jsx` con upload de CV
- [ ] Service `api.js` para centralizar llamadas Axios
- [ ] Routing básico

### Base de Datos
- [ ] Iniciar MySQL desde XAMPP
- [ ] Crear database `mentis_db` en phpMyAdmin
- [ ] Configurar Django para usar MySQL (mysqlclient)
- [ ] Ejecutar migraciones Django
- [ ] Verificar tablas creadas en phpMyAdmin

## 📦 Entregables

- ✅ Repositorio Git configurado
- ⏳ API REST funcional con endpoints `/api/vacantes/` y `/api/candidatos/`
- ⏳ Frontend React conectado al backend
- ⏳ Subida de archivos CV funcionando
- ⏳ Base de datos PostgreSQL configurada

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

---

**Inicio:** 06-05-2026  
**Finalización estimada:** 12-05-2026