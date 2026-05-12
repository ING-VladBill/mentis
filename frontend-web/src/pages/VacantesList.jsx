import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import api from '../services/api';

const ESTADO_CFG = {
  abierta:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)'   },
  borrador:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)' },
  cerrada:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)'  },
  pausada:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)'   },
  cancelada: { color: '#6b7280', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.12)' },
};

const PRIORIDAD_COLOR = { urgente: '#f87171', alta: '#fbbf24', media: '#9ca3af', baja: '#6b7280' };
const NIVEL  = { junior: 'Junior', semi_senior: 'Semi Senior', senior: 'Senior', lead: 'Tech Lead', manager: 'Manager' };
const MODAL  = { presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' };

export default function VacantesList() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filtro, setFiltro]     = useState('todas');
  const [delId, setDelId]       = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setLoading(true); const { data } = await api.get('/vacantes/'); setVacantes(data); }
    catch { setError('No se pudo conectar. ¿Está el backend corriendo en puerto 8000?'); }
    finally { setLoading(false); }
  }

  async function eliminar(id, titulo) {
    if (!confirm(`¿Eliminar "${titulo}"?`)) return;
    setDelId(id);
    try { await api.delete(`/vacantes/${id}/`); setVacantes(v => v.filter(x => x.id !== id)); }
    catch { alert('Error al eliminar.'); }
    finally { setDelId(null); }
  }

  const stats = {
    total:    vacantes.length,
    abiertas: vacantes.filter(v => v.estado === 'abierta').length,
    borrador: vacantes.filter(v => v.estado === 'borrador').length,
    urgentes: vacantes.filter(v => v.prioridad === 'urgente').length,
  };

  const lista = filtro === 'todas' ? vacantes : vacantes.filter(v => v.estado === filtro);

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, transition: 'background 0.25s, border-color 0.25s' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...card, padding: '14px 18px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> {error}
    </div>
  );

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total vacantes', value: stats.total,    icon: 'ti-briefcase',      accent: '#7c3aed' },
          { label: 'Abiertas',       value: stats.abiertas, icon: 'ti-circle-check',   accent: '#10b981' },
          { label: 'En borrador',    value: stats.borrador, icon: 'ti-edit',           accent: '#6b7280' },
          { label: 'Urgentes',       value: stats.urgentes, icon: 'ti-alert-triangle', accent: '#ef4444' },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: `${accent}18`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${icon}`} style={{ fontSize: 20, color: accent }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: t.text, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['todas', 'abierta', 'borrador', 'pausada', 'cerrada'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.15s',
              background: filtro === f ? '#7c3aed' : t.toggleBg,
              color: filtro === f ? '#fff' : t.textMuted,
            }}>
              {f}{f === 'todas' ? ` (${stats.total})` : ''}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/vacantes/nueva')} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 18px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          color: '#fff', fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 0 18px rgba(124,58,237,0.28)',
        }}>
          <i className="ti ti-plus" style={{ fontSize: 17 }} /> Nueva vacante
        </button>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {lista.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="ti ti-clipboard-off" style={{ fontSize: 40, color: t.textFaint, display: 'block', marginBottom: 12 }} />
            <div style={{ color: t.textMuted, fontSize: 14 }}>{filtro === 'todas' ? 'No hay vacantes.' : `Sin vacantes con estado "${filtro}".`}</div>
            <button onClick={() => navigate('/vacantes/nueva')} style={{ marginTop: 14, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Crear la primera vacante
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                {['Código', 'Puesto', 'Área', 'Nivel / Modalidad', 'Ciudad', 'Estado', 'Prioridad', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((v, i) => {
                const est = ESTADO_CFG[v.estado] || ESTADO_CFG.borrador;
                return (
                  <tr key={v.id}
                    style={{ borderBottom: i < lista.length - 1 ? `1px solid ${t.cardBorder}` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: t.textFaint, background: t.toggleBg, padding: '3px 8px', borderRadius: 5 }}>{v.codigo}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{v.titulo}</div>
                      {v.numero_vacantes > 1 && <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{v.numero_vacantes} posiciones</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: t.textMuted }}>{v.area}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: t.textMuted }}>{NIVEL[v.nivel_experiencia] || v.nivel_experiencia}</div>
                      <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 2 }}>{MODAL[v.modalidad] || v.modalidad}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: t.textMuted }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="ti ti-map-pin" style={{ fontSize: 13, color: t.textFaint }} /> {v.ciudad}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: est.bg, color: est.color, border: `1px solid ${est.border}` }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: PRIORIDAD_COLOR[v.prioridad] || t.textMuted }}>{v.prioridad}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => navigate(`/vacantes/${v.id}/editar`)}
                          style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.inputBg; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = t.toggleBg; }}
                        >
                          <i className="ti ti-edit" style={{ fontSize: 13 }} /> Editar
                        </button>
                        <button onClick={() => eliminar(v.id, v.titulo)} disabled={delId === v.id}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.07)', color: 'rgba(248,113,113,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.6)'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
                        >
                          <i className="ti ti-trash" style={{ fontSize: 13 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {lista.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: t.textFaint, textAlign: 'right' }}>
          Mostrando {lista.length} de {vacantes.length} vacante{vacantes.length !== 1 ? 's' : ''}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}