import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import toast from 'react-hot-toast';
import api from '../services/api';

const ESTADO_CFG = {
  postulado:             { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  border: 'rgba(156,163,175,0.2)',  label: 'Postulado'             },
  cv_analizando:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)',  label: 'Analizando CV...', pulse: true },
  cv_aprobado:           { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',   label: 'CV Aprobado'           },
  cv_rechazado:          { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)',  label: 'CV Rechazado'          },
  examen_pendiente:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',   label: 'Examen Pendiente'      },
  examen_en_curso:       { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',   label: 'Examen en Curso'       },
  examen_aprobado:       { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',   label: 'Examen Aprobado'       },
  examen_rechazado:      { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)',  label: 'Examen Rechazado'      },
  entrevista_pendiente:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',   label: 'Entrevista Pendiente'  },
  entrevista_en_curso:   { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',   label: 'Entrevista en Curso'   },
  entrevista_completada: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)',  label: 'Entrevista Completada' },
  finalista:             { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)',   label: '⭐ Finalista'           },
  entrevista_presencial: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)',  label: 'Entrevista Presencial' },
  contratado:            { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)',   label: '🎉 Contratado'         },
  descartado:            { color: '#4b5563', bg: 'rgba(75,85,99,0.1)',    border: 'rgba(75,85,99,0.2)',     label: 'Descartado'            },
};

const CLASIFICACION_CFG = {
  altamente_recomendado: { color: '#34d399', label: '⭐⭐⭐ Altamente recomendado' },
  recomendado:           { color: '#60a5fa', label: '⭐⭐ Recomendado'            },
  requiere_revision:     { color: '#fbbf24', label: '⭐ Requiere revisión'        },
  no_apto:               { color: '#f87171', label: 'No apto'                    },
};

function Avatar({ nombre, apellido }) {
  const n = (nombre?.[0] || '').toUpperCase();
  const a = (apellido?.[0] || '').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const idx = ((nombre?.charCodeAt(0) || 0) + (apellido?.charCodeAt(0) || 0)) % colors.length;
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: `${colors[idx]}22`, border: `1.5px solid ${colors[idx]}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: colors[idx],
    }}>{n}{a}</div>
  );
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.postulado;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%', background: 'currentColor',
        animation: cfg.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
}

const FILTROS = ['todos', 'postulado', 'cv_aprobado', 'cv_rechazado', 'examen_pendiente', 'finalista', 'contratado', 'descartado'];

export default function CandidatosList() {
  const { t } = useTheme();
  const navigate = useNavigate();

  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filtro, setFiltro]         = useState('todos');
  const [busqueda, setBusqueda]     = useState('');
  const [analizando, setAnalizando] = useState({});

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setLoading(true);
      const { data } = await api.get('/api/candidatos/');
      // Sprint 2 puede devolver paginado: { count, results: [...] }
      setCandidatos(data.results || data);
    } catch {
      setError('No se pudo conectar. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }

  async function analizarCV(candidato) {
    setAnalizando(prev => ({ ...prev, [candidato.id]: true }));
    setCandidatos(prev =>
      prev.map(c => c.id === candidato.id ? { ...c, estado: 'cv_analizando' } : c)
    );
    try {
      const { data } = await api.post(`/api/candidatos/${candidato.id}/analizar/`);
      setCandidatos(prev =>
        prev.map(c => c.id === candidato.id ? { ...c, ...data.candidato } : c)
      );
      if (data.pasa_filtro) {
        toast.success(`✅ CV aprobado — Score: ${data.score}. Correo enviado.`);
      } else {
        toast.error(`❌ CV rechazado — Score: ${data.score}.`);
      }
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data?.error || 'Error en el análisis.';
      toast.error(msg);
      setCandidatos(prev =>
        prev.map(c => c.id === candidato.id ? { ...c, estado: 'postulado' } : c)
      );
    } finally {
      setAnalizando(prev => ({ ...prev, [candidato.id]: false }));
    }
  }

  const stats = {
    total:      candidatos.length,
    aprobados:  candidatos.filter(c => ['cv_aprobado','examen_aprobado','entrevista_completada','finalista','contratado'].includes(c.estado)).length,
    enProceso:  candidatos.filter(c => ['cv_analizando','examen_pendiente','examen_en_curso','entrevista_pendiente','entrevista_en_curso','entrevista_presencial'].includes(c.estado)).length,
    rechazados: candidatos.filter(c => ['cv_rechazado','examen_rechazado','descartado'].includes(c.estado)).length,
  };

  const lista = candidatos
    .filter(c => filtro === 'todos' || c.estado === filtro)
    .filter(c => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        c.nombre_completo?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.vacante_titulo?.toLowerCase().includes(q)
      );
    });

  const card = {
    background: t.card,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 12,
    transition: 'background 0.25s, border-color 0.25s',
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...card, padding: '14px 18px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> {error}
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total candidatos', value: stats.total,      icon: 'ti-users',        accent: '#7c3aed' },
          { label: 'Aprobados',        value: stats.aprobados,  icon: 'ti-circle-check', accent: '#10b981' },
          { label: 'En proceso',       value: stats.enProceso,  icon: 'ti-loader',       accent: '#f59e0b' },
          { label: 'Rechazados',       value: stats.rechazados, icon: 'ti-circle-x',     accent: '#ef4444' },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTROS.map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              transition: 'all 0.15s',
              background: filtro === f ? '#7c3aed' : t.toggleBg,
              color:      filtro === f ? '#fff'    : t.textMuted,
            }}>
              {f === 'todos' ? `Todos (${stats.total})` : (ESTADO_CFG[f]?.label || f)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '6px 12px' }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: t.textFaint }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar candidato..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.text, width: 180, fontFamily: 'inherit' }}
            />
          </div>
          <button onClick={() => navigate('/candidatos/registrar')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 0 18px rgba(124,58,237,0.28)',
          }}>
            <i className="ti ti-user-plus" style={{ fontSize: 16 }} /> Registrar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {lista.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="ti ti-users-off" style={{ fontSize: 40, color: t.textFaint, display: 'block', marginBottom: 12 }} />
            <div style={{ color: t.textMuted, fontSize: 14 }}>
              {busqueda ? `Sin resultados para "${busqueda}".` : 'No hay candidatos registrados aún.'}
            </div>
            <button onClick={() => navigate('/candidatos/registrar')} style={{ marginTop: 14, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Registrar primer candidato
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                {['Candidato', 'Vacante', 'Estado', 'Score CV', 'Clasificación IA', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((c, i) => {
                const cls = CLASIFICACION_CFG[c.clasificacion_ia];
                const estaAnalizando = analizando[c.id];
                const puedeAnalizar  = ['postulado', 'cv_rechazado'].includes(c.estado);
                const nombreParts    = (c.nombre_completo || '').split(' ');

                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < lista.length - 1 ? `1px solid ${t.cardBorder}` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Candidato */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar nombre={nombreParts[0]} apellido={nombreParts[1]} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{c.nombre_completo}</div>
                          <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{c.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Vacante */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{c.vacante_titulo}</div>
                      {c.vacante_area && <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{c.vacante_area}</div>}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '13px 16px' }}>
                      <EstadoBadge estado={c.estado} />
                    </td>

                    {/* Score CV */}
                    <td style={{ padding: '13px 16px' }}>
                      {c.score_cv != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.toggleBg, minWidth: 50 }}>
                            <div style={{
                              width: `${c.score_cv}%`, height: '100%', borderRadius: 2,
                              background: c.score_cv >= 70 ? '#34d399' : c.score_cv >= 40 ? '#fbbf24' : '#f87171',
                              transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 30, color: c.score_cv >= 70 ? '#34d399' : c.score_cv >= 40 ? '#fbbf24' : '#f87171' }}>
                            {c.score_cv}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: t.textFaint }}>—</span>
                      )}
                    </td>

                    {/* Clasificación IA */}
                    <td style={{ padding: '13px 16px' }}>
                      {cls
                        ? <span style={{ fontSize: 12, fontWeight: 500, color: cls.color }}>{cls.label}</span>
                        : <span style={{ fontSize: 12, color: t.textFaint }}>Pendiente</span>
                      }
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {puedeAnalizar && (
                          <button
                            onClick={() => analizarCV(c)}
                            disabled={estaAnalizando}
                            title="Analizar CV con IA"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 7, border: 'none',
                              background: estaAnalizando ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)',
                              color: '#a78bfa', fontSize: 12, fontWeight: 500,
                              cursor: estaAnalizando ? 'wait' : 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!estaAnalizando) e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; }}
                            onMouseLeave={e => { if (!estaAnalizando) e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
                          >
                            {estaAnalizando
                              ? <span style={{ width: 12, height: 12, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                              : <i className="ti ti-robot" style={{ fontSize: 13 }} />
                            }
                            {estaAnalizando ? 'Analizando...' : 'Analizar IA'}
                          </button>
                        )}
                        <a href={`mailto:${c.email}`} title="Enviar email" style={{ width: 28, height: 28, borderRadius: 7, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, textDecoration: 'none', transition: 'all 0.15s', fontSize: 14 }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}>
                          <i className="ti ti-mail" />
                        </a>
                        {c.linkedin && (
                          <a href={c.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" style={{ width: 28, height: 28, borderRadius: 7, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, textDecoration: 'none', transition: 'all 0.15s', fontSize: 14 }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}>
                            <i className="ti ti-brand-linkedin" />
                          </a>
                        )}
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
          Mostrando {lista.length} de {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}