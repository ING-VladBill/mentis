import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const GENERO_MAP = { M: 'Masculino', F: 'Femenino', NB: 'No binario', NI: 'Prefiero no indicar' };

const PHASES = [
  { label: 'Análisis CV',  icon: 'ti-file-text',  key: 'cv',          estados: ['postulado','cv_analizando','cv_aprobado','cv_rechazado'] },
  { label: 'Examen',       icon: 'ti-checklist',  key: 'examen',      estados: ['examen_pendiente','examen_en_curso','examen_aprobado','examen_rechazado'] },
  { label: 'Entrevista',   icon: 'ti-microphone', key: 'entrevista',  estados: ['entrevista_pendiente','entrevista_en_curso','entrevista_completada','entrevista_presencial'] },
  { label: 'Selección',    icon: 'ti-trophy',     key: 'seleccion',   estados: ['finalista','contratado','descartado'] },
];

function scoreColor(v) {
  return v >= 70 ? '#34d399' : v >= 40 ? '#fbbf24' : '#f87171';
}

// ─── AvatarGrande ─────────────────────────────────────────────────────────────
function AvatarGrande({ nombre_completo }) {
  const partes = (nombre_completo || '').trim().split(/\s+/);
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : (partes[0]?.[0] || '?').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const color  = colors[(nombre_completo?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `2.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, fontWeight: 700, color, userSelect: 'none',
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
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {cfg.label}
    </span>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────
function ScoreBar({ value, trackBg }) {
  if (value == null) return null;
  const color = scoreColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: trackBg || 'rgba(128,128,128,0.12)' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, color, minWidth: 40 }}>{value}%</span>
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 5,
      fontSize: 12, fontWeight: 500, color, background: bg,
      border: `1px solid ${color}33`,
    }}>{label}</span>
  );
}

// ─── InfoField ────────────────────────────────────────────────────────────────
function InfoField({ label, value, t }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: t.text }}>{value}</div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CandidatoDetalle() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { t }         = useTheme();

  const [candidato,  setCandidato]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/candidatos/${id}/`)
      .then(r => setCandidato(r.data))
      .catch(() => toast.error('No se pudo cargar el candidato'))
      .finally(() => setLoading(false));
  }, [id]);

  async function analizarCV() {
    setAnalizando(true);
    setCandidato(prev => ({ ...prev, estado: 'cv_analizando' }));
    try {
      const { data } = await api.post(`/api/candidatos/${id}/analizar/`);
      setCandidato(prev => ({ ...prev, ...data.candidato }));
      if (data.pasa_filtro) {
        toast.success(`✅ CV aprobado — Score: ${data.score}. Correo enviado.`);
      } else {
        toast.error(`❌ CV rechazado — Score: ${data.score}.`);
      }
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data?.error || 'Error en el análisis.';
      toast.error(msg);
      setCandidato(prev => ({ ...prev, estado: 'postulado' }));
    } finally {
      setAnalizando(false);
    }
  }

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 };
  const secTitle = (icon, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 16, color: '#7c3aed' }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{label}</span>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!candidato) return (
    <div style={{ ...card, padding: 48, textAlign: 'center', color: t.textMuted }}>
      <i className="ti ti-user-off" style={{ fontSize: 36, marginBottom: 10, display: 'block' }} />
      Candidato no encontrado
    </div>
  );

  const c = candidato;
  const puedeAnalizar = ['postulado', 'cv_rechazado'].includes(c.estado);
  const phaseIdx      = PHASES.findIndex(p => p.estados.includes(c.estado));
  const currentPhase  = phaseIdx === -1 ? 0 : phaseIdx;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Botón volver */}
      <button
        onClick={() => navigate('/candidatos')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: t.textMuted, fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 15 }} />
        Candidatos
      </button>

      {/* ── Header ── */}
      <div style={{ ...card, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <AvatarGrande nombre_completo={c.nombre_completo} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>{c.nombre_completo}</h1>
              {c.es_finalista && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 5, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  ⭐ Finalista
                </span>
              )}
              <EstadoBadge estado={c.estado} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: t.textMuted, fontSize: 13 }}>
              {c.email    && <span><i className="ti ti-mail"    style={{ marginRight: 5 }} />{c.email}</span>}
              {c.telefono && <span><i className="ti ti-phone"   style={{ marginRight: 5 }} />{c.telefono}</span>}
              {c.ciudad   && <span><i className="ti ti-map-pin" style={{ marginRight: 5 }} />{c.ciudad}{c.pais ? `, ${c.pais}` : ''}</span>}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {c.cv && (
              <a href={c.cv} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8,
                background: t.toggleBg, border: `1px solid ${t.cardBorder}`,
                color: t.text, fontSize: 13, textDecoration: 'none', fontWeight: 500,
              }}>
                <i className="ti ti-file-cv" style={{ fontSize: 15 }} />
                Ver CV
              </a>
            )}
            {puedeAnalizar && (
              <button
                onClick={analizarCV}
                disabled={analizando}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: analizando ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)',
                  color: '#a78bfa', fontSize: 13, fontWeight: 500,
                  cursor: analizando ? 'wait' : 'pointer',
                }}
              >
                {analizando
                  ? <span style={{ width: 13, height: 13, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  : <i className="ti ti-robot" style={{ fontSize: 15 }} />
                }
                {analizando ? 'Analizando...' : 'Analizar CV con IA'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Información personal */}
          <div style={{ ...card, padding: '22px 24px' }}>
            {secTitle('ti-user', 'Información personal y profesional')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoField label="Tipo documento"     value={c.tipo_documento}                                                   t={t} />
              <InfoField label="N° documento"       value={c.numero_documento}                                                 t={t} />
              <InfoField label="Género"             value={GENERO_MAP[c.genero]}                                               t={t} />
              <InfoField label="Teléfono"           value={c.telefono}                                                         t={t} />
              <InfoField label="Ciudad"             value={c.ciudad}                                                           t={t} />
              <InfoField label="País"               value={c.pais}                                                             t={t} />
            </div>

            <div style={{ borderTop: `1px solid ${t.divider}`, margin: '16px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoField label="Nivel educativo"    value={c.nivel_educativo}                                                  t={t} />
              <InfoField label="Carrera"            value={c.carrera}                                                          t={t} />
              <InfoField label="Universidad"        value={c.universidad}                                                      t={t} />
              <InfoField label="Años de experiencia" value={c.anios_experiencia != null ? `${c.anios_experiencia} años` : null} t={t} />
              <InfoField label="Cargo actual"       value={c.cargo_actual}                                                     t={t} />
              <InfoField label="Empresa actual"     value={c.empresa_actual}                                                   t={t} />
            </div>

            {(c.linkedin || c.github || c.portfolio) && (
              <>
                <div style={{ borderTop: `1px solid ${t.divider}`, margin: '16px 0' }} />
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {c.linkedin  && <a href={c.linkedin}  target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#38bdf8', fontSize: 13, textDecoration: 'none' }}><i className="ti ti-brand-linkedin" /> LinkedIn</a>}
                  {c.github    && <a href={c.github}    target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: t.textMuted, fontSize: 13, textDecoration: 'none' }}><i className="ti ti-brand-github" /> GitHub</a>}
                  {c.portfolio && <a href={c.portfolio} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#a78bfa', fontSize: 13, textDecoration: 'none' }}><i className="ti ti-world" /> Portfolio</a>}
                </div>
              </>
            )}
          </div>

          {/* Análisis IA */}
          <div style={{ ...card, padding: '22px 24px' }}>
            {secTitle('ti-robot', 'Análisis IA del CV')}
            {!c.cv_analizado ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <i className="ti ti-file-off" style={{ fontSize: 36, color: t.textFaint, display: 'block', marginBottom: 12 }} />
                <div style={{ color: t.textMuted, fontSize: 13.5, marginBottom: 16 }}>CV pendiente de análisis</div>
                {puedeAnalizar && (
                  <button
                    onClick={analizarCV}
                    disabled={analizando}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 500, cursor: analizando ? 'wait' : 'pointer' }}
                  >
                    <i className="ti ti-robot" style={{ fontSize: 14 }} />
                    Analizar ahora
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Scores */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Score CV</div>
                    <ScoreBar value={c.score_cv} trackBg={t.toggleBg} />
                  </div>
                  {c.match_porcentaje != null && (
                    <div>
                      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Match con vacante</div>
                      <ScoreBar value={c.match_porcentaje} trackBg={t.toggleBg} />
                    </div>
                  )}
                </div>

                {/* Clasificación */}
                {c.clasificacion_ia && CLASIFICACION_CFG[c.clasificacion_ia] && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Clasificación IA</div>
                    <span style={{
                      fontSize: 13, fontWeight: 600, padding: '5px 13px', borderRadius: 7,
                      background: CLASIFICACION_CFG[c.clasificacion_ia].bg,
                      color: CLASIFICACION_CFG[c.clasificacion_ia].color,
                      border: `1px solid ${CLASIFICACION_CFG[c.clasificacion_ia].color}33`,
                    }}>
                      {CLASIFICACION_CFG[c.clasificacion_ia].label}
                    </span>
                  </div>
                )}

                {/* Resumen */}
                {c.resumen_cv && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Resumen del CV</div>
                    <div style={{ fontSize: 13, color: t.text, lineHeight: 1.65, padding: '12px 15px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                      {c.resumen_cv}
                    </div>
                  </div>
                )}

                {/* Habilidades detectadas */}
                {c.habilidades_detectadas?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Habilidades detectadas</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.habilidades_detectadas.map((h, i) => <Chip key={i} label={h} color="#34d399" bg="rgba(52,211,153,0.1)" />)}
                    </div>
                  </div>
                )}

                {/* Habilidades faltantes */}
                {c.habilidades_faltantes?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Habilidades faltantes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.habilidades_faltantes.map((h, i) => <Chip key={i} label={h} color="#f87171" bg="rgba(248,113,113,0.1)" />)}
                    </div>
                  </div>
                )}

                {/* Inconsistencias */}
                {c.inconsistencias_cv?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Inconsistencias detectadas</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.inconsistencias_cv.map((h, i) => <Chip key={i} label={h} color="#fbbf24" bg="rgba(251,191,36,0.1)" />)}
                    </div>
                  </div>
                )}

                {c.fecha_analisis_cv && (
                  <div style={{ fontSize: 11.5, color: t.textFaint }}>
                    Analizado el {new Date(c.fecha_analisis_cv).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline del proceso */}
          <div style={{ ...card, padding: '22px 24px' }}>
            {secTitle('ti-timeline', 'Progreso del proceso')}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '0 16px' }}>
              {/* Línea de fondo */}
              <div style={{ position: 'absolute', top: 16, left: '12.5%', right: '12.5%', height: 2, background: t.divider, zIndex: 0 }} />
              {/* Línea de progreso */}
              {currentPhase > 0 && (
                <div style={{ position: 'absolute', top: 16, left: '12.5%', width: `${(currentPhase / (PHASES.length - 1)) * 75}%`, height: 2, background: '#34d399', zIndex: 0, transition: 'width 0.4s' }} />
              )}

              {PHASES.map((phase, idx) => {
                const isPast    = idx < currentPhase;
                const isCurrent = idx === currentPhase;
                const isFuture  = idx > currentPhase;
                const dotColor  = isPast ? '#34d399' : isCurrent ? '#7c3aed' : t.textFaint;
                const scoreVal  = idx === 0 ? c.score_cv : idx === 1 ? c.score_examen : idx === 2 ? c.score_entrevista : null;

                return (
                  <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: '0 0 auto', width: '25%' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', marginBottom: 8,
                      background: isFuture ? t.toggleBg : isCurrent ? 'rgba(124,58,237,0.18)' : 'rgba(52,211,153,0.15)',
                      border: `2px solid ${dotColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ti ${isPast ? 'ti-check' : phase.icon}`} style={{ fontSize: 15, color: dotColor }} />
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: isCurrent ? 600 : 400, color: isFuture ? t.textFaint : t.text, textAlign: 'center', lineHeight: 1.3 }}>
                      {phase.label}
                    </div>
                    {scoreVal != null && (
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: scoreColor(scoreVal), marginTop: 4 }}>
                        {scoreVal}%
                      </div>
                    )}
                    {isCurrent && (
                      <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>Actual</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Vacante postulada */}
          <div style={{ ...card, padding: '20px 22px' }}>
            {secTitle('ti-briefcase', 'Vacante postulada')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.vacante_codigo && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', background: 'rgba(124,58,237,0.1)', padding: '2px 9px', borderRadius: 5, alignSelf: 'flex-start' }}>
                  {c.vacante_codigo}
                </span>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.4 }}>{c.vacante_titulo}</div>
              {c.vacante_area && <div style={{ fontSize: 12.5, color: t.textMuted }}>{c.vacante_area}</div>}
              <button
                onClick={() => navigate(`/vacantes/${c.vacante}/editar`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                  padding: '7px 12px', borderRadius: 7, border: `1px solid ${t.cardBorder}`,
                  background: t.toggleBg, color: t.textMuted, fontSize: 12.5,
                  cursor: 'pointer', width: 'fit-content',
                }}
              >
                <i className="ti ti-external-link" style={{ fontSize: 13 }} />
                Ver vacante
              </button>
            </div>
          </div>

          {/* Score final */}
          {c.score_final != null && (
            <div style={{ ...card, padding: '20px 22px' }}>
              {secTitle('ti-trophy', 'Score final')}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 60, fontWeight: 800, color: scoreColor(c.score_final), lineHeight: 1 }}>
                  {c.score_final}
                </div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 6 }}>Puntuación final</div>
                {c.posicion_ranking != null && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
                    🏆 Posición #{c.posicion_ranking} en el ranking
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${t.divider}`, paddingTop: 14 }}>
                {[
                  { label: 'CV (25%)',          value: c.score_cv        },
                  { label: 'Examen (40%)',       value: c.score_examen    },
                  { label: 'Entrevista (35%)',   value: c.score_entrevista },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: t.textMuted }}>{label}</span>
                    <span style={{ fontWeight: 600, color: value != null ? scoreColor(value) : t.textFaint }}>
                      {value != null ? `${value}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auditoría */}
          <div style={{ ...card, padding: '20px 22px' }}>
            {secTitle('ti-calendar', 'Auditoría')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoField label="Fecha de postulación" value={c.fecha_postulacion ? new Date(c.fecha_postulacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : null} t={t} />
              <InfoField label="Registrado por"       value={c.registrado_por}    t={t} />
              <InfoField label="Aprobado por"         value={c.aprobado_por}      t={t} />
              <InfoField label="Nota de aprobación"   value={c.nota_aprobacion}   t={t} />
              <InfoField label="Observaciones RRHH"   value={c.observaciones_rrhh} t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
