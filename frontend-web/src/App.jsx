import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';

import {
  useState,
  useEffect,
  createContext,
  useContext
} from 'react';

import { Toaster } from 'react-hot-toast';

import VacantesList from './pages/VacantesList';
import VacanteForm from './pages/VacanteForm';
import CandidatoForm from './pages/CandidatoForm';
import CandidatosList from './pages/CandidatosList';
import Login from './pages/Login';

import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';

// ─────────────────────────────────────────────────────────────
// THEME CONTEXT
// ─────────────────────────────────────────────────────────────
export const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function tokens(dark) {
  return dark
    ? {
        bg: '#13131a',
        sidebar: '#0c0c10',
        sidebarBorder: 'rgba(255,255,255,0.055)',
        topbar: '#0f0f14',
        card: '#1a1a24',
        cardBorder: 'rgba(255,255,255,0.07)',
        text: '#f0f0f0',
        textMuted: 'rgba(255,255,255,0.38)',
        textFaint: 'rgba(255,255,255,0.22)',
        navActive: 'rgba(124,58,237,0.16)',
        navText: 'rgba(255,255,255,0.42)',
        navActiveText: '#e2d9ff',
        inputBg: 'rgba(255,255,255,0.04)',
        inputBorder: 'rgba(255,255,255,0.1)',
        divider: 'rgba(255,255,255,0.055)',
        rowHover: 'rgba(255,255,255,0.025)',
        toggleBg: 'rgba(255,255,255,0.08)',
        toggleIcon: '🌙',
      }
    : {
        bg: '#f4f4f8',
        sidebar: '#ffffff',
        sidebarBorder: 'rgba(0,0,0,0.08)',
        topbar: '#ffffff',
        card: '#ffffff',
        cardBorder: 'rgba(0,0,0,0.08)',
        text: '#111118',
        textMuted: 'rgba(0,0,0,0.45)',
        textFaint: 'rgba(0,0,0,0.28)',
        navActive: 'rgba(124,58,237,0.1)',
        navText: 'rgba(0,0,0,0.45)',
        navActiveText: '#5b21b6',
        inputBg: 'rgba(0,0,0,0.03)',
        inputBorder: 'rgba(0,0,0,0.12)',
        divider: 'rgba(0,0,0,0.07)',
        rowHover: 'rgba(0,0,0,0.025)',
        toggleBg: 'rgba(0,0,0,0.06)',
        toggleIcon: '☀️',
      };
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
function Sidebar() {
  const { dark, toggle, t } = useTheme();
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const nombre = usuario.nombre || 'Usuario';
  const rol = usuario.rol_display || usuario.rol || 'RRHH';

  const partes = nombre.trim().split(' ');

  const iniciales =
    partes.length >= 2
      ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
      : nombre.slice(0, 2).toUpperCase();

  const NAV_MAIN = [
    {
      to: '/vacantes',
      icon: 'ti-briefcase',
      label: 'Vacantes',
    },
    {
      to: '/candidatos',
      icon: 'ti-users',
      label: 'Candidatos',
    },
  ];

  async function handleLogout() {
    try {
      const refresh = localStorage.getItem('refresh_token');

      await api.post('/api/auth/logout/', {
        refresh,
      });
    } catch {
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  }

  return (
    <aside
      style={{
        width: 224,
        minHeight: '100vh',
        background: t.sidebar,
        borderRight: `1px solid ${t.sidebarBorder}`,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* LOGO */}
      <div
        style={{
          padding: '22px 18px',
          borderBottom: `1px solid ${t.sidebarBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background:
                'linear-gradient(140deg,#7c3aed 10%,#4f46e5 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i
              className="ti ti-brain"
              style={{
                color: '#fff',
                fontSize: 18,
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: t.text,
              }}
            >
              MENTIS
            </div>

            <div
              style={{
                fontSize: 10,
                color: t.textFaint,
              }}
            >
              RECLUTAMIENTO IA
            </div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav
        style={{
          padding: '14px 10px',
          flex: 1,
        }}
      >
        {NAV_MAIN.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              marginBottom: 4,
              borderRadius: 8,
              textDecoration: 'none',
              background: isActive
                ? t.navActive
                : 'transparent',
              color: isActive
                ? t.navActiveText
                : t.navText,
            })}
          >
            <i className={`ti ${icon}`} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* DARK MODE */}
      <div
        style={{
          padding: 14,
          borderTop: `1px solid ${t.sidebarBorder}`,
        }}
      >
        <button
          onClick={toggle}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: t.toggleBg,
            color: t.text,
            cursor: 'pointer',
          }}
        >
          {dark ? 'Modo oscuro' : 'Modo claro'}
        </button>
      </div>

      {/* USER */}
      <div
        style={{
          padding: 14,
          borderTop: `1px solid ${t.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(124,58,237,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {iniciales}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              color: t.text,
            }}
          >
            {nombre}
          </div>

          <div
            style={{
              fontSize: 11,
              color: t.textFaint,
            }}
          >
            {rol}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: t.textFaint,
            cursor: 'pointer',
          }}
        >
          <i className="ti ti-logout" />
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }) {
  const { t } = useTheme();

  return (
    <header
      style={{
        height: 58,
        background: t.topbar,
        borderBottom: `1px solid ${t.sidebarBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 26px',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: t.text,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 11,
            color: t.textMuted,
          }}
        >
          {subtitle}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE META
// ─────────────────────────────────────────────────────────────
const PAGE_META = {
  '/vacantes': {
    title: 'Vacantes',
    subtitle: 'Gestión de vacantes',
  },

  '/vacantes/nueva': {
    title: 'Nueva Vacante',
    subtitle: 'Registrar nueva vacante',
  },

  '/candidatos': {
    title: 'Candidatos',
    subtitle: 'Listado de candidatos',
  },

  '/candidatos/registrar': {
    title: 'Registrar candidato',
    subtitle: 'Nuevo postulante',
  },
};

// ─────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────
function Layout() {
  const { t } = useTheme();

  const location = useLocation();

  const meta =
    PAGE_META[location.pathname] || {
      title: 'MENTIS',
      subtitle: '',
    };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: t.bg,
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          marginLeft: 224,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
        />

        <main
          style={{
            flex: 1,
            padding: '26px 28px',
          }}
        >
          <Routes>
            <Route
              path="/vacantes"
              element={<VacantesList />}
            />

            <Route
              path="/vacantes/nueva"
              element={<VacanteForm />}
            />

            <Route
              path="/vacantes/:id/editar"
              element={<VacanteForm />}
            />

            <Route
              path="/candidatos"
              element={<CandidatosList />}
            />

            <Route
              path="/candidatos/registrar"
              element={<CandidatoForm />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('mentis-theme');

    return saved !== null
      ? saved === 'dark'
      : true;
  });

  useEffect(() => {
    localStorage.setItem(
      'mentis-theme',
      dark ? 'dark' : 'light'
    );
  }, [dark]);

  const t = tokens(dark);

  return (
    <ThemeContext.Provider
      value={{
        dark,
        toggle: () => setDark((d) => !d),
        t,
      }}
    >
      <BrowserRouter>
        <Toaster />

        <Routes>
          {/* REDIRECT INICIAL */}
          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* RUTAS PROTEGIDAS */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}
