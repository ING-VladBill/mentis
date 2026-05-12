import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import VacantesList from './pages/VacantesList';
import VacanteForm from './pages/VacanteForm';
import CandidatoForm from './pages/CandidatoForm';
import CandidatosList from './pages/CandidatosList';

// ─── Theme Context ────────────────────────────────────────────────────────────
export const ThemeContext = createContext();
export function useTheme() { return useContext(ThemeContext); }

// ─── Theme tokens ─────────────────────────────────────────────────────────────
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

  const NAV_MAIN = [
    { to: '/vacantes',   icon: 'ti-briefcase', label: 'Vacantes'   },
    { to: '/candidatos', icon: 'ti-users',      label: 'Candidatos' },
  ];
  const NAV_SOON = [
    { icon: 'ti-checklist',    label: 'Evaluaciones'   },
    { icon: 'ti-robot',        label: 'Entrevistas IA' },
    { icon: 'ti-chart-bar',    label: 'Resultados'     },
    { icon: 'ti-shield-check', label: 'Auditoría'      },
    { icon: 'ti-settings',     label: 'Configuración'  },
  ];

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
          <div style={{ width: 36, height: 36, background: 'linear-gradient(140deg,#7c3aed 10%,#4f46e5 90%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
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
        <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: '0.14em', padding: '6px 10px 8px', fontWeight: 600 }}>SPRINT 1</div>
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
              {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 3px 3px 0', background: '#7c3aed' }} />}
              <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
              {label}
            </>)}
          </NavLink>
        ))}

        <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: '0.14em', padding: '18px 10px 8px', fontWeight: 600 }}>PRÓXIMOS SPRINTS</div>
        {NAV_SOON.map(({ icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 2, fontSize: 13.5, color: t.textFaint, cursor: 'not-allowed' }}>
            <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
            {label}
            <span style={{ marginLeft: 'auto', fontSize: 10, background: t.toggleBg, color: t.textFaint, padding: '2px 7px', borderRadius: 5 }}>Pronto</span>
          </div>
        ))}
      </nav>

      {/* Sprint progress */}
      <div style={{ padding: '10px 14px', margin: '0 10px 10px', borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
        <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 2 }}>Sprint 1 — Completado</div>
        <div style={{ fontSize: 10.5, color: t.textFaint }}>Fundación del sistema</div>
        <div style={{ marginTop: 8, background: t.toggleBg, borderRadius: 4, height: 4 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7c3aed,#6d28d9)' }} />
        </div>
      </div>

      {/* Dark mode toggle */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        <button
          onClick={toggle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 9,
            background: t.toggleBg, border: 'none',
            cursor: 'pointer', fontSize: 13, color: t.textMuted,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 16 }}>{t.toggleIcon}</span>
          {dark ? 'Modo oscuro' : 'Modo claro'}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
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

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${t.sidebarBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '1.5px solid rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>GL</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gabriel Llanos</div>
          <div style={{ fontSize: 11, color: t.textFaint }}>Desarrollador Frontend</div>
        </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, padding: '7px 13px', fontSize: 13, color: t.textFaint, cursor: 'text', minWidth: 210 }}>
        <i className="ti ti-search" style={{ fontSize: 14 }} />
        <span>Buscar vacantes, candidatos...</span>
      </div>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textMuted, position: 'relative' }}>
        <i className="ti ti-bell" style={{ fontSize: 16 }} />
        <div style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', border: `1.5px solid ${t.topbar}` }} />
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const PAGE_META = {
  '/vacantes':              { title: 'Vacantes',          subtitle: 'Gestiona todos los puestos de trabajo' },
  '/vacantes/nueva':        { title: 'Nueva vacante',     subtitle: 'Crear una nueva posición' },
  '/candidatos':            { title: 'Candidatos',        subtitle: 'Listado de todos los postulantes' },
  '/candidatos/registrar':  { title: 'Registrar candidato', subtitle: 'Agregar nuevo postulante' },
};

function Layout() {
  const { t } = useTheme();
  const location = useLocation();
  const editMatch = location.pathname.match(/^\/vacantes\/(\d+)\/editar$/);
  const meta = editMatch
    ? { title: 'Editar vacante', subtitle: `Modificando vacante #${editMatch[1]}` }
    : (PAGE_META[location.pathname] || { title: 'MENTIS', subtitle: '' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'system-ui,-apple-system,sans-serif', transition: 'background 0.25s, color 0.25s' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 224, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main style={{ flex: 1, padding: '26px 28px' }}>
          <Routes>
            <Route path="/"                       element={<VacantesList />} />
            <Route path="/vacantes"               element={<VacantesList />} />
            <Route path="/vacantes/nueva"         element={<VacanteForm />} />
            <Route path="/vacantes/:id/editar"    element={<VacanteForm />} />
            <Route path="/candidatos"             element={<CandidatosList />} />
            <Route path="/candidatos/registrar"   element={<CandidatoForm />} />
          </Routes>
        </main>
      </div>
    </div>
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

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d), t }}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}