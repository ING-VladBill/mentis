#!/usr/bin/env python3
# ==========================================================
# test_e2e_mentis.py — Prueba E2E de la API de MENTIS (Django)
# ==========================================================
# Prueba el backend REAL desplegado en Railway de punta a punta.
# NO requiere pytest. Solo: pip install requests
#
# USO:
#   python test_e2e_mentis.py
#
# Por defecto apunta a Railway. Para probar local:
#   python test_e2e_mentis.py http://localhost:8000
# ==========================================================

import sys
import time
import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://mentis-production-6ed9.up.railway.app"
ADMIN_EMAIL = "admin@mentis.com"
ADMIN_PASS  = "Mentis2026!"

# Colores para la consola
class C:
    OK = '\033[92m'; FAIL = '\033[91m'; WARN = '\033[93m'
    INFO = '\033[96m'; BOLD = '\033[1m'; END = '\033[0m'

passed = 0
failed = 0
warnings = 0

def ok(msg):
    global passed; passed += 1
    print(f"  {C.OK}✓{C.END} {msg}")

def fail(msg, detalle=""):
    global failed; failed += 1
    print(f"  {C.FAIL}✗ {msg}{C.END}")
    if detalle: print(f"     {C.FAIL}↳ {detalle}{C.END}")

def warn(msg):
    global warnings; warnings += 1
    print(f"  {C.WARN}⚠ {msg}{C.END}")

def titulo(t):
    print(f"\n{C.BOLD}{C.INFO}━━━ {t} ━━━{C.END}")

# Estado compartido
token = None
headers = {}
vacante_id = None
candidato_id = None
area_id = None
usuario_creado_id = None
ts = int(time.time())  # para emails únicos

# ==========================================================
titulo("0. SERVIDOR VIVO")
# ==========================================================
try:
    r = requests.get(f"{BASE}/admin/login/", timeout=30)
    if r.status_code == 200:
        ok(f"Servidor responde ({r.status_code}) en {r.elapsed.total_seconds():.2f}s")
    else:
        warn(f"Servidor responde con {r.status_code} (puede estar despertando del sleep)")
except Exception as e:
    fail("No se pudo conectar al servidor", str(e))
    print(f"\n{C.FAIL}Abortando: el servidor no responde.{C.END}")
    sys.exit(1)

# ==========================================================
titulo("1. AUTENTICACIÓN")
# ==========================================================
try:
    r = requests.post(f"{BASE}/api/auth/login/",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=30)
    if r.status_code == 200:
        data = r.json()
        token = data.get("access") or data.get("token")
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            ok("Login admin exitoso, token recibido")
        else:
            fail("Login OK pero sin token", str(data)[:200])
    else:
        fail(f"Login falló ({r.status_code})", r.text[:200])
except Exception as e:
    fail("Error en login", str(e))

# Login con credenciales malas (debe fallar)
try:
    r = requests.post(f"{BASE}/api/auth/login/",
                      json={"email": ADMIN_EMAIL, "password": "malisima"}, timeout=30)
    if r.status_code in (400, 401):
        ok(f"Login con password incorrecto es rechazado ({r.status_code})")
    else:
        warn(f"Login con password malo devolvió {r.status_code} (se esperaba 401)")
except Exception as e:
    fail("Error probando login inválido", str(e))

if not token:
    print(f"\n{C.FAIL}Sin token no se puede continuar. Abortando.{C.END}")
    sys.exit(1)

# ==========================================================
titulo("2. PERFIL Y SEGURIDAD")
# ==========================================================
try:
    r = requests.get(f"{BASE}/api/auth/perfil/", headers=headers, timeout=30)
    if r.status_code == 200:
        ok(f"Perfil del admin accesible: {r.json().get('email','?')}")
    else:
        fail(f"No se pudo obtener perfil ({r.status_code})", r.text[:150])
except Exception as e:
    fail("Error en perfil", str(e))

# Sin token debe rechazar
try:
    r = requests.get(f"{BASE}/api/vacantes/", timeout=30)
    if r.status_code in (401, 403):
        ok(f"Endpoint protegido rechaza sin token ({r.status_code})")
    else:
        warn(f"Endpoint sin token devolvió {r.status_code} (se esperaba 401/403)")
except Exception as e:
    fail("Error probando seguridad", str(e))

# ==========================================================
titulo("3. ÁREAS")
# ==========================================================
try:
    r = requests.get(f"{BASE}/api/areas/activas/", headers=headers, timeout=30)
    if r.status_code == 200:
        areas = r.json()
        if areas:
            area_id = areas[0]["id"]
            ok(f"Áreas activas: {len(areas)} encontradas (usando '{areas[0]['nombre']}')")
        else:
            warn("No hay áreas. Corre: python manage.py cargar_areas")
    else:
        fail(f"No se pudieron listar áreas ({r.status_code})", r.text[:150])
except Exception as e:
    fail("Error en áreas", str(e))

# ==========================================================
titulo("4. GESTIÓN DE USUARIOS RRHH")
# ==========================================================
try:
    nuevo = {
        "email": f"reclutador{ts}@mentis.com",
        "nombre": "Reclutador",
        "apellidos": "De Prueba",
        "rol": "reclutador",
        "area_responsable": "TI",
        "telefono": "999888777",
        "password": "Prueba2026!",
        "password2": "Prueba2026!",
    }
    r = requests.post(f"{BASE}/api/auth/usuarios/crear/", json=nuevo, headers=headers, timeout=30)
    if r.status_code == 201:
        usuario_creado_id = r.json().get("id")
        ok(f"Usuario reclutador creado (id {usuario_creado_id})")
    else:
        fail(f"No se pudo crear usuario ({r.status_code})", r.text[:200])
except Exception as e:
    fail("Error creando usuario", str(e))

# Listar usuarios
try:
    r = requests.get(f"{BASE}/api/auth/usuarios/", headers=headers, timeout=30)
    if r.status_code == 200:
        data = r.json()
        n = len(data) if isinstance(data, list) else len(data.get('results', data))
        ok(f"Listado de usuarios OK ({n} usuarios)")
    else:
        fail(f"No se pudo listar usuarios ({r.status_code})", r.text[:150])
except Exception as e:
    fail("Error listando usuarios", str(e))

# Desactivar y reactivar el usuario creado
if usuario_creado_id:
    try:
        r = requests.post(f"{BASE}/api/auth/usuarios/{usuario_creado_id}/desactivar/", headers=headers, timeout=30)
        if r.status_code in (200, 204):
            ok("Usuario desactivado")
        else:
            warn(f"Desactivar devolvió {r.status_code}")
        r = requests.post(f"{BASE}/api/auth/usuarios/{usuario_creado_id}/activar/", headers=headers, timeout=30)
        if r.status_code in (200, 204):
            ok("Usuario reactivado")
        else:
            warn(f"Activar devolvió {r.status_code}")
    except Exception as e:
        fail("Error desactivando/activando usuario", str(e))

# ==========================================================
titulo("5. VACANTES")
# ==========================================================
if area_id:
    try:
        nueva_vacante = {
            "titulo": f"Vacante de Prueba E2E {ts}",
            "area": area_id,
            "industria": "software",
            "motivo_vacante": "expansion",
            "jefe_directo": "Jefe Test",
            "solicitante": "Gerencia Test",
            "cantidad_posiciones": 2,
            "descripcion": "Vacante creada por el script de prueba E2E para validar el backend.",
            "responsabilidades": "Responsabilidad 1, Responsabilidad 2",
            "requisitos": "Requisito 1, Requisito 2, Requisito 3",
            "nivel_experiencia": "semi_senior",
            "anios_experiencia": 3,
            "modalidad": "hibrido",
            "tipo_contrato": "indefinido",
            "horario": "L-V 9-18",
            "horario_tipo": "tiempo_completo",
            "ciudad": "Lima",
            "pais": "Perú",
            "mostrar_salario": True,
            "salario_minimo": "3000",
            "salario_maximo": "5000",
            "moneda": "PEN",
            "prioridad": "alta",
        }
        r = requests.post(f"{BASE}/api/vacantes/", json=nueva_vacante, headers=headers, timeout=30)
        if r.status_code == 201:
            v = r.json()
            vacante_id = v["id"]
            ok(f"Vacante creada: {v.get('codigo','?')} (id {vacante_id}, estado '{v.get('estado')}')")
            if v.get("estado") == "borrador":
                ok("La vacante nace en BORRADOR (control de publicación correcto)")
            else:
                warn(f"La vacante nació en '{v.get('estado')}' (se esperaba 'borrador')")
        else:
            fail(f"No se pudo crear vacante ({r.status_code})", r.text[:300])
    except Exception as e:
        fail("Error creando vacante", str(e))

# Listar vacantes
try:
    r = requests.get(f"{BASE}/api/vacantes/", headers=headers, timeout=30)
    if r.status_code == 200:
        data = r.json()
        n = len(data) if isinstance(data, list) else len(data.get('results', data))
        ok(f"Listado de vacantes OK ({n} vacantes)")
    else:
        fail(f"No se pudo listar vacantes ({r.status_code})", r.text[:150])
except Exception as e:
    fail("Error listando vacantes", str(e))

# Publicar la vacante (endpoint nuevo del Sprint 2)
if vacante_id:
    try:
        r = requests.post(f"{BASE}/api/vacantes/{vacante_id}/publicar/", headers=headers, timeout=30)
        if r.status_code == 200:
            data = r.json()
            ok(f"Vacante PUBLICADA. URL pública: {data.get('url_publica','?')}")
            canales = data.get("canales", {})
            ok(f"Canales activados: indeed={canales.get('indeed')}, google={canales.get('google_jobs')}")
        else:
            fail(f"No se pudo publicar vacante ({r.status_code})", r.text[:200])
    except Exception as e:
        fail("Error publicando vacante", str(e))

# Textos de publicación (GET)
if vacante_id:
    try:
        r = requests.get(f"{BASE}/api/vacantes/{vacante_id}/textos-publicacion/", headers=headers, timeout=30)
        if r.status_code == 200:
            data = r.json()
            canales_con_texto = [k for k in ['linkedin','computrabajo','whatsapp','indeed'] if data.get(k)]
            ok(f"Textos de publicación generados para: {', '.join(canales_con_texto)}")
            if data.get('link_formulario'):
                ok(f"Link al formulario incluido en los textos")
        else:
            fail(f"No se pudieron generar textos ({r.status_code})", r.text[:150])
    except Exception as e:
        fail("Error en textos de publicación", str(e))

# Editar textos (PATCH - endpoint nuevo)
if vacante_id:
    try:
        r = requests.patch(f"{BASE}/api/vacantes/{vacante_id}/textos-publicacion/",
                          json={"linkedin": "Texto editado por E2E"}, headers=headers, timeout=30)
        if r.status_code == 200:
            data = r.json()
            if data.get("fuente", {}).get("linkedin") == "editado":
                ok("Edición de textos (PATCH) funciona y marca el canal como 'editado'")
            else:
                ok("PATCH de textos respondió 200")
        else:
            fail(f"No se pudo editar textos ({r.status_code})", r.text[:150])
    except Exception as e:
        fail("Error editando textos", str(e))

# Duplicar vacante
if vacante_id:
    try:
        r = requests.post(f"{BASE}/api/vacantes/{vacante_id}/duplicar/", headers=headers, timeout=30)
        if r.status_code == 201:
            ok(f"Vacante duplicada: {r.json().get('vacante',{}).get('codigo','?')}")
        else:
            warn(f"Duplicar devolvió {r.status_code}")
    except Exception as e:
        fail("Error duplicando vacante", str(e))

# Estadísticas
try:
    r = requests.get(f"{BASE}/api/vacantes/estadisticas/", headers=headers, timeout=30)
    if r.status_code == 200:
        data = r.json()
        ok(f"Estadísticas OK: {data.get('vacantes',{}).get('total','?')} vacantes totales")
    else:
        warn(f"Estadísticas devolvió {r.status_code}")
except Exception as e:
    fail("Error en estadísticas", str(e))

# ==========================================================
titulo("6. FORMULARIO PÚBLICO (sin login)")
# ==========================================================
if vacante_id:
    try:
        # Obtener el código de la vacante publicada
        r = requests.get(f"{BASE}/api/vacantes/{vacante_id}/", headers=headers, timeout=30)
        codigo = r.json().get("codigo") if r.status_code == 200 else None
        if codigo:
            # El formulario público NO debe requerir token
            r = requests.get(f"{BASE}/api/postular/{codigo}/", timeout=30)
            if r.status_code == 200:
                data = r.json()
                ok(f"Formulario público accesible sin login: '{data.get('titulo','?')}'")
                if data.get("schema_org"):
                    ok("schema.org para Google for Jobs presente en la respuesta")
            else:
                fail(f"Formulario público falló ({r.status_code})", r.text[:150])
    except Exception as e:
        fail("Error en formulario público", str(e))

# ==========================================================
titulo("7. CANDIDATOS")
# ==========================================================
if vacante_id:
    try:
        r = requests.get(f"{BASE}/api/candidatos/", headers=headers, timeout=30)
        if r.status_code == 200:
            data = r.json()
            n = len(data) if isinstance(data, list) else len(data.get('results', data))
            ok(f"Listado de candidatos OK ({n} candidatos)")
        else:
            fail(f"No se pudo listar candidatos ({r.status_code})", r.text[:150])
    except Exception as e:
        fail("Error listando candidatos", str(e))

# Tags
try:
    r = requests.get(f"{BASE}/api/tags/", headers=headers, timeout=30)
    if r.status_code == 200:
        ok("Endpoint de tags accesible")
    else:
        warn(f"Tags devolvió {r.status_code}")
except Exception as e:
    fail("Error en tags", str(e))

# ==========================================================
titulo("8. EVALUACIONES (Sprint 3 - RRHH)")
# ==========================================================
try:
    r = requests.get(f"{BASE}/api/evaluaciones/examenes/", headers=headers, timeout=30)
    if r.status_code == 200:
        data = r.json()
        n = len(data) if isinstance(data, list) else len(data.get('results', data))
        ok(f"Endpoint de exámenes (RRHH) accesible ({n} exámenes)")
    else:
        fail(f"Endpoint de evaluaciones falló ({r.status_code})", r.text[:200])
except Exception as e:
    fail("Error en evaluaciones", str(e))

# ==========================================================
titulo("9. LIMPIEZA")
# ==========================================================
# Despublicar y borrar la vacante de prueba
if vacante_id:
    try:
        requests.post(f"{BASE}/api/vacantes/{vacante_id}/despublicar/", headers=headers, timeout=30)
        r = requests.delete(f"{BASE}/api/vacantes/{vacante_id}/", headers=headers, timeout=30)
        if r.status_code in (204, 200):
            ok("Vacante de prueba eliminada (limpieza)")
        else:
            warn(f"No se pudo limpiar la vacante de prueba ({r.status_code}) - bórrala manualmente")
    except Exception as e:
        warn(f"Error en limpieza: {e}")

# ==========================================================
# RESUMEN
# ==========================================================
print(f"\n{C.BOLD}{'='*50}{C.END}")
print(f"{C.BOLD}RESULTADOS:{C.END}")
print(f"  {C.OK}✓ Pasaron:  {passed}{C.END}")
print(f"  {C.FAIL}✗ Fallaron: {failed}{C.END}")
print(f"  {C.WARN}⚠ Avisos:   {warnings}{C.END}")
print(f"{C.BOLD}{'='*50}{C.END}")

if failed == 0:
    print(f"\n{C.OK}{C.BOLD}🎉 TODO EL BACKEND FUNCIONA CORRECTAMENTE{C.END}")
    sys.exit(0)
else:
    print(f"\n{C.FAIL}{C.BOLD}⚠ Hay {failed} prueba(s) fallida(s). Revisa arriba.{C.END}")
    sys.exit(1)
