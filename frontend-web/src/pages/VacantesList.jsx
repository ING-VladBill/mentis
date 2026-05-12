import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const S = {
  card: {
    background: '#1a1a24',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '18px 20px',
  },
  badge: (color) => {
    const map = {
      abierta:   { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
      borrador:  { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
      cerrada:   { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', border: 'rgba(239,68,68,0.2)' },
      pausada:   { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
      cancelada: { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', border: 'rgba(255,255,255,0.08)' },
    };
    const t = map[color] || map.borrador;
    return {
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      background: t.bg, color: t.color,
      border: `1px solid ${t.border}`,
    };
  },
  prioridad: (p) => {
    const map = {
      urgente: '#f87171',
      alta:    '#fbbf24',
      media:   'rgba(255,255,255,0.35)',
      baja:    'rgba(255,255,255,0.2)',
    };
    return { fontSize: 12, color: map[p] || map.media, fontWeight: 500 };
  },
};

const NIVEL = { junior: 'Junior', semi_senior: 'Semi Senior', senior: 'Senior', lead: 'Tech Lead', manager: 'Manager' };
const MODALIDAD = { presencial: 'Presencial', remoto: 'Remoto', hibrido: 'Híbrido' };

export default function VacantesList() {
  const [vacantes, setVacantes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filtroEstado, setFiltro] = useState('todas');
  const [deletingId, setDel]      = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchVacantes(); }, []);

  async function fetchVacantes() {
    try {
      setLoading(true);
      const { data } = await api.get('/vacantes/');
      setVacantes(data);
    } catch {
      setError('No se pudo conectar. ¿Está el backend corriendo en puerto 8000?');
    } finally {
      setLoading(false);
    }
  }

  async function eliminar(id, titulo) {
    if (!confirm(`¿Eliminar "${titulo}"?`)) return;
    setDel(id);
    try {
      await api.delete(`/vacantes/${id}/`);
      setVacantes(v => v.filter(x => x.id !== id));
    } catch {
      alert('Error al eliminar.');
    } finally {
      setDel(null);
    }
  }

  const stats = {
    total:    vacantes.length,
    abiertas: vacantes.filter(v => v.estado === 'abierta').length,
    borrador: vacantes.filter(v => v.estado === 'borrador').length,
    urgentes: vacantes.filter(v => v.prioridad === 'urgente').length,
  };

  const lista = filtroEstado === 'todas'
    ? vacantes
    : vacantes.filter(v => v.estado === filtroEstado);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...S.card, borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> {error}
    </div>
  );

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total vacantes',  value: stats.total,    icon: 'ti-briefcase',       accent: '#7c3aed' },
          { label: 'Abiertas',        value: stats.abiertas, icon: 'ti-circle-check',    accent: '#10b981' },
          { label: 'En borrador',     value: stats.borrador, icon: 'ti-edit',            accent: '#6b7280' },
          { label: 'Urgentes',        value: stats.urgentes, icon: 'ti-alert-triangle',  accent: '#ef4444' },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: `${accent}18`,
              border: `1px solid ${accent}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`ti ${icon}`} style={{ fontSize: 20, color: accent }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#f0f0f0', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header + filtros */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['todas', 'abierta', 'borrador', 'pausada', 'cerrada'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                textTransform: 'capitalize', transition: 'all 0.15s',
                background: filtroEstado === f ? '#7c3aed' : 'rgba(255,255,255,0.06)',
                color: filtroEstado === f ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {f}
              {f === 'todas' ? ` (${stats.total})` : ''}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/vacantes/nueva')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 0 20px rgba(124,58,237,0.3)',
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 17 }} /> Nueva vacante
        </button>
      </div>

      {/* Tabla */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        {lista.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="ti ti-clipboard-off" style={{ fontSize: 40, color: 'rgba(255,255,255,0.12)', display: 'block', marginBottom: 12 }} />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              {filtroEstado === 'todas' ? 'No hay vacantes creadas.' : `No hay vacantes con estado "${filtroEstado}".`}
            </div>
            <button
              onClick={() => navigate('/vacantes/nueva')}
              style={{ marginTop: 14, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >Crear la primera vacante</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Código', 'Puesto', 'Área', 'Nivel / Modalidad', 'Ciudad', 'Estado', 'Prioridad', ''].map(h => (
                  <th key={h} style={{
                    padding: '13px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600,
                    color: 'rgba(255,255,255,0.28)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((v, i) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: i < lista.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.12s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 5 }}>{v.codigo}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0f0' }}>{v.titulo}</div>
                    {v.numero_vacantes > 1 && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{v.numero_vacantes} posiciones</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{v.area}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{NIVEL[v.nivel_experiencia] || v.nivel_experiencia}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{MODALIDAD[v.modalidad] || v.modalidad}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="ti ti-map-pin" style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }} />
                      {v.ciudad}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={S.badge(v.estado)}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {v.estado}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={S.prioridad(v.prioridad)}>{v.prioridad}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => navigate(`/vacantes/${v.id}/editar`)}
                        style={{
                          padding: '5px 12px', borderRadius: 7,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.55)',
                          fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}
                      >
                        <i className="ti ti-edit" style={{ fontSize: 13 }} /> Editar
                      </button>
                      <button
                        onClick={() => eliminar(v.id, v.titulo)}
                        disabled={deletingId === v.id}
                        style={{
                          padding: '5px 10px', borderRadius: 7,
                          border: '1px solid rgba(239,68,68,0.15)',
                          background: 'rgba(239,68,68,0.07)',
                          color: 'rgba(248,113,113,0.6)',
                          fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.07)'; e.currentTarget.style.color='rgba(248,113,113,0.6)'; }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      {lista.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.22)', textAlign: 'right' }}>
          Mostrando {lista.length} de {vacantes.length} vacante{vacantes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}