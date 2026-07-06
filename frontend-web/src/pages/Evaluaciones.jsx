import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADO_CFG = {
  pendiente:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  label: 'Pendiente'  },
  generado:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   label: 'Generado'   },
  en_curso:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   label: 'En curso'   },
  finalizado: { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   label: 'Finalizado' },
  expirado:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  label: 'Expirado'   },
};

const SEMAFORO_CFG = {
  verde:    { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  icon: 'ti-circle-check', label: 'Sin riesgo'    },
  amarillo: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  icon: 'ti-alert-triangle', label: 'Riesgo medio' },
  rojo:     { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', icon: 'ti-alert-circle', label: 'Riesgo alto'   },
};

// ─── Componentes auxiliares (FUERA del componente principal) ──────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.pendiente;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {cfg.label}
    </span>
  );
}

function SemaforoBadge({ semaforo }) {
  if (!semaforo) return <span style={{ fontSize: 12, color: '#6b7280' }}>—</span>;
  const cfg = SEMAFORO_CFG[semaforo] || SEMAFORO_CFG.verde;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 13 }} />
      {cfg.label}
    </span>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Evaluaciones() {
  const { t } = useTheme();
  const navigate = useNavigate();

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroVacante, setFiltroVacante] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.evaluaciones.list({ estado: filtroEstado, vacante_id: filtroVacante || undefined }),
    queryFn: async () => {
      const query = new URLSearchParams();
      if (filtroEstado && filtroEstado !== 'todos') query.set('estado', filtroEstado);
      if (filtroVacante) query.set('vacante_id', filtroVacante);
      const { data } = await api.get(`/api/evaluaciones/examenes/?${query}`);
      return data.results || data;
    },
  });
  const examenes = data || [];

  const { data: vacantesData } = useQuery({
    queryKey: qk.vacantes.list(),
    queryFn: async () => {
      const { data } = await api.get('/api/vacantes/');
      return data.results || data;
    },
  });
  const vacantes = vacantesData || [];

  function aplicarFiltros(estado, vacante) {
    if (estado !== undefined) setFiltroEstado(estado);
    if (vacante !== undefined) setFiltroVacante(vacante);
  }

  const stats = {
    total:      examenes.length,
    finalizados: examenes.filter(e => e.estado === 'finalizado').length,
    en_curso:   examenes.filter(e => e.estado === 'en_curso').length,
    aprobados:  examenes.filter(e => e.aprobado === true).length,
  };

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, transition: 'background 0.25s' };

  if (isLoading) return <Spinner />;

  if (isError) return (
    <div style={{ ...card, padding: '14px 18px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> No se pudo cargar la lista de exámenes.
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total exámenes', value: stats.total,       icon: 'ti-clipboard-list', accent: '#7c3aed' },
          { label: 'Finalizados',    value: stats.finalizados,  icon: 'ti-circle-check',   accent: '#10b981' },
          { label: 'En curso',       value: stats.en_curso,     icon: 'ti-clock',          accent: '#fbbf24' },
          { label: 'Aprobados',      value: stats.aprobados,    icon: 'ti-trophy',         accent: '#60a5fa' },
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

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filtro por estado */}
        <div style={{ display: 'flex', gap: 4, background: t.inputBg, padding: 4, borderRadius: 10, border: `1px solid ${t.cardBorder}` }}>
          {['todos', 'pendiente', 'en_curso', 'finalizado', 'expirado'].map(e => (
            <button key={e} onClick={() => aplicarFiltros(e, undefined)} style={{
              padding: '6px 13px', borderRadius: 7, border: 'none',
              cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit',
              fontWeight: filtroEstado === e ? 600 : 450,
              background: filtroEstado === e ? t.card : 'transparent',
              color: filtroEstado === e ? t.text : t.textMuted,
              boxShadow: filtroEstado === e ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s', textTransform: 'capitalize',
            }}>
              {e === 'todos' ? `Todos (${stats.total})` : e.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Filtro por vacante */}
        <select
          value={filtroVacante}
          onChange={e => aplicarFiltros(undefined, e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: t.inputBg, color: filtroVacante ? t.text : t.textMuted, fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
        >
          <option value="">Todas las vacantes</option>
          {vacantes.map(v => (
            <option key={v.id} value={v.id}>{v.titulo}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {examenes.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px', background: t.inputBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-clipboard-off" style={{ fontSize: 28, color: t.textFaint }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 6 }}>Sin exámenes</div>
            <div style={{ color: t.textMuted, fontSize: 13 }}>
              {filtroEstado !== 'todos' ? `No hay exámenes con estado "${filtroEstado}".` : 'Los exámenes aparecerán aquí cuando los candidatos los rindan.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                {['Candidato', 'Vacante', 'Estado', 'Nota', 'Resultado', 'Integridad', 'Fecha', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {examenes.map((ex, i) => (
                <tr
                  key={ex.id}
                  style={{ borderBottom: i < examenes.length - 1 ? `1px solid ${t.divider}` : 'none', transition: 'background 0.12s', cursor: 'pointer' }}
                  onClick={() => navigate(`/evaluaciones/${ex.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{ex.candidato_nombre}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: t.textMuted }}>
                    {ex.vacante_titulo}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <EstadoBadge estado={ex.estado} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {ex.nota != null ? (
                      <span style={{ fontSize: 15, fontWeight: 700, color: parseFloat(ex.nota) >= parseFloat(ex.nota_minima || 13) ? '#34d399' : '#f87171' }}>
                        {parseFloat(ex.nota).toFixed(1)}
                        <span style={{ fontSize: 11, fontWeight: 400, color: t.textFaint }}>/20</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {ex.estado === 'finalizado' ? (
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: ex.aprobado ? '#34d399' : '#f87171' }}>
                        {ex.aprobado ? '✓ Aprobado' : '✗ Desaprobado'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <SemaforoBadge semaforo={ex.semaforo} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: t.textMuted }}>
                    {ex.fecha_fin
                      ? new Date(ex.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                      : ex.fecha_inicio
                      ? new Date(ex.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                      : '—'
                    }
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/evaluaciones/${ex.id}`); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 12.5, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = t.text; }}
                      onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}
                    >
                      <i className="ti ti-eye" style={{ fontSize: 13 }} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}