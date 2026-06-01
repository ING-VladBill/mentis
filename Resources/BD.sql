-- ============================================================
-- MENTIS — Script de datos de prueba
-- Tablas: usuarios, areas, vacantes, candidatos
-- Sprint 2 — 2026-05-26
--
-- IMPORTANTE: Después de ejecutar este script, establece
-- contraseñas válidas con Django:
--   python manage.py shell -c "
--   from usuarios.models import Usuario
--   for u in Usuario.objects.all():
--       u.set_password('Mentis2026!')
--       u.save()
--   print('Contraseñas OK')
--   "
-- ============================================================

-- Limpiar en orden: hijos primero, luego padres (respeta FK sin deshabilitar checks)

-- Django simplejwt token blacklist
DELETE FROM token_blacklist_blacklistedtoken;
DELETE FROM token_blacklist_outstandingtoken;

-- Django permisos de usuario (tablas M2M generadas por AbstractBaseUser)
DELETE FROM usuarios_user_permissions;
DELETE FROM usuarios_groups;

-- Evaluaciones
DELETE FROM preguntas_entrevista;
DELETE FROM respuestas_examen;
DELETE FROM preguntas_examen;
DELETE FROM entrevistas_ia;
DELETE FROM examenes;

-- Candidatos y relacionados
DELETE FROM tokens_acceso;
DELETE FROM candidatos;

-- Vacantes y áreas
DELETE FROM vacantes;
DELETE FROM areas;

-- Usuarios (al último, ya sin dependencias)
DELETE FROM usuarios;

-- Reiniciar IDs a 1
ALTER TABLE token_blacklist_blacklistedtoken AUTO_INCREMENT = 1;
ALTER TABLE token_blacklist_outstandingtoken AUTO_INCREMENT = 1;
ALTER TABLE preguntas_entrevista AUTO_INCREMENT = 1;
ALTER TABLE respuestas_examen    AUTO_INCREMENT = 1;
ALTER TABLE preguntas_examen     AUTO_INCREMENT = 1;
ALTER TABLE entrevistas_ia       AUTO_INCREMENT = 1;
ALTER TABLE examenes             AUTO_INCREMENT = 1;
ALTER TABLE tokens_acceso        AUTO_INCREMENT = 1;
ALTER TABLE candidatos           AUTO_INCREMENT = 1;
ALTER TABLE vacantes             AUTO_INCREMENT = 1;
ALTER TABLE areas                AUTO_INCREMENT = 1;
ALTER TABLE usuarios             AUTO_INCREMENT = 1;

-- ============================================================
-- 1. USUARIOS  (password = '!placeholder' → no permite login
--    hasta que se ejecute el comando Django de arriba)
-- ============================================================

INSERT INTO usuarios (id, password, last_login, is_superuser,
  email, nombre, apellidos, rol,
  area_responsable, telefono, foto,
  is_active, is_staff,
  fecha_creacion, fecha_modificacion, ultimo_login)
VALUES
  (1, '!placeholder', NULL, 1,
   'admin@mentis.pe', 'María', 'García Reyes', 'admin',
   'Tecnología', '999111001', NULL, 1, 1, NOW(), NOW(), NULL),

  (2, '!placeholder', NULL, 0,
   'carlos.mendoza@mentis.pe', 'Carlos', 'Mendoza Quispe', 'reclutador',
   'Recursos Humanos', '999111002', NULL, 1, 0, NOW(), NOW(), NULL),

  (3, '!placeholder', NULL, 0,
   'ana.torres@mentis.pe', 'Ana', 'Torres Vásquez', 'evaluador',
   'Tecnología', '999111003', NULL, 1, 0, NOW(), NOW(), NULL),

  (4, '!placeholder', NULL, 0,
   'luis.paredes@mentis.pe', 'Luis', 'Paredes Flores', 'gerente',
   'Operaciones', '999111004', NULL, 1, 0, NOW(), NOW(), NULL);


-- ============================================================
-- 2. ÁREAS
-- ============================================================

INSERT INTO areas (id, nombre, codigo_corto, descripcion,
  icono, color, instruccion_ia,
  activa, es_predefinida, orden,
  creada_por_id, fecha_creacion, fecha_modificacion)
VALUES
  (1, 'Tecnología de Información', 'TI',
   'Desarrollo de software, infraestructura y sistemas de información.',
   'monitor', '#2E75B6', '', 1, 1, 1, 1, NOW(), NOW()),

  (2, 'Ventas', 'VEN',
   'Gestión comercial, captación de clientes y cumplimiento de metas.',
   'trending-up', '#E74C3C', '', 1, 1, 2, 1, NOW(), NOW()),

  (3, 'Marketing', 'MKT',
   'Marketing digital, branding, campañas y comunicación externa.',
   'megaphone', '#9B59B6', '', 1, 1, 3, 1, NOW(), NOW()),

  (4, 'Recursos Humanos', 'RRHH',
   'Gestión del talento, reclutamiento y desarrollo organizacional.',
   'users', '#27AE60', '', 1, 1, 4, 1, NOW(), NOW()),

  (5, 'Finanzas', 'FIN',
   'Contabilidad, análisis financiero y control presupuestal.',
   'dollar-sign', '#F39C12', '', 1, 1, 5, 1, NOW(), NOW());


-- ============================================================
-- 3. VACANTES
-- El código lo genera Django; aquí lo insertamos manualmente.
-- ============================================================

INSERT INTO vacantes (
  id, codigo, titulo, area_id, departamento, industria,
  descripcion, responsabilidades, requisitos, requisitos_deseables,
  habilidades, tecnologias, conocimientos_especificos,
  nivel_experiencia, anios_experiencia, nivel_educativo, carrera_afin,
  modalidad, tipo_contrato, ubicacion, ciudad, pais,
  salario_minimo, salario_maximo, moneda, mostrar_salario, beneficios,
  estado, prioridad,
  score_cv_minimo, nota_minima_examen, top_candidatos_finalistas,
  creado_por_id, fecha_creacion, fecha_modificacion,
  fecha_publicacion, fecha_cierre)
VALUES
  -- ── Vacante 1 ── Desarrollador Backend Python (TI)
  (1, 'TI-2026-001', 'Desarrollador Backend Python', 1, 'Backend',
   'software',
   'Buscamos un Desarrollador Backend Python con experiencia en Django y APIs REST para nuestro equipo de tecnología.',
   'Desarrollar y mantener APIs REST con Django. Optimizar consultas MySQL. Colaborar con equipo frontend. Participar en sprints y retrospectivas.',
   'Mínimo 2 años con Python y Django. Conocimiento de MySQL o PostgreSQL. Manejo de Git y metodologías ágiles.',
   'Experiencia con Docker/Kubernetes. Conocimientos de Redis o Celery. Experiencia con microservicios.',
   'Python, Django, REST API, MySQL, Git, Docker',
   'Django REST Framework, Git, Postman, VSCode, XAMPP',
   'Django ORM, serializers, viewsets, JWT authentication, optimización de queries, migraciones, signals',
   'semi_senior', 2, 'Universitario o Técnico',
   'Ingeniería de Sistemas, Ingeniería de Software, Ciencias de la Computación',
   'hibrido', 'indefinido', 'Av. Javier Prado Este 4200, San Borja',
   'Lima', 'Perú', 3500.00, 5500.00, 'PEN', 1,
   'Seguro médico EPS, CTS, gratificaciones, bonos por desempeño, cursos online pagados.',
   'abierta', 'alta', 65, 13.00, 5,
   2, NOW(), NOW(), '2026-05-01 09:00:00', NULL),

  -- ── Vacante 2 ── Ejecutivo de Ventas B2B (VEN)
  (2, 'VEN-2026-001', 'Ejecutivo de Ventas B2B', 2, '',
   'servicios',
   'Buscamos un Ejecutivo de Ventas con experiencia en venta consultiva B2B para ampliar nuestra cartera de clientes corporativos.',
   'Prospección y captación de clientes B2B. Gestionar pipeline en CRM. Presentar propuestas comerciales. Cumplir cuota mensual.',
   'Mínimo 3 años en ventas B2B. Dominio de técnicas de cierre y manejo de objeciones. Habilidades de negociación.',
   'Experiencia con Salesforce o HubSpot. Inglés intermedio.',
   'Ventas B2B, CRM, negociación, prospección, cierre de ventas',
   'Salesforce, HubSpot, Excel, PowerPoint',
   'Técnicas de venta consultiva, manejo de objeciones, estructuración de propuestas, análisis de competencia',
   'senior', 3, 'Universitario',
   'Administración, Marketing, Negocios Internacionales',
   'presencial', 'indefinido', 'Av. Larco 1150, Miraflores',
   'Lima', 'Perú', 2500.00, 4000.00, 'PEN', 0,
   'Comisiones ilimitadas, seguro médico, línea de carrera, capacitaciones.',
   'abierta', 'urgente', 60, 13.00, 3,
   2, NOW(), NOW(), '2026-05-05 09:00:00', NULL),

  -- ── Vacante 3 ── Especialista Marketing Digital (MKT)
  (3, 'MKT-2026-001', 'Especialista en Marketing Digital', 3, '',
   'software',
   'Buscamos un especialista en marketing digital para gestionar campañas online y fortalecer la presencia digital de la empresa.',
   'Planificar y ejecutar campañas en Google Ads y Meta Ads. Gestionar redes sociales. Análisis de métricas y reportes semanales. Optimización SEO.',
   'Mínimo 2 años en marketing digital. Conocimiento en Google Ads y Meta Ads. Manejo de Google Analytics 4.',
   'Experiencia con HubSpot o Mailchimp. Conocimientos de Canva o Figma. Certificación Google Ads.',
   'Google Ads, Meta Ads, SEO, SEM, Google Analytics, email marketing',
   'Google Ads, Meta Business Suite, Google Analytics 4, HubSpot, Canva, SEMrush',
   'KPIs digitales (ROAS, CTR, CPA, CPM), estrategias de segmentación, remarketing, A/B testing',
   'junior', 2, 'Universitario o Técnico',
   'Marketing, Comunicaciones, Administración',
   'hibrido', 'plazo_fijo', 'Calle Las Begonias 520, San Isidro',
   'Lima', 'Perú', 2000.00, 3200.00, 'PEN', 1,
   'Capacitaciones en plataformas digitales, ambiente dinámico, trabajo flexible.',
   'en_proceso', 'media', 60, 13.00, 3,
   2, NOW(), NOW(), '2026-04-15 09:00:00', NULL);


-- ============================================================
-- 4. CANDIDATOS
--
-- score_final = (score_cv/100*20)*0.25 + score_examen*0.40 + score_entrevista*0.35
-- (todos los pesos presentes → peso_total = 1.0)
--
-- RANKING por vacante se obtiene con:
--   SELECT * FROM candidatos
--   WHERE vacante_id = ? ORDER BY score_final DESC, score_cv DESC;
-- ============================================================

INSERT INTO candidatos (
  id, vacante_id, usuario_cuenta_id,
  nombre, apellido_paterno, apellido_materno,
  tipo_documento, numero_documento, fecha_nacimiento, genero,
  email, telefono, ciudad, pais,
  linkedin, github, portfolio,
  cv, cv_texto_extraido,
  nivel_educativo, carrera, universidad, anios_experiencia,
  cargo_actual, empresa_actual, habilidades_declaradas,
  -- Análisis IA – CV
  cv_analizado, fecha_analisis_cv,
  score_cv, clasificacion_ia, resumen_cv,
  habilidades_detectadas, habilidades_faltantes,
  inconsistencias_cv, match_porcentaje, analisis_detallado,
  -- Override manual
  aprobado_manualmente, aprobado_por_id, nota_aprobacion,
  -- Examen
  score_examen, examen_aprobado, fecha_examen,
  -- Entrevista
  score_entrevista,
  dimension_claridad, dimension_coherencia, dimension_precision,
  dimension_comunicacion, dimension_seguridad,
  feedback_entrevista, fecha_entrevista,
  -- Score final
  score_final, posicion_ranking,
  -- Estado
  estado, es_finalista, observaciones_rrhh,
  -- Auditoría
  fecha_postulacion, fecha_modificacion, registrado_por_id)
VALUES

-- ══════════════════════════════════════════════════════════════
-- VACANTE 1 — TI-2026-001 (Desarrollador Backend Python)
-- ══════════════════════════════════════════════════════════════

-- Candidato 1.1 — Finalista #1
-- score_final = (88/100*20)*0.25 + 16.50*0.40 + 17.00*0.35 = 4.40+6.60+5.95 = 16.95
(1, 1, NULL,
 'Miguel', 'Torres', 'Ramos',
 'DNI', '74521890', '1997-03-14', 'M',
 'miguel.torres@gmail.com', '987654321', 'Lima', 'Perú',
 'https://linkedin.com/in/miguel-torres-dev', 'https://github.com/migueltorres', '',
 'cvs/2026/05/miguel_torres.pdf', '',
 'universitario', 'Ingeniería de Software', 'UNMSM', 3,
 'Desarrollador Backend', 'TechCorp SAC', 'Python, Django, REST API, PostgreSQL, Docker, Git, Redis',
 1, '2026-05-10 10:00:00',
 88, 'altamente_recomendado',
 'Perfil técnico sólido con 3 años de experiencia. Dominio de Django y buenas prácticas de API REST.',
 '["Python","Django","REST API","PostgreSQL","Docker","Git","Redis"]',
 '["Kubernetes","Microservicios"]',
 '[]', 88,
 '{"fortalezas":["Django avanzado","Experiencia relevante"],"debilidades":["Sin experiencia en Kubernetes"]}',
 0, NULL, '',
 16.50, 1, '2026-05-15 09:00:00',
 17.00,
 17.50, 16.80, 17.20, 16.90, 16.60,
 'Candidato con respuestas claras y precisas. Destaca su experiencia con APIs de alto tráfico.',
 '2026-05-20 14:00:00',
 16.95, 1,
 'finalista', 1, 'Excelente perfil técnico. Candidato prioritario.',
 '2026-05-08 09:00:00', NOW(), 2),

-- Candidato 1.2 — Finalista #2
-- score_final = (82/100*20)*0.25 + 15.00*0.40 + 15.50*0.35 = 4.10+6.00+5.425 = 15.53
(2, 1, NULL,
 'Daniela', 'Rojas', 'Fernández',
 'DNI', '76234519', '1999-07-22', 'F',
 'daniela.rojas@gmail.com', '976543210', 'Lima', 'Perú',
 'https://linkedin.com/in/daniela-rojas', 'https://github.com/danielarojas', '',
 'cvs/2026/05/daniela_rojas.pdf', '',
 'universitario', 'Ingeniería de Sistemas', 'UPC', 2,
 'Desarrolladora Backend Junior', 'Startup Digital SRL', 'Python, Django, MySQL, Git, Docker',
 1, '2026-05-10 10:30:00',
 82, 'recomendado',
 'Buena base técnica con Django. 2 años de experiencia alineados al perfil requerido.',
 '["Python","Django","MySQL","Git","Docker"]',
 '["Redis","PostgreSQL","Kubernetes"]',
 '[]', 82,
 '{"fortalezas":["Django REST","Trabajo en equipo"],"debilidades":["Poca experiencia con bases de datos avanzadas"]}',
 0, NULL, '',
 15.00, 1, '2026-05-15 11:00:00',
 15.50,
 15.00, 15.80, 15.50, 15.20, 16.00,
 'Buena comunicación técnica. Resuelve problemas con enfoque estructurado.',
 '2026-05-20 15:00:00',
 15.53, 2,
 'finalista', 1, '',
 '2026-05-08 10:00:00', NOW(), 2),

-- Candidato 1.3 — Finalista #3
-- score_final = (76/100*20)*0.25 + 14.00*0.40 + 13.50*0.35 = 3.80+5.60+4.725 = 14.13
(3, 1, NULL,
 'Roberto', 'Chávez', 'Mendoza',
 'DNI', '70987651', '2000-11-05', 'M',
 'roberto.chavez@hotmail.com', '965432109', 'Lima', 'Perú',
 '', 'https://github.com/robchavez', '',
 'cvs/2026/05/roberto_chavez.pdf', '',
 'tecnico', 'Desarrollo de Software', 'TECSUP', 2,
 'Programador Backend', 'Agencia Web Perú', 'Python, Django, MySQL, Git',
 1, '2026-05-10 11:00:00',
 76, 'recomendado',
 'Formación técnica sólida. Experiencia real en proyectos con Django y MySQL.',
 '["Python","Django","MySQL","Git"]',
 '["Docker","Redis","PostgreSQL","REST API avanzado"]',
 '[]', 76,
 '{"fortalezas":["Django básico","MySQL"],"debilidades":["Sin experiencia con Docker ni contenedores"]}',
 0, NULL, '',
 14.00, 1, '2026-05-16 09:00:00',
 13.50,
 13.00, 14.00, 13.50, 13.80, 13.20,
 'Respuestas correctas pero poco profundas. Potencial de crecimiento visible.',
 '2026-05-21 14:00:00',
 14.13, 3,
 'finalista', 1, '',
 '2026-05-09 08:00:00', NOW(), 2),

-- Candidato 1.4 — Entrevista completada, no llegó al top-5 pero está visible en ranking
-- score_final = (70/100*20)*0.25 + 13.50*0.40 + 12.00*0.35 = 3.50+5.40+4.20 = 13.10
(4, 1, NULL,
 'Patricia', 'Salas', 'Gutiérrez',
 'DNI', '72345678', '1998-06-18', 'F',
 'patricia.salas@gmail.com', '954321098', 'Lima', 'Perú',
 'https://linkedin.com/in/patricia-salas', '', '',
 'cvs/2026/05/patricia_salas.pdf', '',
 'universitario', 'Ingeniería de Sistemas', 'UTP', 2,
 'Analista de Sistemas', 'Consultora TI Lima', 'Python, SQL, Django básico, Git',
 1, '2026-05-11 09:00:00',
 70, 'recomendado',
 'Experiencia mixta entre análisis y desarrollo. Django menos profundo que el perfil.',
 '["Python","SQL","Git"]',
 '["Django avanzado","Docker","REST API","Redis"]',
 '[]', 70,
 '{"fortalezas":["Análisis de sistemas","SQL"],"debilidades":["Poca experiencia en desarrollo backend puro"]}',
 0, NULL, '',
 13.50, 1, '2026-05-16 11:00:00',
 12.00,
 12.50, 11.80, 12.00, 12.20, 11.50,
 'Conocimientos correctos pero respuestas genéricas. No destaca frente a otros finalistas.',
 '2026-05-21 16:00:00',
 13.10, 4,
 'entrevista_completada', 0, 'No alcanzó el top 5. Considerar para próxima convocatoria.',
 '2026-05-09 09:00:00', NOW(), 2),

-- Candidato 1.5 — Reprobó examen (nota < 13.00)
(5, 1, NULL,
 'Juan', 'Huanca', 'Pérez',
 'DNI', '71234567', '2001-04-10', 'M',
 'juan.huanca@gmail.com', '943210987', 'Arequipa', 'Perú',
 '', '', '',
 'cvs/2026/05/juan_huanca.pdf', '',
 'universitario', 'Ingeniería de Sistemas', 'UNSA', 1,
 'Desarrollador Junior', 'Freelance', 'Python, JavaScript, HTML, CSS',
 1, '2026-05-11 10:00:00',
 65, 'recomendado',
 'Perfil orientado a frontend. Django con poca profundidad. CV supera el mínimo.',
 '["Python","JavaScript","HTML","CSS"]',
 '["Django REST Framework","MySQL","Docker","Git avanzado"]',
 '[]', 65,
 '{"fortalezas":["Iniciativa autodidacta"],"debilidades":["Django muy básico","Sin experiencia en APIs REST"]}',
 0, NULL, '',
 11.50, 0, '2026-05-17 09:00:00',
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'examen_rechazado', 0, 'Nota de examen: 11.50/20. No supera el mínimo de 13.00.',
 '2026-05-10 14:00:00', NOW(), 2),

-- Candidato 1.6 — CV rechazado por IA (score < 65)
(6, 1, NULL,
 'Carla', 'Villarreal', 'Ríos',
 'DNI', '73456789', '2002-09-25', 'F',
 'carla.villarreal@gmail.com', '932109876', 'Lima', 'Perú',
 '', '', '',
 'cvs/2026/05/carla_villarreal.pdf', '',
 'tecnico', 'Computación e Informática', 'SENATI', 0,
 'Técnico de soporte', 'Empresa Retail SA', 'Excel, soporte técnico, redes básicas',
 1, '2026-05-12 09:00:00',
 42, 'no_apto',
 'Perfil orientado a soporte técnico. No tiene experiencia en desarrollo de software con Python.',
 '["Excel","Redes básicas"]',
 '["Python","Django","REST API","MySQL","Git","Docker"]',
 '["Cargo actual no relacionado al puesto"]', 42,
 '{"fortalezas":["Formación técnica"],"debilidades":["Sin experiencia en desarrollo","Sin Python"]}',
 0, NULL, '',
 NULL, NULL, NULL,
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'cv_rechazado', 0, 'Score CV: 42/100. No supera el mínimo de 65.',
 '2026-05-11 16:00:00', NOW(), 2),


-- ══════════════════════════════════════════════════════════════
-- VACANTE 2 — VEN-2026-001 (Ejecutivo de Ventas B2B)
-- ══════════════════════════════════════════════════════════════

-- Candidato 2.1 — Entrevista presencial agendada (ranking #1)
-- score_final = (90/100*20)*0.25 + 17.00*0.40 + 18.00*0.35 = 4.50+6.80+6.30 = 17.60
(7, 2, NULL,
 'Andrea', 'Paz', 'Castillo',
 'DNI', '70112233', '1993-02-28', 'F',
 'andrea.paz@gmail.com', '921098765', 'Lima', 'Perú',
 'https://linkedin.com/in/andrea-paz', '', '',
 'cvs/2026/05/andrea_paz.pdf', '',
 'universitario', 'Administración de Empresas', 'PUCP', 5,
 'Senior Account Executive', 'Grupo Empresarial Norte', 'Ventas B2B, Salesforce, negociación, CRM, manejo de objeciones',
 1, '2026-05-13 09:00:00',
 90, 'altamente_recomendado',
 '5 años en ventas B2B corporativas. Supera cuota en 120% promedio. Perfil muy alineado al puesto.',
 '["Ventas B2B","Salesforce","Negociación","CRM","Manejo de objeciones"]',
 '["HubSpot"]',
 '[]', 90,
 '{"fortalezas":["Historial de ventas comprobado","Liderazgo de cuenta"],"debilidades":["No conoce HubSpot"]}',
 0, NULL, '',
 17.00, 1, '2026-05-18 10:00:00',
 18.00,
 18.50, 17.80, 18.20, 17.60, 17.90,
 'Dominio total del proceso de ventas consultiva. Respuestas con métricas concretas y casos reales.',
 '2026-05-22 10:00:00',
 17.60, 1,
 'entrevista_presencial', 1, 'Top 1. Entrevista presencial el 2026-05-28.',
 '2026-05-12 09:00:00', NOW(), 2),

-- Candidato 2.2 — Finalista #2
-- score_final = (78/100*20)*0.25 + 15.50*0.40 + 14.00*0.35 = 3.90+6.20+4.90 = 15.00
(8, 2, NULL,
 'Diego', 'Morales', 'Suárez',
 'DNI', '74556677', '1995-08-15', 'M',
 'diego.morales@yahoo.com', '910987654', 'Lima', 'Perú',
 'https://linkedin.com/in/diego-morales-ventas', '', '',
 'cvs/2026/05/diego_morales.pdf', '',
 'universitario', 'Marketing', 'UPN', 4,
 'Ejecutivo Comercial', 'Distribuidora Central SA', 'Ventas B2B, negociación, CRM, prospección',
 1, '2026-05-13 10:00:00',
 78, 'recomendado',
 '4 años de experiencia comercial. Cumplimiento de metas consistente. Buen manejo de CRM.',
 '["Ventas B2B","Negociación","CRM","Prospección"]',
 '["Salesforce","HubSpot","Inglés"]',
 '[]', 78,
 '{"fortalezas":["Experiencia en distribución","Cartera consolidada"],"debilidades":["Sin certificaciones de ventas"]}',
 0, NULL, '',
 15.50, 1, '2026-05-18 12:00:00',
 14.00,
 14.20, 13.80, 14.50, 13.60, 13.90,
 'Buen conocimiento del proceso comercial. Le falta profundidad en venta consultiva técnica.',
 '2026-05-22 11:00:00',
 15.00, 2,
 'finalista', 1, '',
 '2026-05-12 10:00:00', NOW(), 2),

-- Candidato 2.3 — Finalista #3
-- score_final = (72/100*20)*0.25 + 14.00*0.40 + 13.00*0.35 = 3.60+5.60+4.55 = 13.75
(9, 2, NULL,
 'Valeria', 'Cruz', 'Hurtado',
 'DNI', '76778899', '1997-12-03', 'F',
 'valeria.cruz@gmail.com', '909876543', 'Lima', 'Perú',
 '', '', '',
 'cvs/2026/05/valeria_cruz.pdf', '',
 'universitario', 'Negocios Internacionales', 'UPC', 3,
 'Ejecutiva de Ventas', 'Comercializadora Andina', 'Ventas, prospección, manejo de cartera, Office',
 1, '2026-05-14 09:00:00',
 72, 'recomendado',
 '3 años en ventas. Experiencia mixta entre B2B y B2C. Cumplimiento de cuota al 95%.',
 '["Ventas","Prospección","Manejo de cartera","Excel"]',
 '["CRM","Salesforce","HubSpot","Técnicas de cierre avanzadas"]',
 '[]', 72,
 '{"fortalezas":["Gestión de cartera","Actitud proactiva"],"debilidades":["Sin herramientas CRM formales"]}',
 0, NULL, '',
 14.00, 1, '2026-05-18 14:00:00',
 13.00,
 13.20, 12.80, 13.10, 13.50, 12.40,
 'Respuestas correctas pero le falta experiencia en venta B2B pura. Potencial de desarrollo.',
 '2026-05-22 12:00:00',
 13.75, 3,
 'finalista', 1, '',
 '2026-05-12 11:00:00', NOW(), 2),

-- Candidato 2.4 — Examen aprobado, pendiente de entrevista
(10, 2, NULL,
 'Renato', 'Quispe', 'Apaza',
 'DNI', '71889900', '1994-05-20', 'M',
 'renato.quispe@gmail.com', '898765432', 'Lima', 'Perú',
 '', '', '',
 'cvs/2026/05/renato_quispe.pdf', '',
 'universitario', 'Administración', 'USMP', 4,
 'Representante de Ventas', 'Importadora Lima SAC', 'Ventas, negociación, relaciones comerciales',
 1, '2026-05-14 11:00:00',
 68, 'recomendado',
 'Experiencia en ventas de productos de consumo masivo. Habilidades interpersonales destacadas.',
 '["Ventas","Negociación","Relaciones comerciales"]',
 '["CRM","Salesforce","Ventas B2B","Técnicas avanzadas"]',
 '[]', 68,
 '{"fortalezas":["Relaciones interpersonales","Resiliencia"],"debilidades":["Experiencia en consumo masivo, no B2B"]}',
 0, NULL, '',
 13.00, 1, '2026-05-19 09:00:00',
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'examen_aprobado', 0, '',
 '2026-05-13 14:00:00', NOW(), 2),

-- Candidato 2.5 — CV rechazado
(11, 2, NULL,
 'Sofía', 'Mamani', 'Coaquira',
 'DNI', '73990011', '2003-01-15', 'F',
 'sofia.mamani@gmail.com', '887654321', 'Puno', 'Perú',
 '', '', '',
 'cvs/2026/05/sofia_mamani.pdf', '',
 'tecnico', 'Secretariado Ejecutivo', 'ISTP', 0,
 'Asistente administrativa', 'Empresa Local', 'Office, atención al cliente, redacción',
 1, '2026-05-15 09:00:00',
 38, 'no_apto',
 'Sin experiencia en ventas B2B ni herramientas comerciales. Perfil no alineado al puesto.',
 '["Office","Atención al cliente"]',
 '["Ventas B2B","CRM","Negociación","Prospección","Salesforce"]',
 '["No tiene experiencia en ventas"]', 38,
 '{"fortalezas":["Atención al cliente básica"],"debilidades":["Sin experiencia en ventas","Sin herramientas CRM"]}',
 0, NULL, '',
 NULL, NULL, NULL,
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'cv_rechazado', 0, 'Score CV: 38/100. No supera el mínimo de 60.',
 '2026-05-14 16:00:00', NOW(), 2),


-- ══════════════════════════════════════════════════════════════
-- VACANTE 3 — MKT-2026-001 (Especialista Marketing Digital)
-- ══════════════════════════════════════════════════════════════

-- Candidato 3.1 — Contratado (proceso cerrado)
-- score_final = (92/100*20)*0.25 + 18.00*0.40 + 19.00*0.35 = 4.60+7.20+6.65 = 18.45
(12, 3, NULL,
 'Alejandro', 'Vargas', 'Lozano',
 'DNI', '70223344', '1996-04-11', 'M',
 'alejandro.vargas@gmail.com', '876543210', 'Lima', 'Perú',
 'https://linkedin.com/in/alejandro-vargas-mkt', '', 'https://alejandrovargas.pe',
 'cvs/2026/05/alejandro_vargas.pdf', '',
 'universitario', 'Marketing', 'UPC', 4,
 'Marketing Manager', 'Agencia Digital 360', 'Google Ads, Meta Ads, SEO, SEM, GA4, HubSpot, email marketing',
 1, '2026-04-20 09:00:00',
 92, 'altamente_recomendado',
 '4 años en marketing digital. Certificado Google Ads y Meta Blueprint. Resultados medibles en ROAS y CAC.',
 '["Google Ads","Meta Ads","SEO","SEM","GA4","HubSpot","Email marketing"]',
 '[]',
 '[]', 92,
 '{"fortalezas":["Certificaciones vigentes","Historial de campañas con ROAS 4x+"],"debilidades":[]}',
 0, NULL, '',
 18.00, 1, '2026-04-25 10:00:00',
 19.00,
 19.20, 18.80, 19.00, 18.50, 19.50,
 'Candidato excepcional. Respuestas con datos concretos, cases reales y dominio de herramientas.',
 '2026-04-30 10:00:00',
 18.45, 1,
 'contratado', 1, 'Contratado. Fecha de inicio: 2026-06-02.',
 '2026-04-18 09:00:00', NOW(), 2),

-- Candidato 3.2 — Descartado tras entrevista (ranking #2, pero vacante ya cubierta)
-- score_final = (74/100*20)*0.25 + 14.50*0.40 + 12.00*0.35 = 3.70+5.80+4.20 = 13.70
(13, 3, NULL,
 'Natalia', 'Espinoza', 'Bravo',
 'DNI', '75334455', '1998-10-07', 'F',
 'natalia.espinoza@gmail.com', '865432109', 'Lima', 'Perú',
 'https://linkedin.com/in/natalia-espinoza', '', '',
 'cvs/2026/05/natalia_espinoza.pdf', '',
 'universitario', 'Comunicaciones', 'PUCP', 2,
 'Community Manager', 'Startup Fintech', 'Redes sociales, contenido, Canva, Meta Ads básico',
 1, '2026-04-20 10:00:00',
 74, 'recomendado',
 'Experiencia en gestión de redes y contenido. Meta Ads a nivel básico. Sin experiencia sólida en SEM.',
 '["Redes sociales","Contenido","Canva","Meta Ads"]',
 '["Google Ads","SEO","GA4","HubSpot","SEM"]',
 '[]', 74,
 '{"fortalezas":["Creatividad en contenido","Redes sociales"],"debilidades":["Sin experiencia en Google Ads ni SEO"]}',
 0, NULL, '',
 14.50, 1, '2026-04-25 12:00:00',
 12.00,
 12.50, 11.80, 12.20, 11.50, 12.00,
 'Conoce el área pero le falta experiencia en SEM y analítica. No alcanza el nivel requerido.',
 '2026-04-30 11:00:00',
 13.70, 2,
 'descartado', 0, 'Descartado. La vacante fue cubierta con candidato de mayor perfil.',
 '2026-04-18 10:00:00', NOW(), 2),

-- Candidato 3.3 — Entrevista en curso
(14, 3, NULL,
 'Fernando', 'Lazo', 'Palomino',
 'DNI', '72445566', '1997-06-25', 'M',
 'fernando.lazo@gmail.com', '854321098', 'Lima', 'Perú',
 '', 'https://github.com/flazopm', '',
 'cvs/2026/05/fernando_lazo.pdf', '',
 'universitario', 'Marketing Digital', 'UTP', 2,
 'Analista SEM', 'Agencia Publicidad Digital', 'Google Ads, SEO, GA4, SEMrush',
 1, '2026-04-21 09:00:00',
 80, 'recomendado',
 'Perfil técnico en SEM y analítica. 2 años como analista. Alineado a los requisitos del puesto.',
 '["Google Ads","SEO","GA4","SEMrush"]',
 '["Meta Ads","HubSpot","Email marketing"]',
 '[]', 80,
 '{"fortalezas":["Google Ads certificado","Analítica web"],"debilidades":["Sin experiencia en Meta Ads"]}',
 0, NULL, '',
 15.00, 1, '2026-04-26 09:00:00',
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'entrevista_en_curso', 0, '',
 '2026-04-20 14:00:00', NOW(), 2),

-- Candidato 3.4 — CV aprobado, pendiente de examen
(15, 3, NULL,
 'Camila', 'Herrera', 'Salinas',
 'DNI', '76556677', '2000-03-18', 'F',
 'camila.herrera@gmail.com', '843210987', 'Lima', 'Perú',
 'https://linkedin.com/in/camila-herrera-mkt', '', '',
 'cvs/2026/05/camila_herrera.pdf', '',
 'tecnico', 'Marketing y Publicidad', 'ISIL', 1,
 'Asistente de Marketing', 'Empresa Retail Lima', 'Redes sociales, Meta Ads básico, Canva, email marketing',
 1, '2026-04-22 09:00:00',
 67, 'recomendado',
 'Perfil junior con buen potencial. 1 año de experiencia en marketing digital básico.',
 '["Redes sociales","Meta Ads","Canva","Email marketing"]',
 '["Google Ads","SEO","GA4","SEM","HubSpot"]',
 '[]', 67,
 '{"fortalezas":["Creatividad","Iniciativa"],"debilidades":["Experiencia muy básica en herramientas SEM"]}',
 0, NULL, '',
 NULL, NULL, NULL,
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'cv_aprobado', 0, '',
 '2026-04-21 16:00:00', NOW(), 2),

-- Candidato 3.5 — Recién postulado, sin análisis aún
(16, 3, NULL,
 'Jesús', 'Cano', 'Flores',
 'DNI', '74667788', '2001-08-30', 'M',
 'jesus.cano@gmail.com', '832109876', 'Lima', 'Perú',
 '', '', '',
 'cvs/2026/05/jesus_cano.pdf', '',
 'universitario', 'Administración', 'UNMSM', 0,
 '', '', 'Marketing digital, redes sociales',
 0, NULL,
 NULL, '', '',
 '[]', '[]', '[]', NULL, '{}',
 0, NULL, '',
 NULL, NULL, NULL,
 NULL,
 NULL, NULL, NULL, NULL, NULL,
 '', NULL,
 NULL, NULL,
 'postulado', 0, '',
 '2026-05-25 17:00:00', NOW(), 2);


-- ============================================================
-- CONSULTA DE RANKING POR VACANTE (referencia)
--
-- Ranking general de candidatos por vacante:
--   SELECT
--     c.posicion_ranking,
--     CONCAT(c.nombre,' ',c.apellido_paterno) AS candidato,
--     c.score_cv, c.score_examen, c.score_entrevista,
--     c.score_final, c.clasificacion_ia, c.estado
--   FROM candidatos c
--   WHERE c.vacante_id = 1
--   ORDER BY c.score_final DESC, c.score_cv DESC;
-- ============================================================
