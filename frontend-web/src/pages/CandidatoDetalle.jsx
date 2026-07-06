import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import EntrevistaPanel from './EntrevistaPanel';
import AccionesTalento from './AccionesTalento';

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

const GENERO_MAP  = { M: 'Masculino', F: 'Femenino', NB: 'No binario', NI: 'Prefiero no indicar' };
const ESTADOS_SIN_REENVIO = [
  'postulado', 'cv_analizando', 'cv_rechazado',
  'examen_rechazado', 'descartado', 'contratado',
];
function puedeReenviarCorreo(estado) {
  return !ESTADOS_SIN_REENVIO.includes(estado);
}

const SOURCE_MAP  = {
  manual: 'Registro manual', carga_masiva: 'Carga masiva',
  formulario: 'Formulario público', buzon_imap: 'Buzón de correo',
  referido: 'Referido', linkedin: 'LinkedIn', computrabajo: 'Computrabajo',
  bumeran: 'Bumeran', indeed: 'Indeed', otro_portal: 'Otro portal',
};

// Fases del proceso — labels y estados que las activan
const PHASES = [
  {
    label: 'Análisis CV',
    icon: 'ti-file-text',
    scoreKey: 'score_cv',
    // Cómo mostrar el score: "87/100"
    scoreLabel: (v) => v != null ? `${v}/100` : null,
    scoreUnit: '',
    estados: ['postulado','cv_analizando','cv_aprobado','cv_rechazado'],
  },
  {
    label: 'Examen',
    icon: 'ti-checklist',
    scoreKey: 'score_examen',
    scoreLabel: (v) => v != null ? `${v}/20` : null,
    estados: ['examen_pendiente','examen_en_curso','examen_aprobado','examen_rechazado'],
  },
  {
    label: 'Entrevista',
    icon: 'ti-microphone',
    scoreKey: 'score_entrevista',
    scoreLabel: (v) => v != null ? `${v}/20` : null,
    estados: ['entrevista_pendiente','entrevista_en_curso','entrevista_completada','entrevista_presencial'],
  },
  {
    label: 'Selección',
    icon: 'ti-trophy',
    scoreKey: null,
    scoreLabel: () => null,
    estados: ['finalista','contratado','descartado'],
  },
];

function scoreColor(v, max = 100) {
  const pct = max === 100 ? v : (v / max) * 100;
  return pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
}

// ─── Componentes auxiliares (FUERA del componente principal) ──────────────────

function AvatarGrande({ nombre_completo }) {
  const partes = (nombre_completo || '').trim().split(/\s+/);
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : (partes[0]?.[0] || '?').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const color = colors[(nombre_completo?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, background: `${color}22`, border: `2.5px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color, userSelect: 'none' }}>
      {iniciales}
    </div>
  );
}

function AvatarSmall({ nombre }) {
  const parts = (nombre || '').trim().split(/\s+/);
  const ini = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : (parts[0]?.[0] || '?').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706'];
  const color = colors[(nombre?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `${color}22`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color }}>
      {ini}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || ESTADO_CFG.postulado;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ value, max = 100, trackBg }) {
  if (value == null) return null;
  const color = scoreColor(value, max);
  const pct = max === 100 ? value : (value / max) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: trackBg || 'rgba(128,128,128,0.12)' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, color, minWidth: 52 }}>{value}/{max}</span>
    </div>
  );
}

function Chip({ label, color, bg }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500, color, background: bg, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

function InfoField({ label, value, t }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: t.text }}>{value}</div>
    </div>
  );
}

// ─── Tags Card ────────────────────────────────────────────────────────────────
function TagsCard({ candidatoId, initialTags, t }) {
  const [tags, setTags]         = useState(initialTags || []);
  const [allTags, setAllTags]   = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const dropRef                 = useRef(null);

  useEffect(() => {
    api.get('/api/tags/').then(r => setAllTags(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function agregar(tag) {
    setTags(prev => [...prev, tag]);
    setShowDrop(false);
    try {
      await api.post(`/api/candidatos/${candidatoId}/tags/agregar/`, { tag_id: tag.id });
      toast.success(`Etiqueta "${tag.nombre}" agregada.`);
    } catch {
      setTags(prev => prev.filter(t => t.id !== tag.id));
      toast.error('Error al agregar etiqueta.');
    }
  }

  async function quitar(tag) {
    setTags(prev => prev.filter(t => t.id !== tag.id));
    try {
      await api.post(`/api/candidatos/${candidatoId}/tags/quitar/`, { tag_id: tag.id });
    } catch {
      setTags(prev => [...prev, tag]);
      toast.error('Error al quitar etiqueta.');
    }
  }

  const asignados   = new Set(tags.map(t => t.id));
  const disponibles = allTags.filter(t => !asignados.has(t.id));

  return (
    <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-tag" style={{ fontSize: 16, color: '#7c3aed' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Etiquetas</span>
        </div>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowDrop(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 12, cursor: 'pointer' }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> Agregar
          </button>
          {showDrop && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 200, background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 10, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              {disponibles.length === 0
                ? <div style={{ padding: '12px 14px', fontSize: 12.5, color: t.textFaint }}>No hay más etiquetas disponibles</div>
                : disponibles.map(tag => (
                  <button key={tag.id} onClick={() => agregar(tag)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: t.text, textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.toggleBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color || '#7c3aed', flexShrink: 0 }} />
                    {tag.nombre}
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>
      {tags.length === 0
        ? <div style={{ fontSize: 12.5, color: t.textFaint, fontStyle: 'italic' }}>Sin etiquetas — haz clic en Agregar para añadir</div>
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(tag => {
              const c = tag.color || '#7c3aed';
              return (
                <span key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: `${c}20`, color: c, border: `1px solid ${c}40` }}>
                  {tag.nombre}
                  <button onClick={() => quitar(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.7, fontSize: 13 }}>×</button>
                </span>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ─── Notas Card ───────────────────────────────────────────────────────────────
function NotasCard({ candidatoId, t }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const miNombre = `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim();

  const [notas, setNotas]         = useState([]);
  const [loadingNotas, setLoad]   = useState(true);
  const [nuevaNota, setNueva]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditId]   = useState(null);
  const [editTexto, setEditTxt]   = useState('');
  const [guardandoEdit, setGEdit] = useState(false);
  const [eliminandoId, setDelId]  = useState(null);

  useEffect(() => { cargarNotas(); }, [candidatoId]);

  async function cargarNotas() {
    try {
      setLoad(true);
      const { data } = await api.get(`/api/candidatos/${candidatoId}/notas/`);
      setNotas(data.results || data);
    } catch { toast.error('No se pudieron cargar las notas.'); }
    finally { setLoad(false); }
  }

  async function agregar() {
    if (!nuevaNota.trim()) return;
    setGuardando(true);
    try {
      const { data } = await api.post(`/api/candidatos/${candidatoId}/notas/agregar/`, { contenido: nuevaNota.trim() });
      setNotas(prev => [data, ...prev]);
      setNueva('');
      toast.success('Nota agregada.');
    } catch { toast.error('Error al guardar la nota.'); }
    finally { setGuardando(false); }
  }

  async function guardarEdicion(nid) {
    if (!editTexto.trim()) return;
    setGEdit(true);
    try {
      const { data } = await api.patch(`/api/candidatos/${candidatoId}/notas/${nid}/editar/`, { contenido: editTexto.trim() });
      setNotas(prev => prev.map(n => n.id === nid ? data : n));
      setEditId(null);
      toast.success('Nota actualizada.');
    } catch { toast.error('Error al editar la nota.'); }
    finally { setGEdit(false); }
  }

  async function eliminar(nid) {
    if (!confirm('¿Eliminar esta nota?')) return;
    setDelId(nid);
    try {
      await api.delete(`/api/candidatos/${candidatoId}/notas/${nid}/eliminar/`);
      setNotas(prev => prev.filter(n => n.id !== nid));
      toast.success('Nota eliminada.');
    } catch { toast.error('Error al eliminar la nota.'); }
    finally { setDelId(null); }
  }

  function formatFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <i className="ti ti-notes" style={{ fontSize: 16, color: '#7c3aed' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Notas internas</span>
        <span style={{ fontSize: 11, color: t.textFaint, marginLeft: 4 }}>— solo el equipo RRHH</span>
      </div>

      {loadingNotas ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: t.textFaint, fontSize: 13 }}>Cargando...</div>
      ) : notas.length === 0 ? (
        <div style={{ fontSize: 12.5, color: t.textFaint, fontStyle: 'italic', marginBottom: 16 }}>Sin notas aún — agrega la primera abajo</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {notas.map(nota => {
            const esMia = nota.autor_nombre === miNombre || nota.autor_nombre?.includes(usuario.nombre || '___');
            const editando = editandoId === nota.id;
            return (
              <div key={nota.id} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 9, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AvatarSmall nombre={nota.autor_nombre} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>{nota.autor_nombre}</span>
                    {nota.editado && <span style={{ fontSize: 10, color: t.textFaint, marginLeft: 6 }}>editado</span>}
                    <div style={{ fontSize: 11, color: t.textFaint }}>{formatFecha(nota.fecha)}</div>
                  </div>
                  {esMia && !editando && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditId(nota.id); setEditTxt(nota.contenido); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textFaint, fontSize: 13, padding: '2px 5px', borderRadius: 5 }}
                        onMouseEnter={e => e.currentTarget.style.color = t.text}
                        onMouseLeave={e => e.currentTarget.style.color = t.textFaint}>
                        <i className="ti ti-edit" /></button>
                      <button onClick={() => eliminar(nota.id)} disabled={eliminandoId === nota.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textFaint, fontSize: 13, padding: '2px 5px', borderRadius: 5 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = t.textFaint}>
                        <i className="ti ti-trash" /></button>
                    </div>
                  )}
                </div>
                {editando ? (
                  <div>
                    <textarea value={editTexto} onChange={e => setEditTxt(e.target.value)} rows={3}
                      style={{ width: '100%', boxSizing: 'border-box', background: t.card, border: `1px solid rgba(124,58,237,0.4)`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: t.text, outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => guardarEdicion(nota.id)} disabled={guardandoEdit} style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                        {guardandoEdit ? 'Guardando...' : 'Guardar'}</button>
                      <button onClick={() => setEditId(null)} style={{ padding: '5px 14px', borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: t.text, lineHeight: 1.6, margin: 0 }}>{nota.contenido}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${t.cardBorder}`, paddingTop: 14 }}>
        <textarea value={nuevaNota} onChange={e => setNueva(e.target.value)} rows={3} placeholder="Escribe una nota interna..."
          style={{ width: '100%', boxSizing: 'border-box', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: t.text, outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', marginBottom: 8 }} />
        <button onClick={agregar} disabled={guardando || !nuevaNota.trim()}
          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: guardando || !nuevaNota.trim() ? 'rgba(124,58,237,0.3)' : '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 500, cursor: guardando || !nuevaNota.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          {guardando ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <i className="ti ti-send" style={{ fontSize: 13 }} />}
          {guardando ? 'Guardando...' : 'Agregar nota'}
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CandidatoDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { t }    = useTheme();

  const [candidato,  setCandidato]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/candidatos/${id}/`)
      .then(r => setCandidato(r.data))
      .catch(() => toast.error('No se pudo cargar el candidato'))
      .finally(() => setLoading(false));
  }, [id]);

  async function reenviarCorreoEtapa() {
    setReenviando(true);
    try {
      const { data } = await api.post(`/api/candidatos/${id}/reenviar-correo-etapa/`);
      toast.success(data.mensaje);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al reenviar el correo.');
    } finally { setReenviando(false); }
  }

  async function analizarCV() {
    setAnalizando(true);
    setCandidato(prev => ({ ...prev, estado: 'cv_analizando' }));
    try {
      const { data } = await api.post(`/api/candidatos/${id}/analizar/`);
      setCandidato(prev => ({ ...prev, ...data.candidato }));
      if (data.pasa_filtro) toast.success(`✅ CV aprobado — Score: ${data.score}. Correo enviado.`);
      else toast.error(`❌ CV rechazado — Score: ${data.score}.`);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || err.response?.data?.error || 'Error en el análisis.');
      setCandidato(prev => ({ ...prev, estado: 'postulado' }));
    } finally { setAnalizando(false); }
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

  // Determinar en qué fase está el candidato
  const phaseIdx   = PHASES.findIndex(p => p.estados.includes(c.estado));
  const currentPhase = phaseIdx === -1 ? 0 : phaseIdx;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <button onClick={() => navigate('/candidatos')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: t.textMuted, fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Candidatos
      </button>

      {/* ── Header ── */}
      <div style={{ ...card, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <AvatarGrande nombre_completo={c.nombre_completo} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>{c.nombre_completo}</h1>
              {c.es_finalista && <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 5, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>⭐ Finalista</span>}
              <EstadoBadge estado={c.estado} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: t.textMuted, fontSize: 13 }}>
              {c.email    && <span><i className="ti ti-mail"    style={{ marginRight: 5 }} />{c.email}</span>}
              {c.telefono && <span><i className="ti ti-phone"   style={{ marginRight: 5 }} />{c.telefono}</span>}
              {c.ciudad   && <span><i className="ti ti-map-pin" style={{ marginRight: 5 }} />{c.ciudad}{c.pais ? `, ${c.pais}` : ''}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {c.cv && (
              <a href={c.cv} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, color: t.text, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                <i className="ti ti-file-cv" style={{ fontSize: 15 }} /> Ver CV
              </a>
            )}
            {puedeAnalizar && (
              <button onClick={analizarCV} disabled={analizando} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: analizando ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.15)', color: '#a78bfa', fontSize: 13, fontWeight: 500, cursor: analizando ? 'wait' : 'pointer' }}>
                {analizando ? <span style={{ width: 13, height: 13, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <i className="ti ti-robot" style={{ fontSize: 15 }} />}
                {analizando ? 'Analizando...' : 'Analizar CV con IA'}
              </button>
            )}
            {puedeReenviarCorreo(c.estado) && (
              <button onClick={reenviarCorreoEtapa} disabled={reenviando} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: reenviando ? 'rgba(96,165,250,0.2)' : 'rgba(96,165,250,0.12)', color: '#60a5fa', fontSize: 13, fontWeight: 500, cursor: reenviando ? 'wait' : 'pointer' }}>
                {reenviando ? <span style={{ width: 13, height: 13, border: '2px solid rgba(96,165,250,0.3)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <i className="ti ti-mail-forward" style={{ fontSize: 15 }} />}
                {reenviando ? 'Enviando...' : 'Reenviar correo de etapa'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info personal */}
          <div style={{ ...card, padding: '22px 24px' }}>
            {secTitle('ti-user', 'Información personal y profesional')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoField label="Tipo documento"      value={c.tipo_documento}                                                    t={t} />
              <InfoField label="N° documento"        value={c.numero_documento}                                                  t={t} />
              <InfoField label="Género"              value={GENERO_MAP[c.genero]}                                                t={t} />
              <InfoField label="Teléfono"            value={c.telefono}                                                          t={t} />
              <InfoField label="Ciudad"              value={c.ciudad}                                                            t={t} />
              <InfoField label="País"                value={c.pais}                                                              t={t} />
              <InfoField label="Pretensión salarial" value={c.pretension_salarial ? `S/ ${c.pretension_salarial}` : null}       t={t} />
              <InfoField label="Disponibilidad"      value={c.disponibilidad}                                                    t={t} />
              <InfoField label="Origen"              value={SOURCE_MAP[c.source] || c.source}                                   t={t} />
            </div>
            <div style={{ borderTop: `1px solid ${t.divider}`, margin: '16px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoField label="Nivel educativo"     value={c.nivel_educativo}                                                   t={t} />
              <InfoField label="Carrera"             value={c.carrera}                                                           t={t} />
              <InfoField label="Universidad"         value={c.universidad}                                                       t={t} />
              <InfoField label="Años de experiencia" value={c.anios_experiencia != null ? `${c.anios_experiencia} años` : null} t={t} />
              <InfoField label="Cargo actual"        value={c.cargo_actual}                                                      t={t} />
              <InfoField label="Empresa actual"      value={c.empresa_actual}                                                    t={t} />
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
                  <button onClick={analizarCV} disabled={analizando} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 500, cursor: analizando ? 'wait' : 'pointer' }}>
                    <i className="ti ti-robot" style={{ fontSize: 14 }} /> Analizar ahora
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                {c.clasificacion_ia && CLASIFICACION_CFG[c.clasificacion_ia] && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Clasificación IA</div>
                    <span style={{ fontSize: 13, fontWeight: 600, padding: '5px 13px', borderRadius: 7, background: CLASIFICACION_CFG[c.clasificacion_ia].bg, color: CLASIFICACION_CFG[c.clasificacion_ia].color, border: `1px solid ${CLASIFICACION_CFG[c.clasificacion_ia].color}33` }}>
                      {CLASIFICACION_CFG[c.clasificacion_ia].label}
                    </span>
                  </div>
                )}
                {c.resumen_cv && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Resumen del CV</div>
                    <div style={{ fontSize: 13, color: t.text, lineHeight: 1.65, padding: '12px 15px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>{c.resumen_cv}</div>
                  </div>
                )}
                {c.habilidades_detectadas?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Habilidades detectadas</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{c.habilidades_detectadas.map((h,i) => <Chip key={i} label={h} color="#34d399" bg="rgba(52,211,153,0.1)" />)}</div>
                  </div>
                )}
                {c.habilidades_faltantes?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Habilidades faltantes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{c.habilidades_faltantes.map((h,i) => <Chip key={i} label={h} color="#f87171" bg="rgba(248,113,113,0.1)" />)}</div>
                  </div>
                )}
                {c.inconsistencias_cv?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Inconsistencias detectadas</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{c.inconsistencias_cv.map((h,i) => <Chip key={i} label={h} color="#fbbf24" bg="rgba(251,191,36,0.1)" />)}</div>
                  </div>
                )}
                {c.fecha_analisis_cv && <div style={{ fontSize: 11.5, color: t.textFaint }}>Analizado el {new Date(c.fecha_analisis_cv).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</div>}
              </div>
            )}
          </div>

          {/* ── Timeline de progreso (ARREGLADO) ── */}
          <div style={{ ...card, padding: '22px 24px' }}>
            {secTitle('ti-timeline', 'Progreso del proceso')}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '0 16px' }}>
              {/* línea de fondo */}
              <div style={{ position: 'absolute', top: 17, left: '12.5%', right: '12.5%', height: 2, background: t.divider, zIndex: 0 }} />
              {/* línea de progreso */}
              {currentPhase > 0 && (
                <div style={{ position: 'absolute', top: 17, left: '12.5%', width: `${(currentPhase / (PHASES.length - 1)) * 75}%`, height: 2, background: '#34d399', zIndex: 0, transition: 'width 0.4s' }} />
              )}
              {PHASES.map((phase, idx) => {
                const isPast    = idx < currentPhase;
                const isCurrent = idx === currentPhase;
                const isFuture  = idx > currentPhase;
                const dotColor  = isPast ? '#34d399' : isCurrent ? '#7c3aed' : t.textFaint;
                const scoreVal  = phase.scoreKey ? c[phase.scoreKey] : null;
                const scoreText = phase.scoreLabel(scoreVal); // ej: "87/100"

                return (
                  <div key={phase.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: '0 0 auto', width: '25%' }}>
                    {/* Círculo */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', marginBottom: 10,
                      background: isFuture ? t.toggleBg : isCurrent ? 'rgba(124,58,237,0.18)' : 'rgba(52,211,153,0.15)',
                      border: `2px solid ${dotColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ti ${isPast ? 'ti-check' : phase.icon}`} style={{ fontSize: 15, color: dotColor }} />
                    </div>

                    {/* Label de la fase */}
                    <div style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isFuture ? t.textFaint : t.text, textAlign: 'center', lineHeight: 1.3, marginBottom: 4 }}>
                      {phase.label}
                    </div>

                    {/* Score — formato "87/100" en lugar de "87% Actual" */}
                    {scoreText && (
                      <div style={{
                        fontSize: 11.5, fontWeight: 700,
                        color: scoreColor(scoreVal, phase.scoreKey === 'score_cv' ? 100 : 20),
                        background: `${scoreColor(scoreVal, phase.scoreKey === 'score_cv' ? 100 : 20)}15`,
                        border: `1px solid ${scoreColor(scoreVal, phase.scoreKey === 'score_cv' ? 100 : 20)}30`,
                        padding: '2px 8px', borderRadius: 5,
                      }}>
                        {scoreText}
                      </div>
                    )}

                    {/* Badge "En curso" para la fase actual cuando no hay score todavía */}
                    {isCurrent && !scoreText && (
                      <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 600, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 8px', borderRadius: 5 }}>
                        En curso
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Vacante */}
          <div style={{ ...card, padding: '20px 22px' }}>
            {secTitle('ti-briefcase', 'Vacante postulada')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.vacante_codigo && <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', background: 'rgba(124,58,237,0.1)', padding: '2px 9px', borderRadius: 5, alignSelf: 'flex-start' }}>{c.vacante_codigo}</span>}
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.4 }}>{c.vacante_titulo}</div>
              {c.vacante_area && <div style={{ fontSize: 12.5, color: t.textMuted }}>{c.vacante_area}</div>}
              <button onClick={() => navigate(`/vacantes/${c.vacante}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '7px 12px', borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 12.5, cursor: 'pointer', width: 'fit-content' }}>
                <i className="ti ti-external-link" style={{ fontSize: 13 }} /> Ver vacante
              </button>
            </div>
          </div>

          {/* Score final */}
          {c.score_final != null && (
            <div style={{ ...card, padding: '20px 22px' }}>
              {secTitle('ti-trophy', 'Score final')}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 60, fontWeight: 800, color: scoreColor(c.score_final, 20), lineHeight: 1 }}>{c.score_final}</div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>sobre 20 puntos</div>
                {c.posicion_ranking != null && <div style={{ marginTop: 8, fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>🏆 Posición #{c.posicion_ranking}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${t.divider}`, paddingTop: 14 }}>
                {[['CV (25%)', c.score_cv, 100], ['Examen (40%)', c.score_examen, 20], ['Entrevista (35%)', c.score_entrevista, 20]].map(([label, value, max]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: t.textMuted }}>{label}</span>
                    <span style={{ fontWeight: 600, color: value != null ? scoreColor(value, max) : t.textFaint }}>
                      {value != null ? `${value}/${max}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <TagsCard candidatoId={id} initialTags={c.tags || []} t={t} />

          {/* Auditoría */}
          <div style={{ ...card, padding: '20px 22px' }}>
            {secTitle('ti-calendar', 'Auditoría')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoField label="Fecha de postulación" value={c.fecha_postulacion ? new Date(c.fecha_postulacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) : null} t={t} />
              <InfoField label="Registrado por"       value={c.registrado_por_nombre || c.registrado_por} t={t} />
              <InfoField label="Aprobado por"         value={c.aprobado_por}       t={t} />
              <InfoField label="Nota de aprobación"   value={c.nota_aprobacion}    t={t} />
              <InfoField label="Observaciones RRHH"   value={c.observaciones_rrhh} t={t} />
            </div>
          </div>

          {/* Notas internas */}
          <NotasCard candidatoId={id} t={t} />
        </div>
      </div>

      {/* Acciones de talento: banco + descarte (Sprint 4) */}
      <AccionesTalento candidato={c} t={t} />

      {/* Entrevista con EVA — vista 360° (Sprint 4) */}
      <EntrevistaPanel candidatoId={id} t={t} />
    </div>
  );
}