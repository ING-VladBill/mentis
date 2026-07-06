import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

// ─── Constantes ───────────────────────────────────────────────────────────────
const SEVERIDAD_CFG = {
  baja:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  label: 'Baja'  },
  media: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   label: 'Media' },
  alta:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  label: 'Alta'  },
};

const SEMAFORO_CFG = {
  verde:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',   icon: 'ti-circle-check',   label: 'Sin riesgo'   },
  amarillo: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',   icon: 'ti-alert-triangle', label: 'Riesgo medio' },
  rojo:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)',  icon: 'ti-alert-circle',   label: 'Riesgo alto'  },
};

const TIPO_EVENTO_LABEL = {
  perdida_foco:      'Pérdida de foco',
  cambio_ventana:    'Cambio de ventana',
  copy_paste:        'Copiar / Pegar',
  click_derecho:     'Click derecho',
  devtools:          'Abrió DevTools',
  inactividad:       'Inactividad prolongada',
  pantalla_dividida: 'Pantalla dividida',
  otro:              'Otro',
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

function SemaforoBadge({ semaforo }) {
  if (!semaforo) return null;
  const cfg = SEMAFORO_CFG[semaforo] || SEMAFORO_CFG.verde;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 13 }} />
      {cfg.label}
    </span>
  );
}

function SeveridadBadge({ severidad }) {
  const cfg = SEVERIDAD_CFG[severidad] || SEVERIDAD_CFG.baja;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Auditoria() {
  const { t } = useTheme();

  const [expandido, setExpandido] = useState(null);
  const [auditorias, setAuditorias] = useState({});
  const [loadingAud, setLoadingAud] = useState({});
  const [filtro, setFiltro]       = useState('todos');

  const { data, isLoading: loading, isError: error } = useQuery({
    queryKey: qk.auditoria.list({ estado: 'finalizado' }),
    queryFn: async () => {
      const { data } = await api.get('/api/evaluaciones/examenes/?estado=finalizado');
      return data.results || data;
    },
  });
  const examenes = data || [];

  async function toggleExpandir(exId) {
    if (expandido === exId) { setExpandido(null); return; }
    setExpandido(exId);
    if (auditorias[exId]) return;
    setLoadingAud(prev => ({ ...prev, [exId]: true }));
    try {
      const { data } = await api.get(`/api/evaluaciones/examenes/${exId}/auditoria/`);
      setAuditorias(prev => ({ ...prev, [exId]: data }));
    } catch { /* silencioso */ }
    finally { setLoadingAud(prev => ({ ...prev, [exId]: false })); }
  }

  const stats = {
    total:    examenes.length,
    verde:    examenes.filter(e => e.semaforo === 'verde').length,
    amarillo: examenes.filter(e => e.semaforo === 'amarillo').length,
    rojo:     examenes.filter(e => e.semaforo === 'rojo').length,
  };

  const lista = filtro === 'todos'
    ? examenes
    : examenes.filter(e => e.semaforo === filtro);

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, transition: 'background 0.25s' };

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ ...card, padding: '14px 18px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> No se pudo cargar la auditoría.
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Exámenes auditados', value: stats.total,    icon: 'ti-shield',         accent: '#7c3aed' },
          { label: 'Sin riesgo',         value: stats.verde,    icon: 'ti-circle-check',   accent: '#10b981' },
          { label: 'Riesgo medio',       value: stats.amarillo, icon: 'ti-alert-triangle', accent: '#f59e0b' },
          { label: 'Riesgo alto',        value: stats.rojo,     icon: 'ti-alert-circle',   accent: '#ef4444' },
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
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: t.inputBg, padding: 4, borderRadius: 10, border: `1px solid ${t.cardBorder}`, width: 'fit-content' }}>
        {[
          { key: 'todos',    label: `Todos (${stats.total})`    },
          { key: 'verde',    label: `Sin riesgo (${stats.verde})`    },
          { key: 'amarillo', label: `Riesgo medio (${stats.amarillo})` },
          { key: 'rojo',     label: `Riesgo alto (${stats.rojo})`   },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontFamily: 'inherit', fontWeight: filtro === key ? 600 : 450,
            background: filtro === key ? t.card : 'transparent',
            color: filtro === key ? t.text : t.textMuted,
            boxShadow: filtro === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista de exámenes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lista.length === 0 ? (
          <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
            <i className="ti ti-shield-off" style={{ fontSize: 36, color: t.textFaint, display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: t.textMuted }}>No hay exámenes para auditar con este filtro.</div>
          </div>
        ) : (
          lista.map(ex => {
            const aud = auditorias[ex.id];
            const abierto = expandido === ex.id;
            const cargandoAud = loadingAud[ex.id];

            return (
              <div key={ex.id} style={{ ...card, overflow: 'hidden' }}>
                {/* Fila principal */}
                <div
                  onClick={() => toggleExpandir(ex.id)}
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Semáforo */}
                  <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: SEMAFORO_CFG[ex.semaforo]?.color || '#9ca3af' }} />

                  {/* Candidato + vacante */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{ex.candidato_nombre}</div>
                    <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{ex.vacante_titulo}</div>
                  </div>

                  {/* Nota */}
                  {ex.nota != null && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: parseFloat(ex.nota) >= 13 ? '#34d399' : '#f87171' }}>
                        {parseFloat(ex.nota).toFixed(1)}<span style={{ fontSize: 11, fontWeight: 400, color: t.textFaint }}>/20</span>
                      </div>
                      <div style={{ fontSize: 11, color: t.textFaint }}>nota</div>
                    </div>
                  )}

                  {/* Semáforo badge */}
                  <SemaforoBadge semaforo={ex.semaforo} />

                  {/* Fecha */}
                  <div style={{ fontSize: 12, color: t.textFaint, minWidth: 80, textAlign: 'right' }}>
                    {ex.fecha_fin ? new Date(ex.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—'}
                  </div>

                  {/* Chevron */}
                  <i className={`ti ${abierto ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: t.textFaint }} />
                </div>

                {/* Panel expandido */}
                {abierto && (
                  <div style={{ borderTop: `1px solid ${t.cardBorder}`, padding: '20px 20px' }}>
                    {cargandoAud ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                        <div style={{ width: 24, height: 24, border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      </div>
                    ) : aud ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Resumen */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ padding: '10px 16px', borderRadius: 9, background: t.inputBg, border: `1px solid ${t.inputBorder}`, textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{aud.total_eventos}</div>
                            <div style={{ fontSize: 11, color: t.textFaint }}>eventos totales</div>
                          </div>
                          <div style={{ padding: '10px 16px', borderRadius: 9, background: t.inputBg, border: `1px solid ${t.inputBorder}`, textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{aud.puntaje_riesgo}</div>
                            <div style={{ fontSize: 11, color: t.textFaint }}>puntaje riesgo</div>
                          </div>
                          {aud.por_severidad && Object.entries(aud.por_severidad).map(([sev, count]) => (
                            <div key={sev} style={{ padding: '10px 16px', borderRadius: 9, background: SEVERIDAD_CFG[sev]?.bg || t.inputBg, border: `1px solid ${t.inputBorder}`, textAlign: 'center' }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: SEVERIDAD_CFG[sev]?.color || t.text }}>{count}</div>
                              <div style={{ fontSize: 11, color: t.textFaint }}>severidad {sev}</div>
                            </div>
                          ))}
                        </div>

                        {/* Veredicto */}
                        {aud.veredicto && (
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: `${SEMAFORO_CFG[ex.semaforo]?.color || '#9ca3af'}12`, border: `1px solid ${SEMAFORO_CFG[ex.semaforo]?.border || t.cardBorder}`, fontSize: 13.5, color: t.text, lineHeight: 1.6 }}>
                            <i className={`ti ${SEMAFORO_CFG[ex.semaforo]?.icon || 'ti-info-circle'}`} style={{ marginRight: 8, color: SEMAFORO_CFG[ex.semaforo]?.color }} />
                            {aud.veredicto}
                          </div>
                        )}

                        {/* Lista de eventos */}
                        {aud.eventos?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Eventos detectados</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {aud.eventos.map(ev => (
                                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 9, background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: SEVERIDAD_CFG[ev.severidad]?.color || '#9ca3af', flexShrink: 0 }} />
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{ev.tipo_display || TIPO_EVENTO_LABEL[ev.tipo] || ev.tipo}</span>
                                    {ev.detalle && <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 8 }}>— {ev.detalle}</span>}
                                  </div>
                                  <SeveridadBadge severidad={ev.severidad} />
                                  <div style={{ fontSize: 11, color: t.textFaint, minWidth: 50, textAlign: 'right' }}>
                                    {new Date(ev.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aud.total_eventos === 0 && (
                          <div style={{ textAlign: 'center', padding: '16px 0', color: t.textMuted, fontSize: 13.5 }}>
                            <i className="ti ti-circle-check" style={{ fontSize: 24, color: '#34d399', display: 'block', marginBottom: 8 }} />
                            No se detectaron eventos sospechosos durante este examen.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, padding: '12px 0' }}>
                        No se pudo cargar la auditoría de este examen.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}