import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADO_CFG = {
  borrador:   { color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.15)', label: 'Borrador'              },
  abierta:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)',   label: 'Abierta'               },
  en_proceso: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)',   label: 'En proceso'            },
  pausada:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)',   label: 'Pausada'               },
  cerrada:    { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)',  label: 'Cerrada'               },
  cancelada:  { color: '#6b7280', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.12)', label: 'Cancelada'             },
};

const PRIORIDAD_COLOR = { urgente: '#f87171', alta: '#fbbf24', media: '#9ca3af', baja: '#6b7280' };

const TABS_PUBLICACION = [
  { key: 'linkedin',     label: 'LinkedIn',     icon: 'ti-brand-linkedin', color: '#0a66c2' },
  { key: 'computrabajo', label: 'Computrabajo', icon: 'ti-building',       color: '#e05c1e' },
  { key: 'whatsapp',     label: 'WhatsApp',     icon: 'ti-brand-whatsapp', color: '#25d366' },
  { key: 'indeed',       label: 'Indeed',       icon: 'ti-briefcase',      color: '#003a9b' },
];

// ─── Componentes auxiliares (FUERA del componente principal) ──────────────────

function InfoRow({ label, value, t }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: t.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, color: t.text }}>{value}</div>
    </div>
  );
}

function SectionTitle({ icon, label, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${t.cardBorder}` }}>
      <i className={`ti ${icon}`} style={{ fontSize: 16, color: '#7c3aed' }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{label}</span>
    </div>
  );
}

// ─── Modal de publicación ─────────────────────────────────────────────────────
function ModalPublicacion({ vacanteId, titulo, t, onClose }) {
  const [tab, setTab]       = useState('linkedin');
  const [textos, setTextos] = useState(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/api/vacantes/${vacanteId}/textos-publicacion/`)
      .then(r => setTextos(r.data))
      .catch(err => setError(err.response?.data?.error || 'Error al generar los textos.'))
      .finally(() => setLoad(false));
  }, [vacanteId]);

  async function copiar() {
    const texto = textos?.[tab];
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      toast.success('Copiado al portapapeles.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar. Selecciona el texto manualmente.');
    }
  }

  const tabCfg = TABS_PUBLICACION.find(t => t.key === tab);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${t.cardBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Textos de publicación</div>
              <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{titulo}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textFaint, fontSize: 20, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = t.text}
              onMouseLeave={e => e.currentTarget.style.color = t.textFaint}>
              <i className="ti ti-x" />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS_PUBLICACION.map(({ key, label, icon, color }) => (
              <button key={key} onClick={() => { setTab(key); setCopied(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: tab === key ? 600 : 400,
                background: tab === key ? t.inputBg : 'transparent',
                color: tab === key ? color : t.textMuted,
                borderBottom: tab === key ? `2px solid ${color}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                <i className={`ti ${icon}`} style={{ fontSize: 15 }} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 14 }}>
              <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13.5, color: t.textMuted }}>Generando textos con IA...</div>
            </div>
          ) : error ? (
            <div style={{ padding: 24 }}>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 16px', color: '#f87171', fontSize: 13 }}>
                <i className="ti ti-alert-circle" style={{ marginRight: 8 }} />{error}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
              <div style={{
                background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                borderRadius: 10, padding: '16px', fontSize: 13.5, color: t.text,
                lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                minHeight: 200, fontFamily: 'inherit',
              }}>
                {textos?.[tab] || 'Sin contenido para esta plataforma.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer con botón copiar */}
        {!loading && !error && textos && (
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: t.textFaint, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className={`ti ${tabCfg?.icon}`} style={{ fontSize: 14, color: tabCfg?.color }} />
              Listo para publicar en {tabCfg?.label}
            </div>
            <button onClick={copiar} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 9, border: 'none',
              background: copied ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: copied ? '#34d399' : '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} style={{ fontSize: 15 }} />
              {copied ? '¡Copiado!' : 'Copiar texto'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VacanteDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { t }    = useTheme();

  const [vacante, setVacante]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showPublicar, setPublicar]   = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/vacantes/${id}/`)
      .then(r => setVacante(r.data))
      .catch(() => toast.error('No se pudo cargar la vacante.'))
      .finally(() => setLoading(false));
  }, [id]);

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );

  if (!vacante) return (
    <div style={{ ...card, padding: 48, textAlign: 'center', color: t.textMuted }}>
      <i className="ti ti-briefcase-off" style={{ fontSize: 36, marginBottom: 10, display: 'block' }} />
      Vacante no encontrada
    </div>
  );

  const v   = vacante;
  const est = ESTADO_CFG[v.estado] || ESTADO_CFG.borrador;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Modal publicación */}
      {showPublicar && <ModalPublicacion vacanteId={id} titulo={v.titulo} t={t} onClose={() => setPublicar(false)} />}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: t.textMuted }}>
        <button onClick={() => navigate('/vacantes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Vacantes
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>{v.titulo}</span>
      </div>

      {/* ── Header ── */}
      <div style={{ ...card, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          {/* Ícono del área */}
          <div style={{
            width: 60, height: 60, borderRadius: 14, flexShrink: 0,
            background: v.area_color ? `${v.area_color}20` : 'rgba(124,58,237,0.12)',
            border: `1.5px solid ${v.area_color ? `${v.area_color}40` : 'rgba(124,58,237,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`ti ti-${v.area_detalle?.icono || v.area_icono || 'briefcase'}`} style={{ fontSize: 26, color: v.area_color || '#7c3aed' }} />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: t.textFaint, background: t.toggleBg, padding: '3px 9px', borderRadius: 5 }}>{v.codigo}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: est.bg, color: est.color, border: `1px solid ${est.border}` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{est.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 500, color: PRIORIDAD_COLOR[v.prioridad] || t.textMuted }}>
                {v.prioridad}
              </span>
              {v.confidencial && <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}><i className="ti ti-eye-off" style={{ fontSize: 12 }} />Confidencial</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: t.text, margin: '0 0 8px' }}>{v.titulo}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: t.textMuted }}>
              {v.area_nombre  && <span><i className="ti ti-layout-grid" style={{ marginRight: 5 }} />{v.area_nombre}</span>}
              {v.ciudad       && <span><i className="ti ti-map-pin"     style={{ marginRight: 5 }} />{v.ciudad}{v.pais ? `, ${v.pais}` : ''}</span>}
              {v.modalidad    && <span><i className="ti ti-home"        style={{ marginRight: 5 }} />{v.modalidad}</span>}
              {v.fecha_limite && <span><i className="ti ti-calendar"    style={{ marginRight: 5 }} />Cierra: {new Date(v.fecha_limite).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <button onClick={() => setPublicar(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', fontSize: 13.5, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 0 18px rgba(124,58,237,0.3)',
            }}>
              <i className="ti ti-share" style={{ fontSize: 16 }} /> Generar publicación
            </button>
            <button onClick={() => navigate(`/vacantes/${id}/editar`)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 9,
              border: `1px solid ${t.cardBorder}`, background: t.toggleBg,
              color: t.textMuted, fontSize: 13.5, cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = t.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}>
              <i className="ti ti-edit" style={{ fontSize: 15 }} /> Editar
            </button>
          </div>
        </div>

        {/* Stats rápidas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${t.cardBorder}` }}>
          {[
            { label: 'Candidatos',  value: v.total_candidatos ?? 0,          icon: 'ti-users',        color: '#7c3aed' },
            { label: 'Posiciones',  value: `${v.posiciones_cubiertas ?? 0} / ${v.cantidad_posiciones ?? 1}`, icon: 'ti-layout-grid', color: '#10b981' },
            { label: 'Activos',     value: v.candidatos_activos ?? 0,         icon: 'ti-user-check',   color: '#f59e0b' },
            { label: 'Exp. mínima', value: `${v.anios_experiencia ?? 0} años`, icon: 'ti-calendar',    color: '#60a5fa' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: t.inputBg, borderRadius: 9, border: `1px solid ${t.inputBorder}` }}>
              <i className={`ti ${icon}`} style={{ fontSize: 18, color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.text, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contenido en 2 columnas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Descripción */}
          <div style={{ ...card, padding: '22px 24px' }}>
            <SectionTitle icon="ti-file-text" label="Descripción del puesto" t={t} />
            <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{v.descripcion}</div>

            {v.responsabilidades && (
              <>
                <div style={{ marginTop: 20, marginBottom: 12, fontSize: 13, fontWeight: 600, color: t.text }}>Responsabilidades</div>
                <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{v.responsabilidades}</div>
              </>
            )}
          </div>

          {/* Requisitos */}
          <div style={{ ...card, padding: '22px 24px' }}>
            <SectionTitle icon="ti-checklist" label="Requisitos" t={t} />
            <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: v.requisitos_deseables ? 20 : 0 }}>{v.requisitos}</div>

            {v.requisitos_deseables && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 12 }}>Requisitos deseables</div>
                <div style={{ fontSize: 13.5, color: t.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{v.requisitos_deseables}</div>
              </>
            )}
          </div>

          {/* Habilidades y tecnologías */}
          {(v.habilidades || v.tecnologias) && (
            <div style={{ ...card, padding: '22px 24px' }}>
              <SectionTitle icon="ti-tools" label="Habilidades y tecnologías" t={t} />
              {v.habilidades && (
                <>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10, fontWeight: 500 }}>Habilidades requeridas</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: v.tecnologias ? 16 : 0 }}>
                    {v.habilidades.split(',').map((h, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                        {h.trim()}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {v.tecnologias && (
                <>
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10, fontWeight: 500 }}>Tecnologías</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {v.tecnologias.split(',').map((h, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 500, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                        {h.trim()}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Beneficios */}
          {v.beneficios && (
            <div style={{ ...card, padding: '22px 24px' }}>
              <SectionTitle icon="ti-gift" label="Beneficios" t={t} />
              <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{v.beneficios}</div>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Condiciones */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <SectionTitle icon="ti-building" label="Condiciones" t={t} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Nivel"           value={v.nivel_display || v.nivel_experiencia}  t={t} />
              <InfoRow label="Tipo de contrato" value={v.tipo_contrato}                         t={t} />
              <InfoRow label="Modalidad"        value={v.modalidad}                             t={t} />
              <InfoRow label="Horario"          value={v.horario}                               t={t} />
              <InfoRow label="Tipo de horario"  value={v.horario_tipo_display || v.horario_tipo} t={t} />
              <InfoRow label="Ubicación"        value={v.ubicacion}                             t={t} />
              {v.mostrar_salario && v.salario_minimo && (
                <InfoRow label="Salario" value={`${v.moneda} ${v.salario_minimo?.toLocaleString()} - ${v.salario_maximo?.toLocaleString()}`} t={t} />
              )}
            </div>
          </div>

          {/* Información organizacional */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <SectionTitle icon="ti-building-community" label="Organización" t={t} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Motivo"           value={v.motivo_display || v.motivo_vacante}    t={t} />
              {v.nombre_reemplazado && <InfoRow label="Reemplaza a" value={v.nombre_reemplazado} t={t} />}
              <InfoRow label="Jefe directo"     value={v.jefe_directo}                           t={t} />
              <InfoRow label="Solicitante"      value={v.solicitante}                            t={t} />
            </div>
          </div>

          {/* Configuración IA */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <SectionTitle icon="ti-robot" label="Configuración IA" t={t} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InfoRow label="Score mínimo CV"       value={`${v.score_cv_minimo} / 100`}        t={t} />
              <InfoRow label="Nota mínima examen"    value={`${v.nota_minima_examen} / 20`}       t={t} />
              <InfoRow label="Top finalistas"        value={`${v.top_candidatos_finalistas} candidatos`} t={t} />
            </div>
          </div>

          {/* Canales */}
          {v.canales && (
            <div style={{ ...card, padding: '20px 22px' }}>
              <SectionTitle icon="ti-antenna" label="Canales activos" t={t} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Carga manual',     v.canales.carga_manual],
                  ['Formulario público', v.canales.formulario_publico],
                  ['Buzón IMAP',       v.canales.buzon_imap],
                  ['Indeed',           v.canales.indeed],
                  ['Google Jobs',      v.canales.google_jobs],
                ].map(([label, activo]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: t.textMuted }}>{label}</span>
                    <span style={{ color: activo ? '#34d399' : t.textFaint, fontSize: 12 }}>
                      {activo ? '✓ Activo' : '— Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ver candidatos */}
          <button onClick={() => navigate(`/candidatos?vacante_id=${id}`)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px', borderRadius: 10,
            border: `1px solid ${t.cardBorder}`, background: t.toggleBg,
            color: t.text, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = t.inputBg; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = t.toggleBg; e.currentTarget.style.borderColor = t.cardBorder; }}>
            <i className="ti ti-users" style={{ fontSize: 16, color: '#7c3aed' }} />
            Ver candidatos de esta vacante
          </button>
        </div>
      </div>
    </div>
  );
}