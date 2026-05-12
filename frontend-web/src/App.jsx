import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import VacantesList from './pages/VacantesList';
import VacanteForm from './pages/VacanteForm';
import CandidatoForm from './pages/CandidatoForm';

function Sidebar() {
  const NAV_MAIN = [
    { to: '/vacantes', icon: 'ti-briefcase', label: 'Vacantes' },
    { to: '/candidatos/registrar', icon: 'ti-users', label: 'Candidatos' },
  ];
  const NAV_SOON = [
    { icon: 'ti-checklist',   label: 'Evaluaciones' },
    { icon: 'ti-robot',       label: 'Entrevistas IA' },
    { icon: 'ti-chart-bar',   label: 'Resultados' },
    { icon: 'ti-shield-check',label: 'Auditoría' },
    { icon: 'ti-settings',    label: 'Configuración' },
  ];

  return (
    <aside style={{
      width: 224,
      minHeight: '100vh',
      background: '#0c0c10',
      borderRight: '1px solid rgba(255,255,255,0.055)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(140deg, #7c3aed 10%, #4f46e5 90%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124,58,237,0.35)',
          }}>
            <i className="ti ti-brain" style={{ fontSize: 18, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '0.07em' }}>MENTIS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginTop: 1 }}>RECLUTAMIENTO IA</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', padding: '6px 10px 8px', fontWeight: 600 }}>SPRINT 1</div>
        {NAV_MAIN.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 13.5,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#e2d9ff' : 'rgba(255,255,255,0.42)',
              background: isActive ? 'rgba(124,58,237,0.16)' : 'transparent',
              transition: 'all 0.15s',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: '#7c3aed',
                  }} />
                )}
                <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', padding: '18px 10px 8px', fontWeight: 600 }}>PRÓXIMOS SPRINTS</div>
        {NAV_SOON.map(({ icon, label }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8, marginBottom: 2,
            fontSize: 13.5, color: 'rgba(255,255,255,0.18)',
            cursor: 'not-allowed',
          }}>
            <i className={`ti ${icon}`} style={{ fontSize: 17 }} />
            {label}
            <span style={{
              marginLeft: 'auto', fontSize: 10, letterSpacing: '0.05em',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.2)',
              padding: '2px 7px', borderRadius: 5,
            }}>Pronto</span>
          </div>
        ))}
      </nav>

      {/* Sprint badge */}
      <div style={{ padding: '10px 14px', margin: '0 10px 10px', borderRadius: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, marginBottom: 2 }}>Sprint 1 — En progreso</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)' }}>Fundación del sistema</div>
        <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4 }}>
          <div style={{ width: '35%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#7c3aed,#6d28d9)' }} />
        </div>
      </div>

      {/* User */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.055)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(124,58,237,0.2)',
          border: '1.5px solid rgba(124,58,237,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#a78bfa',
          flexShrink: 0,
        }}>GL</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#e2e2e2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gabriel Llanos</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Desarrollador Frontend</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <header style={{
      height: 58,
      background: '#0f0f14',
      borderBottom: '1px solid rgba(255,255,255,0.055)',
      display: 'flex', alignItems: 'center',
      padding: '0 26px', gap: 16,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: '#f0f0f0' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.32)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '7px 13px',
        fontSize: 13, color: 'rgba(255,255,255,0.28)',
        cursor: 'text', minWidth: 210,
      }}>
        <i className="ti ti-search" style={{ fontSize: 14 }} />
        <span>Buscar vacantes, candidatos...</span>
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'rgba(255,255,255,0.38)', position: 'relative',
      }}>
        <i className="ti ti-bell" style={{ fontSize: 16 }} />
        <div style={{
          position: 'absolute', top: 7, right: 7,
          width: 6, height: 6, borderRadius: '50%',
          background: '#7c3aed',
          border: '1.5px solid #0f0f14',
        }} />
      </div>
    </header>
  );
}

const PAGE_META = {
  '/vacantes':              { title: 'Vacantes',          subtitle: 'Gestiona todos los puestos de trabajo' },
  '/vacantes/nueva':        { title: 'Nueva vacante',     subtitle: 'Crear una nueva posición' },
  '/candidatos/registrar':  { title: 'Candidatos',        subtitle: 'Registrar nuevo postulante' },
};

function Layout() {
  const location = useLocation();
  const editMatch = location.pathname.match(/^\/vacantes\/(\d+)\/editar$/);
  const meta = editMatch
    ? { title: 'Editar vacante', subtitle: `Modificando vacante #${editMatch[1]}` }
    : (PAGE_META[location.pathname] || { title: 'MENTIS', subtitle: '' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#13131a', color: '#e2e2e2', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 224, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main style={{ flex: 1, padding: '26px 28px' }}>
          <Routes>
            <Route path="/" element={<VacantesList />} />
            <Route path="/vacantes" element={<VacantesList />} />
            <Route path="/vacantes/nueva" element={<VacanteForm />} />
            <Route path="/vacantes/:id/editar" element={<VacanteForm />} />
            <Route path="/candidatos/registrar" element={<CandidatoForm />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}