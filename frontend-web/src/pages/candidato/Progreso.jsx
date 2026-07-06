import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSpring } from '../../services/api';

const FASE_CFG = {
  completada: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: 'ti-circle-check' },
  actual:     { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.3)', icon: 'ti-clock'        },
  pendiente:  { color: '#d1d5db', bg: '#f9fafb',              border: '#e5e7eb',              icon: 'ti-circle'       },
  bloqueada:  { color: '#e5e7eb', bg: '#f9fafb',              border: '#f3f4f6',              icon: 'ti-lock'         },
};

export default function Progreso() {
  const navigate = useNavigate();
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoad]      = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('candidato_token')) { navigate('/candidato/acceso'); return; }
    apiSpring.get('/api/usuario/progreso')
      .then(r => setProgreso(r.data))
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', gap: 14, flexDirection: 'column' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 13.5, color: '#6b7280' }}>Cargando tu progreso...</div>
    </div>
  );

  const p = progreso;
  const accion = p?.accion_disponible;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-brain" style={{ fontSize: 15, color: '#fff' }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', letterSpacing: '0.06em' }}>MENTIS</span>
      </header>

      <div style={{ maxWidth: 580, margin: '40px auto', padding: '0 20px' }}>

        {/* Saludo */}
        {p && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Hola, {p.candidato} 👋</div>
            <div style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 12 }}>
              Proceso: <strong style={{ color: '#374151' }}>{p.vacante}</strong>
            </div>
            {p.mensaje && (
              <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, color: '#5b21b6', lineHeight: 1.6 }}>
                <i className="ti ti-sparkles" style={{ marginRight: 6 }} />{p.mensaje}
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '28px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 24 }}>Tu progreso en el proceso</div>

          {(p?.fases || []).map((fase, i, arr) => {
            const cfg = FASE_CFG[fase.estado] || FASE_CFG.pendiente;
            const esUltima = i === arr.length - 1;
            return (
              <div key={fase.titulo} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                {/* Línea vertical */}
                {!esUltima && (
                  <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: fase.estado === 'completada' ? 'rgba(16,185,129,0.3)' : '#f3f4f6', zIndex: 0 }} />
                )}

                {/* Ícono */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: cfg.bg, border: `2px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
                  <i className={`ti ${cfg.icon}`} style={{ fontSize: 18, color: cfg.color }} />
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, paddingBottom: esUltima ? 0 : 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ fontSize: 14.5, fontWeight: fase.estado === 'actual' ? 700 : 500, color: fase.estado === 'bloqueada' ? '#d1d5db' : '#111827' }}>
                      {fase.titulo}
                    </div>
                    {fase.estado === 'actual' && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '1px 8px', borderRadius: 5 }}>ACTUAL</span>
                    )}
                  </div>
                  {fase.descripcion && (
                    <div style={{ fontSize: 13, color: fase.estado === 'bloqueada' ? '#d1d5db' : '#6b7280', lineHeight: 1.5 }}>{fase.descripcion}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Acción disponible */}
        {accion && accion.habilitada && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '24px 28px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Acción disponible</div>
            {accion.tipo === 'rendir_examen' && (
              <button onClick={() => navigate('/candidato/instrucciones')} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <i className="ti ti-clipboard-list" style={{ fontSize: 17 }} /> {accion.titulo || 'Rendir examen técnico'}
              </button>
            )}
            {accion.tipo === 'continuar_examen' && (
              <button onClick={() => navigate('/candidato/examen')} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                <i className="ti ti-player-play" style={{ fontSize: 17 }} /> {accion.titulo || 'Continuar examen'}
              </button>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#d1d5db' }}>
          MENTIS · Reclutamiento con inteligencia artificial
        </div>
      </div>
    </div>
  );
}