import axios from 'axios';

// ─── URLs base ────────────────────────────────────────────────────────────────
const DJANGO_URL = 'http://localhost:8000';
const SPRING_URL = 'http://localhost:8080';

// ═══════════════════════════════════════════════════════════════════════════════
//  INSTANCIA DJANGO — admin RRHH
//  Usa access_token / refresh_token del localStorage (flujo RRHH)
// ═══════════════════════════════════════════════════════════════════════════════
const api = axios.create({
  baseURL: DJANGO_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Agrega el token de RRHH a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira (401), refresca automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(`${DJANGO_URL}/api/auth/refresh/`, { refresh });
        localStorage.setItem('access_token', res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch {
        // Refresh también expiró → logout
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ═══════════════════════════════════════════════════════════════════════════════
//  INSTANCIA SPRING BOOT — portal del candidato
//  Usa candidato_token del localStorage (JWT emitido por Spring al acceder)
//  NO tiene refresh automático — token de un solo uso con expiración fija.
//  Si expira → redirige a /candidato/expirado
// ═══════════════════════════════════════════════════════════════════════════════
export const apiSpring = axios.create({
  baseURL: SPRING_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Agrega el token del candidato a cada request
apiSpring.interceptors.request.use((config) => {
  const token = localStorage.getItem('candidato_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expiró (401) → pantalla de sesión expirada
apiSpring.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('candidato_token');
      localStorage.removeItem('candidato_data');
      window.location.href = '/candidato/expirado';
    }
    return Promise.reject(error);
  }
);