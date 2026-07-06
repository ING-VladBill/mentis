import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../App';
import api from '../services/api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADO_CFG = {
  postulado:             { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.2)',  label: 'Postulado'             },
  cv_analizando:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)',  label: 'Analizando CV...'      },
  cv_aprobado:           { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',   label: 'CV Aprobado'           },
  cv_rechazado:          { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)',  label: 'CV Rechazado'          },
  examen_pendiente:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',   label: 'Examen Pendiente'      },
  examen_en_curso:       { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',   label: 'Examen en Curso'       },
  examen_aprobado:       { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',   label: 'Examen Aprobado'       },
  examen_rechazado:      { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)',  label: 'Examen Rechazado'      },
  entrevista_pendiente:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',   label: 'Entrevista Pendiente'  },
  entrevista_en_curso:   { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',   label: 'Entrevista en Curso'   },
  entrevista_completada: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)',  label: 'Entrevista Completada' },
  entrevista_presencial: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)',  label: 'Entrevista Presencial' },
  finalista:             { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)',   label: 'Finalista'             },
  contratado:            { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)',   label: 'Contratado'            },
  descartado:            { color: '#4b5563', bg: 'rgba(75,85,99,0.1)',    border: 'rgba(75,85,99,0.2)',     label: 'Descartado'            },
};

const CLASIFICACION_CFG = {
  altamente_recomendado: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: '⭐⭐⭐ Altamente recomendado' },
  recomendado:           { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: '⭐⭐ Recomendado'            },
  requiere_revision:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: '⭐ Requiere revisión'        },
  no_apto:               { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'No apto'                    },
};

const MEDALLAS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function scoreFinalColor(v) {
  if (v == null) return '#9ca3af';
  return v >= 14 ? '#34d399' : v >= 11 ? '#fbbf24' : '#f87171';
}

function scoreCvColor(v) {
  if (v == null) return '#9ca3af';
  return v >= 70 ? '#34d399' : v >= 40 ? '#fbbf24' : '#f87171';
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ nombre }) {
  const partes = (nombre || '').trim().split(/\s+/);
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : (partes[0]?.[0] || '?').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626'];
  const color  = colors[(nombre?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color, userSelect: 'none',
    }}>
      {iniciales}
    </div>
  );
}

// ─── EstadoBadge ──────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.postulado;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {cfg.label}
    </span>
  );
}

// ─── ScoreBarCompact ──────────────────────────────────────────────────────────
function ScoreBarCompact({ value, trackBg }) {
  if (value == null) return <span style={{ fontSize: 12, color: '#6b7280' }}>—</span>;
  const color = scoreCvColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 90 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: trackBg || 'rgba(128,128,128,0.15)' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color, minWidth: 30 }}>{value}%</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Ranking() {
  const { t, dark }    = useTheme();
  const navigate       = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [vacantes,       setVacantes]       = useState([]);
  const [vacanteId,      setVacanteId]      = useState(searchParams.get('vacante_id') || '');
  const [vacanteActual,  setVacanteActual]  = useState(null);
  const [ranking,        setRanking]        = useState([]);
  const [total,          setTotal]          = useState(0);
  const [loadingVac,     setLoadingVac]     = useState(true);
  const [loadingRank,    setLoadingRank]    = useState(false);
  const [marcando,       setMarcando]       = useState(false);

  // Cargar lista de vacantes para el selector
  useEffect(() => {
    api.get('/api/vacantes/')
      .then(r => setVacantes(r.data.results || r.data))
      .catch(() => toast.error('Error al cargar vacantes'))
      .finally(() => setLoadingVac(false));
  }, []);

  // Cargar ranking cuando se selecciona vacante
  const cargarRanking = useCallback(async (id) => {
    if (!id) return;
    setLoadingRank(true);
    try {
      const { data } = await api.get(`/api/candidatos/ranking/?vacante_id=${id}`);
      setRanking(data.ranking || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Error al cargar el ranking');
      setRanking([]);
    } finally {
      setLoadingRank(false);
    }
  }, []);

  // Sincronizar vacante seleccionada con la lista
  useEffect(() => {
    if (vacanteId && vacantes.length > 0) {
      const v = vacantes.find(x => String(x.id) === String(vacanteId));
      setVacanteActual(v || null);
      cargarRanking(vacanteId);
    }
  }, [vacanteId, vacantes, cargarRanking]);

  function handleSelectVacante(e) {
    const id = e.target.value;
    setVacanteId(id);
    setRanking([]);
    if (id) {
      setSearchParams({ vacante_id: id });
    } else {
      setSearchParams({});
      setVacanteActual(null);
    }
  }

  async function marcarFinalistas() {
    if (!vacanteId) return;
    setMarcando(true);
    try {
      const { data } = await api.post('/api/candidatos/marcar-finalistas/', { vacante_id: vacanteId });
      toast.success(data.mensaje || 'Finalistas marcados correctamente');
      cargarRanking(vacanteId);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Error al marcar finalistas';
      toast.error(msg);
    } finally {
      setMarcando(false);
    }
  }

  // Stats calculadas del ranking
  const stats = {
    total:      total,
    promedio:   ranking.length
      ? Math.round(ranking.filter(r => r.score_final != null).reduce((s, r) => s + r.score_final, 0) / (ranking.filter(r => r.score_final != null).length || 1) * 10) / 10
      : null,
    finalistas: ranking.filter(r => r.es_finalista).length,
    pendientes: ranking.filter(r => r.score_final == null).length,
  };

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 };
  const inp  = {
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 9, color: t.text, fontSize: 13.5,
    outline: 'none', colorScheme: dark ? 'dark' : 'light',
  };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Selector de vacante ── */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
            <i className="ti ti-briefcase" style={{ fontSize: 18, color: '#7c3aed', flexShrink: 0 }} />
            <select
              value={vacanteId}
              onChange={handleSelectVacante}
              style={{ ...inp, flex: 1, padding: '9px 12px' }}
            >
              <option value="">— Selecciona una vacante para ver el ranking —</option>
              {vacantes.map(v => (
                <option key={v.id} value={v.id}>
                  {v.codigo ? `[${v.codigo}] ` : ''}{v.titulo}
                </option>
              ))}
            </select>
          </div>

          {/* Header info de la vacante */}
          {vacanteActual && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: t.textMuted }}>
                <span style={{ fontWeight: 600, color: t.text }}>{total}</span> candidatos en ranking
              </div>
              {ranking.length > 0 && (
                <button
                  onClick={marcarFinalistas}
                  disabled={marcando}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: marcando ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.15)',
                    color: '#34d399', fontSize: 13, fontWeight: 500,
                    cursor: marcando ? 'wait' : 'pointer',
                  }}
                >
                  {marcando
                    ? <span style={{ width: 13, height: 13, border: '2px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    : <i className="ti ti-star" style={{ fontSize: 14 }} />
                  }
                  {marcando ? 'Marcando...' : 'Marcar finalistas'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sin selección ── */}
      {!vacanteId && (
        <div style={{ ...card, padding: '70px 20px', textAlign: 'center' }}>
          <i className="ti ti-trophy" style={{ fontSize: 52, color: t.textFaint, display: 'block', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: t.textMuted, marginBottom: 8 }}>Selecciona una vacante</div>
          <div style={{ fontSize: 13, color: t.textFaint }}>Elige una vacante del selector para ver el ranking de candidatos</div>
        </div>
      )}

      {/* ── Loading ranking ── */}
      {vacanteId && loadingRank && (
        <div style={{ ...card, padding: 48, textAlign: 'center', color: t.textMuted }}>
          <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          Cargando ranking...
        </div>
      )}

      {/* ── Con datos ── */}
      {vacanteId && !loadingRank && (
        <>
          {/* Stats cards */}
          {ranking.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Total en ranking',    value: stats.total,                          icon: 'ti-users',        color: '#7c3aed' },
                { label: 'Score promedio',       value: stats.promedio != null ? `${stats.promedio}/20` : '—', icon: 'ti-chart-bar', color: '#3b82f6' },
                { label: 'Finalistas marcados', value: stats.finalistas,                     icon: 'ti-star',         color: '#f59e0b' },
                { label: 'Sin score aún',        value: stats.pendientes,                     icon: 'ti-clock',        color: '#9ca3af' },
              ].map(s => (
                <div key={s.label} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `${s.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 19, color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: t.text, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vacante seleccionada header */}
          {vacanteActual && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {vacanteActual.codigo && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '2px 9px', borderRadius: 5, letterSpacing: '0.07em' }}>
                  {vacanteActual.codigo}
                </span>
              )}
              <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{vacanteActual.titulo}</span>
            </div>
          )}

          {/* Tabla ranking */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {ranking.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <i className="ti ti-chart-off" style={{ fontSize: 40, color: t.textFaint, display: 'block', marginBottom: 12 }} />
                <div style={{ color: t.textMuted, fontSize: 14, marginBottom: 6 }}>No hay candidatos con score calculado aún</div>
                <div style={{ color: t.textFaint, fontSize: 12.5 }}>Analiza los CVs de los candidatos primero para ver el ranking</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                    {['Pos.', 'Candidato', 'Score Final', 'Score CV', 'Examen', 'Entrevista', 'Clasificación IA', 'Estado', 'Finalista'].map(h => (
                      <th key={h} style={{
                        padding: '12px 14px', textAlign: 'left',
                        fontSize: 10.5, fontWeight: 600, color: t.textMuted,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => {
                    const isTop1  = r.posicion_ranking === 1;
                    const medalla = MEDALLAS[r.posicion_ranking];
                    const cls     = CLASIFICACION_CFG[r.clasificacion_ia];

                    return (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: `1px solid ${t.divider}`,
                          transition: 'background 0.12s',
                          borderLeft: isTop1 ? '3px solid #7c3aed' : '3px solid transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Posición */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {medalla
                              ? <span style={{ fontSize: 20 }}>{medalla}</span>
                              : <span style={{ fontSize: 14, fontWeight: 700, color: t.textMuted, minWidth: 20, textAlign: 'center' }}>#{r.posicion_ranking}</span>
                            }
                          </div>
                        </td>

                        {/* Candidato */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar nombre={r.nombre_completo} />
                            <div>
                              <div
                                onClick={() => navigate(`/candidatos/${r.id}`)}
                                style={{ fontSize: 13.5, fontWeight: 600, color: t.text, cursor: 'pointer', lineHeight: 1.3 }}
                                onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                                onMouseLeave={e => e.currentTarget.style.color = t.text}
                              >
                                {r.nombre_completo}
                              </div>
                              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{r.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Score Final */}
                        <td style={{ padding: '13px 14px' }}>
                          {r.score_final != null ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                              <span style={{ fontSize: 22, fontWeight: 800, color: scoreFinalColor(r.score_final), lineHeight: 1 }}>
                                {r.score_final}
                              </span>
                              <span style={{ fontSize: 11, color: t.textFaint }}>/20</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                          )}
                        </td>

                        {/* Score CV */}
                        <td style={{ padding: '13px 14px' }}>
                          <ScoreBarCompact value={r.score_cv} trackBg={t.toggleBg} />
                        </td>

                        {/* Examen */}
                        <td style={{ padding: '13px 14px' }}>
                          {r.score_examen != null ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: scoreFinalColor(r.score_examen) }}>{r.score_examen}</span>
                              <span style={{ fontSize: 10.5, color: t.textFaint }}>/20</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                          )}
                        </td>

                        {/* Entrevista */}
                        <td style={{ padding: '13px 14px' }}>
                          {r.score_entrevista != null ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: scoreFinalColor(r.score_entrevista) }}>{r.score_entrevista}</span>
                              <span style={{ fontSize: 10.5, color: t.textFaint }}>/20</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                          )}
                        </td>

                        {/* Clasificación IA */}
                        <td style={{ padding: '13px 14px' }}>
                          {cls ? (
                            <span style={{
                              fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
                              background: cls.bg, color: cls.color,
                            }}>{cls.label}</span>
                          ) : (
                            <span style={{ fontSize: 11.5, color: t.textFaint }}>—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '13px 14px' }}>
                          <EstadoBadge estado={r.estado} />
                        </td>

                        {/* Finalista */}
                        <td style={{ padding: '13px 14px' }}>
                          {r.es_finalista ? (
                            <span style={{
                              fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
                              background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                              border: '1px solid rgba(251,191,36,0.3)',
                            }}>⭐ Finalista</span>
                          ) : (
                            <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {ranking.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: t.textFaint, textAlign: 'right' }}>
              {ranking.length} candidato{ranking.length !== 1 ? 's' : ''} en el ranking
            </div>
          )}
        </>
      )}
    </div>
  );
}
