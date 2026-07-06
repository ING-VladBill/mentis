import {
  BrowserRouter, Routes, Route, NavLink,
  useLocation, useNavigate, Navigate,
} from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import VacantesList   from './pages/VacantesList';
import VacanteForm    from './pages/VacanteForm';
import VacanteDetalle from './pages/VacanteDetalle';
import CandidatoForm  from './pages/CandidatoForm';
import CandidatosList from './pages/CandidatosList';
import CandidatoDetalle from './pages/CandidatoDetalle';
import Login          from './pages/Login';
import Usuarios       from './pages/Usuarios';
import Areas          from './pages/Areas';
import Ranking        from './pages/Ranking';
import BancoTalento         from './pages/BancoTalento';
import EntrevistasIA        from './pages/EntrevistasIA';
import EntrevistaDetalle    from './pages/EntrevistaDetalle';
import CargaMasiva    from './pages/CargaMasiva';
import Postular       from './pages/Postular';
import Evaluaciones   from './pages/Evaluaciones';
import ExamenDetalle  from './pages/ExamenDetalle';
import Auditoria      from './pages/Auditoria';
// ─── Portal candidato — descomenta cuando copies la carpeta src/pages/candidato/ ──
import AccesoCandidato      from './pages/candidato/Acceso';
import ExamenInstrucciones  from './pages/candidato/ExamenInstrucciones';
import Examen               from './pages/candidato/Examen';
import ExamenFinalizado     from './pages/candidato/ExamenFinalizado';
import Progreso             from './pages/candidato/Progreso';
import SesionExpirada       from './pages/candidato/SesionExpirada';
import EntrevistaVoz        from './pages/candidato/EntrevistaVoz';
import RedireccionadorCandidato from './pages/RedireccionadorCandidato';
import ProtectedRoute from './components/ProtectedRoute';
import api            from './services/api';
import { qk } from './lib/queryKeys';

// ─── Theme Context ────────────────────────────────────────────────────────────
import { ThemeContext, useTheme } from './ThemeContext';

function tokens(dark) {
  return dark ? {
    bg:           '#13131a',
    sidebar:      '#0c0c10',
    sidebarBorder:'rgba(255,255,255,0.055)',
    topbar:       '#0f0f14',
    card:         '#1a1a24',
    cardBorder:   'rgba(255,255,255,0.07)',
    text:         '#f0f0f0',
    textMuted:    'rgba(255,255,255,0.38)',
    textFaint:    'rgba(255,255,255,0.22)',
    navActive:    'rgba(124,58,237,0.16)',
    navText:      'rgba(255,255,255,0.42)',
    navActiveText:'#e2d9ff',
    inputBg:      'rgba(255,255,255,0.04)',
    inputBorder:  'rgba(255,255,255,0.1)',
    divider:      'rgba(255,255,255,0.055)',
    rowHover:     'rgba(255,255,255,0.025)',
    toggleBg:     'rgba(255,255,255,0.08)',
    toggleIcon:   '🌙',
  } : {
    bg:           '#f4f4f8',
    sidebar:      '#ffffff',
    sidebarBorder:'rgba(0,0,0,0.08)',
    topbar:       '#ffffff',
    card:         '#ffffff',
    cardBorder:   'rgba(0,0,0,0.08)',
    text:         '#111118',
    textMuted:    'rgba(0,0,0,0.45)',
    textFaint:    'rgba(0,0,0,0.28)',
    navActive:    'rgba(124,58,237,0.1)',
    navText:      'rgba(0,0,0,0.45)',
    navActiveText:'#5b21b6',
    inputBg:      'rgba(0,0,0,0.03)',
    inputBorder:  'rgba(0,0,0,0.12)',
    divider:      'rgba(0,0,0,0.07)',
    rowHover:     'rgba(0,0,0,0.025)',
    toggleBg:     'rgba(0,0,0,0.06)',
    toggleIcon:   '☀️',
  };
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const { dark, toggle, t } = useTheme();
  const navigate = useNavigate();

  const usuario  = JSON.parse(localStorage.getItem('usuario') || '{}');
  const nombre   = usuario.nombre || 'Usuario';
  const rol      = usuario.rol_display || usuario.rol || 'RRHH';
  const partes   = nombre.trim().split(' ');
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : nombre.slice(0, 2).toUpperCase();

  const esAdmin = (usuario.rol === 'admin');
  const NAV_MAIN = [
    { to: '/vacantes',      icon: 'ti-briefcase',      label: 'Vacantes'        },
    { to: '/candidatos',    icon: 'ti-users',          label: 'Candidatos'      },
    { to: '/evaluaciones',  icon: 'ti-clipboard-list', label: 'Evaluaciones'    },
    { to: '/entrevistas',   icon: 'ti-robot',          label: 'Entrevistas IA'  },
    { to: '/auditoria',     icon: 'ti-shield-check',   label: 'Auditoría'       },
    { to: '/ranking',       icon: 'ti-trophy',         label: 'Ranking'         },
    { to: '/banco-talento', icon: 'ti-star',           label: 'Banco de talento'},
    { to: '/carga-masiva',  icon: 'ti-files',          label: 'Carga masiva'    },
    { to: '/areas',         icon: 'ti-layout-grid',    label: 'Áreas'           },
    // "Usuarios" solo lo ve el administrador (superuser)
    ...(esAdmin ? [{ to: '/usuarios', icon: 'ti-users-group', label: 'Usuarios' }] : []),
  ];


  async function handleLogout() {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await api.post('/api/auth/logout/', { refresh });
    } catch {
      // Si falla el logout en el backend, igual limpiamos
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  }

  return (
    <aside style={{
      width: 224, minHeight: '100vh',
      background: t.sidebar,
      borderRight: `1px solid ${t.sidebarBorder}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      transition: 'background 0.25s, border-color 0.25s',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 18px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(140deg,#7c3aed 10%,#4f46e5 90%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124,58,237,0.3)',
          }}>
            <i className="ti ti-brain" style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: t.text, letterSpacing: '0.07em' }}>MENTIS</div>
            <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: '0.1em', marginTop: 1 }}>RECLUTAMIENTO IA</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: '0.14em', padding: '6px 10px 8px', fontWeight: 600 }}>SPRINT 3</div>
        {NAV_MAIN.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8, marginBottom: 2,
            textDecoration: 'none', fontSize: 13.5,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? t.navActiveText : t.navText,
            background: isActive ? t.navActive : 'transparent',
            transition: 'all 0.15s', position: 'relative',
          })}>
            {({ isActive }) => (<>
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 3px 3px 0', background: '#7c3aed',
                }} />
              )}
              <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
              {label}
            </>)}
          </NavLink>
        ))}

      </nav>


      {/* Dark mode toggle */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        <button onClick={toggle} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 9,
          background: t.toggleBg, border: 'none',
          cursor: 'pointer', fontSize: 13, color: t.textMuted,
          transition: 'all 0.2s',
        }}>
          <span style={{ fontSize: 16 }}>{t.toggleIcon}</span>
          {dark ? 'Modo oscuro' : 'Modo claro'}
          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              width: 34, height: 18, borderRadius: 9,
              background: dark ? '#7c3aed' : 'rgba(0,0,0,0.15)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: dark ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </button>
      </div>

      {/* Usuario + logout */}
      <div style={{
        padding: '12px 14px',
        borderTop: `1px solid ${t.sidebarBorder}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(124,58,237,0.15)',
          border: '1.5px solid rgba(124,58,237,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#a78bfa',
        }}>{iniciales}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
          <div style={{ fontSize: 11, color: t.textFaint, textTransform: 'capitalize' }}>{rol}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textFaint, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = t.textFaint}
        >
          <i className="ti ti-logout" style={{ fontSize: 16 }} />
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }) {
  const { t } = useTheme();
  return (
    <header style={{
      height: 58, background: t.topbar,
      borderBottom: `1px solid ${t.sidebarBorder}`,
      display: 'flex', alignItems: 'center',
      padding: '0 26px', gap: 16,
      position: 'sticky', top: 0, zIndex: 50,
      transition: 'background 0.25s, border-color 0.25s',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: t.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <CampanaNotificaciones t={t} />
    </header>
  );
}

// ─── Campana de notificaciones (alertas de RRHH: riesgo alto, etc.) ───────────
function CampanaNotificaciones({ t }) {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // refetchInterval: esta es la ÚNICA vista del admin que sí necesita
  // "detectar cambios" de verdad (nuevas alertas de riesgo pueden llegar en
  // cualquier momento sin que el propio usuario haga nada) — por eso, y solo
  // aquí, usamos polling cada minuto en vez de depender de invalidación por
  // acción del usuario.
  const { data } = useQuery({
    queryKey: qk.notificaciones.noLeidas,
    queryFn: async () => {
      const { data } = await api.get('/api/notificaciones/no-leidas/');
      return data;
    },
    refetchInterval: 60000,
  });
  const notis = data?.notificaciones || [];
  const noLeidas = data?.total || 0;

  const marcarLeidaMutation = useMutation({
    mutationFn: (n) => api.post(`/api/notificaciones/${n.id}/marcar-leida/`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.notificaciones.noLeidas }),
  });

  const marcarTodasMutation = useMutation({
    mutationFn: () => api.post('/api/notificaciones/marcar-todas-leidas/'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.notificaciones.noLeidas }),
  });

  function abrir(n) {
    marcarLeidaMutation.mutate(n);
    setAbierto(false);
    if (n.candidato) navigate(`/candidatos/${n.candidato}`);
  }

  function marcarTodas() {
    marcarTodasMutation.mutate();
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setAbierto(a => !a)} title="Notificaciones"
        style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-bell" style={{ fontSize: 18 }} />
        {noLeidas > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{ position: 'absolute', top: 48, right: 0, width: 340, maxHeight: 440, overflowY: 'auto', background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 14, boxShadow: '0 16px 44px rgba(0,0,0,0.22)', zIndex: 100, animation: 'notiPop 0.18s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: `1px solid ${t.cardBorder}` }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>Notificaciones</span>
              {noLeidas > 0 && <button onClick={marcarTodas} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Marcar todas</button>}
            </div>
            {notis.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: t.textMuted, fontSize: 13 }}>
                <i className="ti ti-check" style={{ fontSize: 26, color: t.textFaint, display: 'block', marginBottom: 8 }} />
                Todo al día
              </div>
            ) : notis.map(n => (
              <div key={n.id} onClick={() => abrir(n)}
                style={{ padding: '13px 16px', borderBottom: `1px solid ${t.cardBorder}`, cursor: 'pointer', display: 'flex', gap: 11, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: n.tipo === 'riesgo_examen' ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={n.tipo === 'riesgo_examen' ? 'ti ti-alert-triangle' : 'ti ti-bell'} style={{ fontSize: 16, color: n.tipo === 'riesgo_examen' ? '#ef4444' : '#7c3aed' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginBottom: 2 }}>{n.titulo}</div>
                  <div style={{ fontSize: 11.5, color: t.textMuted, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.mensaje}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const PAGE_META = {
  '/vacantes':             { title: 'Vacantes',            subtitle: 'Gestiona todos los puestos de trabajo' },
  '/vacantes/nueva':       { title: 'Nueva vacante',       subtitle: 'Crear una nueva posición' },
  '/candidatos':           { title: 'Candidatos',          subtitle: 'Listado de todos los postulantes' },
  '/candidatos/registrar': { title: 'Registrar candidato', subtitle: 'Agregar nuevo postulante' },
  '/evaluaciones':         { title: 'Evaluaciones',        subtitle: 'Exámenes técnicos de candidatos' },
  '/auditoria':            { title: 'Auditoría',           subtitle: 'Integridad de exámenes y eventos de proctoring' },
  '/banco-talento':        { title: 'Banco de talento',    subtitle: 'Candidatos destacados guardados para futuras vacantes' },
  '/entrevistas':          { title: 'Entrevistas IA',      subtitle: 'Resultados y auditoría de las entrevistas con EVA' },
  '/carga-masiva':         { title: 'Carga masiva',        subtitle: 'Sube múltiples CVs en un solo lote' },
  '/areas':                { title: 'Áreas',               subtitle: 'Gestión de áreas y etiquetas' },
  '/usuarios':             { title: 'Usuarios',            subtitle: 'Equipo de recursos humanos' },
};

function Layout() {
  const { t } = useTheme();
  const location = useLocation();
  const editMatch   = location.pathname.match(/^\/vacantes\/(\d+)\/editar$/);
  const vacMatch    = location.pathname.match(/^\/vacantes\/(\d+)$/);
  const detailMatch = location.pathname.match(/^\/candidatos\/(\d+)$/);
  const evalMatch   = location.pathname.match(/^\/evaluaciones\/(\d+)$/);
  const entMatch    = location.pathname.match(/^\/entrevistas\/(\d+)$/);
  const meta = editMatch
    ? { title: 'Editar vacante',     subtitle: `Modificando vacante #${editMatch[1]}` }
    : vacMatch
    ? { title: 'Detalle de vacante', subtitle: `Vacante #${vacMatch[1]}` }
    : detailMatch
    ? { title: 'Detalle candidato',  subtitle: `Candidato #${detailMatch[1]}` }
    : evalMatch
    ? { title: 'Detalle de examen',  subtitle: `Examen #${evalMatch[1]}` }
    : entMatch
    ? { title: 'Detalle de entrevista', subtitle: `Entrevista con EVA #${entMatch[1]}` }
    : (PAGE_META[location.pathname] || { title: 'MENTIS', subtitle: '' });

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: t.bg, color: t.text,
      fontFamily: 'system-ui,-apple-system,sans-serif',
      transition: 'background 0.25s, color 0.25s',
    }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 224, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main style={{ flex: 1, padding: '26px 28px' }}>
          <Routes>
            <Route path="/vacantes"              element={<ProtectedRoute><VacantesList /></ProtectedRoute>} />
            <Route path="/vacantes/nueva"        element={<ProtectedRoute><VacanteForm /></ProtectedRoute>} />
            <Route path="/vacantes/:id"          element={<ProtectedRoute><VacanteDetalle /></ProtectedRoute>} />
            <Route path="/vacantes/:id/editar"   element={<ProtectedRoute><VacanteForm /></ProtectedRoute>} />
            <Route path="/candidatos"            element={<ProtectedRoute><CandidatosList /></ProtectedRoute>} />
            <Route path="/candidatos/registrar"  element={<ProtectedRoute><CandidatoForm /></ProtectedRoute>} />
            <Route path="/candidatos/:id"        element={<ProtectedRoute><CandidatoDetalle /></ProtectedRoute>} />
            <Route path="/ranking"               element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
            <Route path="/banco-talento"         element={<ProtectedRoute><BancoTalento /></ProtectedRoute>} />
            <Route path="/entrevistas"           element={<ProtectedRoute><EntrevistasIA /></ProtectedRoute>} />
            <Route path="/entrevistas/:id"       element={<ProtectedRoute><EntrevistaDetalle /></ProtectedRoute>} />
            <Route path="/evaluaciones"          element={<ProtectedRoute><Evaluaciones /></ProtectedRoute>} />
            <Route path="/evaluaciones/:id"      element={<ProtectedRoute><ExamenDetalle /></ProtectedRoute>} />
            <Route path="/auditoria"             element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
            <Route path="/carga-masiva"          element={<ProtectedRoute><CargaMasiva /></ProtectedRoute>} />
            <Route path="/areas"                 element={<ProtectedRoute><Areas /></ProtectedRoute>} />
            <Route path="/usuarios"              element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ─── Portal del candidato — descomenta cuando copies src/pages/candidato/ ────
function PortalCandidato() {
  return (
    <Routes>
      <Route path="acceso"        element={<AccesoCandidato />} />
      <Route path="entrevista"    element={<EntrevistaVoz />} />
      <Route path="instrucciones" element={<ExamenInstrucciones />} />
      <Route path="examen"        element={<Examen />} />
      <Route path="finalizado"    element={<ExamenFinalizado />} />
      <Route path="progreso"      element={<Progreso />} />
      <Route path="expirado"      element={<SesionExpirada />} />
    </Routes>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('mentis-theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('mentis-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const t = tokens(dark);

  // ─── Estilos globales para selects (fix modo oscuro/claro) ────────────────
  const globalSelectStyles = `
    select, select option {
      background-color: ${dark ? '#1a1a24' : '#ffffff'} !important;
      color: ${dark ? '#f0f0f0' : '#111118'} !important;
    }
    select {
      color-scheme: ${dark ? 'dark' : 'light'};
    }
    select:focus {
      outline: none;
    }
    * { box-sizing: border-box; }
    @keyframes spin { to { transform: rotate(360deg) } }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
    body { margin: 0; }
    @keyframes notiPop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)'}; }
  `;

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d), t }}>
      <style>{globalSelectStyles}</style>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: dark ? '#1a1a24' : '#ffffff',
              color:      dark ? '#f0f0f0' : '#111118',
              border:     dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              fontSize: 13,
            },
            success: { iconTheme: { primary: '#34d399', secondary: dark ? '#1a1a24' : '#fff' } },
            error:   { iconTheme: { primary: '#f87171', secondary: dark ? '#1a1a24' : '#fff' } },
          }}
        />
        <Routes>
          {/* Ruta raíz */}
          <Route
            path="/"
            element={
              localStorage.getItem('access_token')
                ? <Navigate to="/vacantes" replace />
                : <Navigate to="/login" replace />
            }
          />
          {/* Pública */}
          <Route path="/login"                   element={<Login />} />
          <Route path="/postular/:codigo"        element={<Postular />} />
          <Route path="/evaluacion/:tipo"        element={<RedireccionadorCandidato />} />
          {/* Portal candidato — descomenta cuando copies src/pages/candidato/ */}
          <Route path="/candidato/*" element={<PortalCandidato />} />
          {/* Todo lo demás pasa por Layout */}
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}