import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

// ─── Constantes ───────────────────────────────────────────────────────────────
const SEMAFORO_CFG = {
  verde:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',   icon: 'ti-circle-check',   label: 'Sin riesgo',   desc: 'El examen se realizó sin comportamientos sospechosos.'        },
  amarillo: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',   icon: 'ti-alert-triangle', label: 'Riesgo medio', desc: 'Se detectaron algunas conductas a revisar durante el examen.' },
  rojo:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)',  icon: 'ti-alert-circle',   label: 'Riesgo alto',  desc: 'Se detectaron múltiples conductas sospechosas.'               },
};

const SEVERIDAD_CFG = {
  baja:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', label: 'Baja'  },
  media: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Media' },
  alta:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Alta'  },
};

const TIPO_EVENTO_LABEL = {
  perdida_foco:     'Pérdida de foco',
  cambio_ventana:   'Cambio de ventana',
  copy_paste:       'Copiar / Pegar',
  click_derecho:    'Click derecho',
  devtools:         'Abrió DevTools',
  inactividad:      'Inactividad prolongada',
  pantalla_dividida:'Pantalla dividida',
  otro:             'Otro',
};

// ─── Componentes auxiliares (FUERA del componente principal) ──────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

function PreguntaCard({ pregunta, index, t }) {
  const [expanded, setExpanded] = useState(false);
  const esCorrecta = pregunta.es_correcta;
  const borderColor = esCorrecta === true ? 'rgba(52,211,153,0.3)' : esCorrecta === false ? 'rgba(248,113,113,0.3)' : t.cardBorder;

  return (
    <div style={{
      background: t.card, border: `1px solid ${borderColor}`,
      borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
    }}>
      {/* Header de la pregunta */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        {/* Número */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: esCorrecta === true ? 'rgba(52,211,153,0.15)' : esCorrecta === false ? 'rgba(248,113,113,0.15)' : t.toggleBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700,
          color: esCorrecta === true ? '#34d399' : esCorrecta === false ? '#f87171' : t.textMuted,
        }}>
          {index}
        </div>

        {/* Enunciado truncado */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
            {pregunta.enunciado}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: t.textFaint }}>{pregunta.categoria}</span>
            <span style={{ fontSize: 11.5, color: t.textFaint }}>·</span>
            <span style={{ fontSize: 11.5, color: t.textFaint }}>{pregunta.tipo === 'multiple' ? 'Opción múltiple' : 'Respuesta abierta'}</span>
            <span style={{ fontSize: 11.5, color: t.textFaint }}>·</span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: esCorrecta === true ? '#34d399' : esCorrecta === false ? '#f87171' : t.textFaint }}>
              {pregunta.puntos_obtenidos != null ? `${pregunta.puntos_obtenidos}/${pregunta.puntos} pts` : `${pregunta.puntos} pts`}
            </span>
          </div>
        </div>

        {/* Resultado + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {esCorrecta === true  && <i className="ti ti-circle-check" style={{ fontSize: 18, color: '#34d399' }} />}
          {esCorrecta === false && <i className="ti ti-circle-x"     style={{ fontSize: 18, color: '#f87171' }} />}
          <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 15, color: t.textFaint }} />
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${t.divider}` }}>
          <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Opciones (múltiple) */}
            {pregunta.tipo === 'multiple' && pregunta.opciones_lista?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Opciones</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pregunta.opciones_lista.map((op, i) => {
                    const esRespuestaCorrecta = op === pregunta.respuesta_correcta;
                    const esRespuestaCandidato = op === pregunta.respuesta_candidato;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8,
                        background: esRespuestaCorrecta
                          ? 'rgba(52,211,153,0.08)'
                          : esRespuestaCandidato && !esRespuestaCorrecta
                          ? 'rgba(248,113,113,0.08)'
                          : t.inputBg,
                        border: `1px solid ${
                          esRespuestaCorrecta ? 'rgba(52,211,153,0.25)'
                          : esRespuestaCandidato && !esRespuestaCorrecta ? 'rgba(248,113,113,0.25)'
                          : t.inputBorder
                        }`,
                      }}>
                        <span style={{ fontSize: 12.5, color: t.text, flex: 1 }}>{op}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {esRespuestaCorrecta && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '1px 7px', borderRadius: 4 }}>Correcta</span>
                          )}
                          {esRespuestaCandidato && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: esRespuestaCorrecta ? '#34d399' : '#f87171', background: esRespuestaCorrecta ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', padding: '1px 7px', borderRadius: 4 }}>Candidato</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Respuesta abierta */}
            {pregunta.tipo === 'abierta' && (
              <div>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500 }}>Respuesta del candidato</div>
                <div style={{ padding: '12px 14px', borderRadius: 9, background: t.inputBg, border: `1px solid ${t.inputBorder}`, fontSize: 13.5, color: t.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {pregunta.respuesta_candidato || <span style={{ color: t.textFaint, fontStyle: 'italic' }}>Sin respuesta</span>}
                </div>
              </div>
            )}

            {/* Feedback IA */}
            {pregunta.feedback_ia && (
              <div>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-robot" style={{ fontSize: 13 }} /> Feedback de la IA
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 9, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', fontSize: 13, color: t.text, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {pregunta.feedback_ia}
                </div>
              </div>
            )}

            {/* Respondida en */}
            {pregunta.respondida_en && (
              <div style={{ fontSize: 11.5, color: t.textFaint }}>
                Respondida: {new Date(pregunta.respondida_en).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Semáforo de auditoría ────────────────────────────────────────────────────
function PanelAuditoria({ auditoria, t }) {
  if (!auditoria) return null;
  const cfg = SEMAFORO_CFG[auditoria.semaforo] || SEMAFORO_CFG.verde;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Semáforo principal */}
      <div style={{ padding: '18px 20px', borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: `${cfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${cfg.icon}`} style={{ fontSize: 24, color: cfg.color }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3 }}>{auditoria.veredicto || cfg.desc}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{auditoria.puntaje_riesgo ?? 0}</div>
          <div style={{ fontSize: 11, color: t.textFaint }}>puntaje riesgo</div>
        </div>
      </div>

      {/* Resumen por severidad */}
      {auditoria.por_severidad && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {Object.entries(auditoria.por_severidad).map(([sev, count]) => {
            const scfg = SEVERIDAD_CFG[sev] || SEVERIDAD_CFG.baja;
            return (
              <div key={sev} style={{ padding: '12px 14px', borderRadius: 10, background: scfg.bg, border: `1px solid ${scfg.color}30`, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: scfg.color }}>{count}</div>
                <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 3 }}>Severidad {scfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resumen por tipo */}
      {auditoria.por_tipo && Object.keys(auditoria.por_tipo).length > 0 && (
        <div style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, overflow: 'hidden' }}>
          {Object.entries(auditoria.por_tipo).map(([tipo, count], i, arr) => (
            <div key={tipo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${t.divider}` : 'none' }}>
              <span style={{ fontSize: 13, color: t.text }}>{TIPO_EVENTO_LABEL[tipo] || tipo}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: count > 0 ? '#fbbf24' : t.textFaint }}>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de eventos */}
      {auditoria.eventos?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: t.textFaint, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Eventos detectados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {auditoria.eventos.map(ev => {
              const scfg = SEVERIDAD_CFG[ev.severidad] || SEVERIDAD_CFG.baja;
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', borderRadius: 9, background: t.card, border: `1px solid ${t.cardBorder}` }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: scfg.color, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{ev.tipo_display || TIPO_EVENTO_LABEL[ev.tipo] || ev.tipo}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: scfg.color, background: scfg.bg, padding: '1px 7px', borderRadius: 4 }}>{scfg.label}</span>
                    </div>
                    {ev.detalle && <div style={{ fontSize: 12.5, color: t.textMuted }}>{ev.detalle}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: t.textFaint, flexShrink: 0 }}>
                    {new Date(ev.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ExamenDetalle() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { t }    = useTheme();

  const [tab, setTab] = useState('preguntas'); // 'preguntas' | 'auditoria'

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.evaluaciones.detail(id),
    queryFn: async () => {
      const [resEx, resAud] = await Promise.all([
        api.get(`/api/evaluaciones/examenes/${id}/`),
        api.get(`/api/evaluaciones/examenes/${id}/auditoria/`),
      ]);
      return { examen: resEx.data, auditoria: resAud.data };
    },
  });
  const examen    = data?.examen ?? null;
  const auditoria = data?.auditoria ?? null;

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 };

  if (loading) return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Spinner />
    </>
  );

  if (!examen) return (
    <div style={{ ...card, padding: 48, textAlign: 'center', color: t.textMuted }}>
      <i className="ti ti-clipboard-off" style={{ fontSize: 36, marginBottom: 10, display: 'block' }} />
      Examen no encontrado
    </div>
  );

  const ex = examen;
  const notaFloat = ex.nota ? parseFloat(ex.nota) : null;
  const notaMinima = ex.nota_minima ? parseFloat(ex.nota_minima) : 13;
  const aprobado = ex.aprobado;
  const semaforoCfg = auditoria ? (SEMAFORO_CFG[auditoria.semaforo] || SEMAFORO_CFG.verde) : null;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: t.textMuted }}>
        <button onClick={() => navigate('/evaluaciones')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Evaluaciones
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>{ex.candidato_nombre}</span>
      </div>

      {/* ── Header ── */}
      <div style={{ ...card, padding: '22px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 700, color: t.text, marginBottom: 6 }}>{ex.candidato_nombre}</div>
            <div style={{ fontSize: 13.5, color: t.textMuted, marginBottom: 12 }}>{ex.vacante_titulo}</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: t.textMuted }}>
              {ex.fecha_inicio && <span><i className="ti ti-calendar" style={{ marginRight: 5 }} />Inicio: {new Date(ex.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              {ex.fecha_fin    && <span><i className="ti ti-calendar-check" style={{ marginRight: 5 }} />Fin: {new Date(ex.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              {ex.duracion_minutos && <span><i className="ti ti-clock" style={{ marginRight: 5 }} />{ex.duracion_minutos} min</span>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Nota */}
            <div style={{ textAlign: 'center', padding: '14px 20px', borderRadius: 12, background: notaFloat != null ? (aprobado ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)') : t.inputBg, border: `1px solid ${notaFloat != null ? (aprobado ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)') : t.inputBorder}` }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: notaFloat != null ? (aprobado ? '#34d399' : '#f87171') : t.textFaint, lineHeight: 1 }}>
                {notaFloat != null ? notaFloat.toFixed(1) : '—'}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>de {notaMinima}/20 mínimo</div>
              {notaFloat != null && (
                <div style={{ fontSize: 12, fontWeight: 700, color: aprobado ? '#34d399' : '#f87171', marginTop: 6 }}>
                  {aprobado ? '✓ Aprobado' : '✗ Desaprobado'}
                </div>
              )}
            </div>

            {/* Preguntas */}
            <div style={{ textAlign: 'center', padding: '14px 20px', borderRadius: 12, background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: t.text, lineHeight: 1 }}>
                {ex.total_correctas ?? '—'}<span style={{ fontSize: 16, color: t.textFaint }}>/{ex.total_preguntas ?? '—'}</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>correctas</div>
            </div>

            {/* Semáforo */}
            {semaforoCfg && (
              <div style={{ textAlign: 'center', padding: '14px 20px', borderRadius: 12, background: semaforoCfg.bg, border: `1px solid ${semaforoCfg.border}` }}>
                <i className={`ti ${semaforoCfg.icon}`} style={{ fontSize: 30, color: semaforoCfg.color, display: 'block', marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: semaforoCfg.color }}>{semaforoCfg.label}</div>
              </div>
            )}
          </div>
        </div>

        {/* Link al candidato */}
        <button
          onClick={() => navigate(`/candidatos/${ex.candidato_id || ''}`)}
          style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 13, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = t.text}
          onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
        >
          <i className="ti ti-user" style={{ fontSize: 14 }} /> Ver ficha del candidato
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${t.cardBorder}`, paddingBottom: 0 }}>
        {[
          { key: 'preguntas', icon: 'ti-list-details', label: `Preguntas (${ex.total_preguntas ?? 0})` },
          { key: 'auditoria', icon: 'ti-shield-check',  label: `Auditoría${auditoria ? ` · ${auditoria.total_eventos} eventos` : ''}` },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 13.5, fontFamily: 'inherit',
            fontWeight: tab === key ? 600 : 400,
            color: tab === key ? '#7c3aed' : t.textMuted,
            borderBottom: tab === key ? '2px solid #7c3aed' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            <i className={`ti ${icon}`} style={{ fontSize: 15 }} /> {label}
          </button>
        ))}
      </div>

      {/* ── Contenido por tab ── */}
      {tab === 'preguntas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ex.preguntas?.length > 0
            ? ex.preguntas.map((p, i) => (
                <PreguntaCard key={p.id} pregunta={p} index={i + 1} t={t} />
              ))
            : (
              <div style={{ ...{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 }, padding: '40px 20px', textAlign: 'center', color: t.textMuted, fontSize: 13.5 }}>
                <i className="ti ti-clipboard-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
                No hay preguntas registradas para este examen.
              </div>
            )
          }
        </div>
      )}

      {tab === 'auditoria' && (
        <PanelAuditoria auditoria={auditoria} t={t} />
      )}
    </div>
  );
}