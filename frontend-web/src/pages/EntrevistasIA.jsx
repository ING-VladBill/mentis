// ==========================================
// frontend-web/src/pages/EntrevistasIA.jsx
// Resultados y auditoría de las entrevistas con EVA.
// Listado filtrable + panel de detalle 360° al seleccionar una.
// ==========================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import api from '../services/api';

const ESTADO_CFG = {
  finalizada:  { label: 'Finalizada',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  en_curso:    { label: 'En curso',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  pendiente:   { label: 'Pendiente',   color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  expirada:    { label: 'Expirada',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function EntrevistasIA() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [entrevistas, setEntrevistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    api.get('/api/evaluaciones/entrevistas/')
      .then(({ data }) => setEntrevistas(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: entrevistas.length,
    finalizadas: entrevistas.filter(e => e.estado === 'finalizada').length,
    enCurso: entrevistas.filter(e => e.estado === 'en_curso').length,
    notaProm: (() => {
      const conNota = entrevistas.filter(e => e.nota != null);
      if (!conNota.length) return null;
      return (conNota.reduce((s, e) => s + Number(e.nota), 0) / conNota.length).toFixed(1);
    })(),
  }), [entrevistas]);

  const lista = entrevistas
    .filter(e => filtro === 'todas' || e.estado === filtro)
    .filter(e => !busqueda || e.candidato_nombre?.toLowerCase().includes(busqueda.toLowerCase()) || e.vacante_titulo?.toLowerCase().includes(busqueda.toLowerCase()));

  const notaColor = (v) => v == null ? t.textFaint : v >= 14 ? '#10b981' : v >= 11 ? '#f59e0b' : '#ef4444';
  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 14 };

  return (
    <div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        {[
          { icon: 'ti-robot', label: 'Total entrevistas', val: stats.total, color: '#7c3aed' },
          { icon: 'ti-circle-check', label: 'Finalizadas', val: stats.finalizadas, color: '#10b981' },
          { icon: 'ti-loader', label: 'En curso', val: stats.enCurso, color: '#f59e0b' },
          { icon: 'ti-star', label: 'Nota promedio', val: stats.notaProm ?? '—', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, animation: 'fadeInUp 0.35s ease both', animationDelay: `${i * 0.05}s` }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${s.color}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['todas', 'finalizada', 'en_curso', 'expirada'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 500, transition: 'all 0.15s',
              background: filtro === f ? '#7c3aed' : t.toggleBg,
              color: filtro === f ? '#fff' : t.textMuted,
            }}>
              {f === 'todas' ? `Todas (${stats.total})` : (ESTADO_CFG[f]?.label || f)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg || t.toggleBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, padding: '7px 12px' }}>
          <i className="ti ti-search" style={{ fontSize: 14, color: t.textFaint }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar candidato o vacante…"
            style={{ border: 'none', outline: 'none', background: 'transparent', color: t.text, fontSize: 13, width: 200, fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ ...card, padding: 50, textAlign: 'center', color: t.textMuted }}>
          <i className="ti ti-loader-2" style={{ fontSize: 22, animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Cargando…
        </div>
      ) : lista.length === 0 ? (
        <div style={{ ...card, padding: '56px 30px', textAlign: 'center' }}>
          <i className="ti ti-robot" style={{ fontSize: 40, color: t.textFaint }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: t.text, marginTop: 12 }}>Aún no hay entrevistas</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 6 }}>
            Las entrevistas con EVA aparecerán aquí cuando los candidatos las completen.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lista.map((e, i) => {
            const cfg = ESTADO_CFG[e.estado] || ESTADO_CFG.pendiente;
            return (
              <div key={e.id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', animation: 'fadeInUp 0.3s ease both', animationDelay: `${i * 0.04}s`, transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                onClick={() => navigate(`/entrevistas/${e.id}`)}
                onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)'; }}
                onMouseLeave={ev => { ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = 'none'; }}>

                <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-robot" style={{ fontSize: 20 }} />
                </div>

                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: t.text }}>{e.candidato_nombre}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    {e.vacante_titulo}
                    {e.fecha_fin && <> · {new Date(e.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</>}
                    {e.duracion_minutos ? ` · ${e.duracion_minutos} min` : ''}
                  </div>
                </div>

                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 7, background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>

                {e.nota != null && (
                  <div style={{ textAlign: 'center', minWidth: 54 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: notaColor(e.nota), lineHeight: 1 }}>{e.nota}</div>
                    <div style={{ fontSize: 10, color: t.textFaint, fontWeight: 600 }}>sobre 20</div>
                  </div>
                )}

                <i className="ti ti-chevron-right" style={{ fontSize: 18, color: t.textFaint }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
