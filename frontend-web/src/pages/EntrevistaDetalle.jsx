// ==========================================
// frontend-web/src/pages/EntrevistaDetalle.jsx
// Detalle completo de una entrevista con EVA (equivalente a ExamenDetalle).
// Muestra TODO: nota, radar de dimensiones, feedback, resumen de EVA,
// audio grabado, transcripción tipo chat, y capturas de auditoría con
// verificación IA de persona.
// Ruta: /entrevistas/:id
// ==========================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

const ESTADO_CFG = {
  finalizada: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', label: 'Finalizada' },
  en_curso:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', label: 'En curso' },
  expirada:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Expirada' },
  pendiente:  { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', label: 'Pendiente' },
};

// ─── Radar SVG sin dependencias ───────────────────────────────────────────────
function Radar({ dimensiones, t }) {
  const nombres = Object.keys(dimensiones || {});
  if (nombres.length < 3) return null;
  const size = 320, cx = size / 2, cy = size / 2, R = 104;
  const N = nombres.length;
  const ang = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const punto = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const notaDe = (n) => {
    const d = dimensiones[n];
    const v = typeof d === 'object' ? (d.nota ?? d.puntaje ?? 0) : Number(d) || 0;
    return Math.max(0, Math.min(20, v));
  };
  const poly = nombres.map((n, i) => punto(i, (notaDe(n) / 20) * R).join(',')).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={nombres.map((_, i) => punto(i, R * f).join(',')).join(' ')}
          fill="none" stroke={t.divider} strokeWidth="1" />
      ))}
      {nombres.map((_, i) => {
        const [x, y] = punto(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={t.divider} strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(124,58,237,0.22)" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />
      {nombres.map((n, i) => {
        const [x, y] = punto(i, (notaDe(n) / 20) * R);
        return <circle key={n} cx={x} cy={y} r="4.5" fill="#7c3aed" />;
      })}
      {nombres.map((n, i) => {
        const [x, y] = punto(i, R + 26);
        const corto = n.length > 16 ? n.slice(0, 15) + '…' : n;
        return (
          <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 11, fontWeight: 600, fill: t.textMuted }}>
            {corto} ({notaDe(n)})
          </text>
        );
      })}
    </svg>
  );
}

export default function EntrevistaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTheme();

  const [tab, setTab] = useState('analisis'); // analisis | transcripcion | auditoria

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.entrevistas.detail(id),
    queryFn: async () => {
      const { data: entrevista } = await api.get(`/api/evaluaciones/entrevistas/${id}/`);
      let capturas = [];
      try {
        const caps = await api.get(`/api/evaluaciones/entrevistas/${id}/capturas/`);
        capturas = caps.data || [];
      } catch { /* capturas opcionales */ }
      return { entrevista, capturas };
    },
  });
  const entrevista = data?.entrevista ?? null;
  const capturas   = data?.capturas ?? [];

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 14 };
  const notaColor = (v) => v == null ? t.textFaint : v >= 14 ? '#10b981' : v >= 11 ? '#f59e0b' : '#ef4444';

  if (loading) {
    return (
      <div style={{ ...card, padding: 60, textAlign: 'center', color: t.textMuted }}>
        <i className="ti ti-loader-2" style={{ fontSize: 24, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
        <div style={{ marginTop: 10 }}>Cargando entrevista…</div>
      </div>
    );
  }

  if (!entrevista) {
    return (
      <div style={{ ...card, padding: '56px 30px', textAlign: 'center' }}>
        <i className="ti ti-robot-off" style={{ fontSize: 40, color: t.textFaint }} />
        <div style={{ fontSize: 15.5, fontWeight: 600, color: t.text, marginTop: 12 }}>Entrevista no encontrada</div>
        <button onClick={() => navigate('/entrevistas')} style={{ marginTop: 16, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Volver a Entrevistas IA
        </button>
      </div>
    );
  }

  const dims = entrevista.analisis_dimensiones || {};
  const nombresDims = Object.keys(dims);
  const cfg = ESTADO_CFG[entrevista.estado] || ESTADO_CFG.pendiente;
  const lineas = (entrevista.transcripcion || '').split('\n').filter(Boolean);
  const capturasNoPersona = capturas.filter(c => c.es_persona === false).length;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
        <button onClick={() => navigate('/entrevistas')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Entrevistas IA
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13, color: t.textFaint }} />
        <span style={{ color: t.text, fontWeight: 600 }}>{entrevista.candidato_nombre}</span>
      </div>

      {/* Cabecera */}
      <div style={{ ...card, padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          
              {entrevista.foto_identidad ? (
                <img
                  src={entrevista.foto_identidad}
                  alt={entrevista.candidato_nombre}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 13,
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 13,
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className="ti ti-robot" style={{ fontSize: 26, color: '#fff' }} />
                </div>
              )}

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: t.text }}>{entrevista.candidato_nombre}</div>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>{entrevista.vacante_titulo}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', fontSize: 12, color: t.textMuted }}>
              {entrevista.fecha_inicio && <span><i className="ti ti-calendar" style={{ marginRight: 4 }} />{new Date(entrevista.fecha_inicio).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
              {entrevista.duracion_minutos != null && <span><i className="ti ti-clock" style={{ marginRight: 4 }} />{entrevista.duracion_minutos} min</span>}
              {entrevista.plantilla_nombre && <span><i className="ti ti-template" style={{ marginRight: 4 }} />{entrevista.plantilla_nombre}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 13px', borderRadius: 8, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            {entrevista.nota != null && (
              <div style={{ textAlign: 'center', padding: '8px 18px', borderRadius: 12, background: `${notaColor(entrevista.nota)}18`, border: `1px solid ${notaColor(entrevista.nota)}40` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: notaColor(entrevista.nota), lineHeight: 1 }}>{entrevista.nota}</div>
                <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 600, marginTop: 2 }}>sobre 20</div>
              </div>
            )}
            <button onClick={() => navigate(`/candidatos/${entrevista.candidato_id}`)}
              style={{ padding: '9px 16px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-user" style={{ fontSize: 15 }} /> Ver ficha
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${t.cardBorder}` }}>
        {[
          { id: 'analisis', icon: 'ti-chart-radar', label: 'Análisis' },
          { id: 'transcripcion', icon: 'ti-message-2', label: `Transcripción${lineas.length ? ` (${lineas.length})` : ''}` },
          { id: 'auditoria', icon: 'ti-shield-check', label: `Auditoría${capturas.length ? ` · ${capturas.length}` : ''}` },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === tb.id ? '#7c3aed' : 'transparent'}`, color: tab === tb.id ? '#7c3aed' : t.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
            <i className={`ti ${tb.icon}`} style={{ fontSize: 16 }} />
            {tb.label}
            {tb.id === 'auditoria' && capturasNoPersona > 0 && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Análisis ── */}
      {tab === 'analisis' && (
        <div style={{ animation: 'fadeInUp 0.3s ease both' }}>
          {nombresDims.length > 0 ? (
            <div style={{ ...card, padding: '22px 24px', marginBottom: 14, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '0 0 auto' }}><Radar dimensiones={dims} t={t} /></div>
              <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {nombresDims.map(nombre => {
                  const d = dims[nombre];
                  const nota = typeof d === 'object' ? (d.nota ?? d.puntaje ?? 0) : Number(d) || 0;
                  const feedback = typeof d === 'object' ? (d.feedback || d.comentario || '') : '';
                  return (
                    <div key={nombre}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, color: t.text }}>{nombre}</span>
                        <span style={{ fontWeight: 700, color: notaColor(nota) }}>{nota}/20</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: t.toggleBg, overflow: 'hidden' }}>
                        <div style={{ width: `${(nota / 20) * 100}%`, height: '100%', borderRadius: 4, background: notaColor(nota), transition: 'width 0.8s cubic-bezier(0.2,0.8,0.3,1)' }} />
                      </div>
                      {feedback && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 5, lineHeight: 1.55 }}>{feedback}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: '40px 24px', textAlign: 'center', color: t.textMuted, marginBottom: 14 }}>
              <i className="ti ti-chart-radar-off" style={{ fontSize: 32, color: t.textFaint }} />
              <div style={{ marginTop: 10, fontSize: 13.5 }}>El análisis dimensional aún no está disponible.</div>
            </div>
          )}

          {entrevista.resumen_ia && (
            <div style={{ ...card, padding: '18px 20px', marginBottom: 14, background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.18)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                <i className="ti ti-sparkles" style={{ marginRight: 6 }} />Resumen de EVA
              </div>
              <div style={{ fontSize: 13.5, color: t.text, lineHeight: 1.7 }}>{entrevista.resumen_ia}</div>
            </div>
          )}

          {entrevista.audio_url && (
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 10 }}>
                <i className="ti ti-headphones" style={{ marginRight: 6 }} />Grabación de la conversación (candidato + EVA)
              </div>
              <audio controls src={entrevista.audio_url} style={{ width: '100%', height: 40 }}
                onLoadedMetadata={(e) => {
                  // Los .webm grabados con MediaRecorder no incluyen la
                  // duración en el encabezado del contenedor -> el navegador
                  // la reporta como Infinity y la barra de progreso "salta"
                  // al final al reproducir. Este truco fuerza al navegador a
                  // recalcularla escaneando el archivo.
                  const audio = e.currentTarget;
                  if (!isFinite(audio.duration)) {
                    audio.currentTime = 1e101;
                    const fijarDuracion = () => {
                      audio.currentTime = 0;
                      audio.removeEventListener('timeupdate', fijarDuracion);
                    };
                    audio.addEventListener('timeupdate', fijarDuracion);
                  }
                }} />
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Transcripción ── */}
      {tab === 'transcripcion' && (
        <div style={{ ...card, padding: '20px 22px', animation: 'fadeInUp 0.3s ease both' }}>
          {lineas.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textMuted, padding: 30 }}>
              <i className="ti ti-message-off" style={{ fontSize: 30, color: t.textFaint }} />
              <div style={{ marginTop: 10, fontSize: 13.5 }}>Sin transcripción disponible.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 560, overflowY: 'auto', padding: '2px 4px' }}>
              {lineas.map((linea, i) => {
                const esEva = linea.startsWith('EVA:');
                const texto = linea.replace(/^(EVA|Candidato):\s*/, '');
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: esEva ? 'flex-start' : 'flex-end' }}>
                    <div style={{ maxWidth: '76%', padding: '10px 14px', borderRadius: 13, fontSize: 13, lineHeight: 1.6, background: esEva ? 'rgba(124,58,237,0.09)' : t.toggleBg, color: t.text, borderTopLeftRadius: esEva ? 4 : 13, borderTopRightRadius: esEva ? 13 : 4 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: esEva ? '#7c3aed' : t.textMuted, marginBottom: 3 }}>{esEva ? 'EVA' : 'Candidato'}</div>
                      {texto}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Auditoría ── */}
      {tab === 'auditoria' && (
        <div style={{ ...card, padding: '20px 22px', animation: 'fadeInUp 0.3s ease both' }}>
          {capturasNoPersona > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 16 }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#ef4444' }} />
              <div style={{ fontSize: 13, color: t.text }}>
                <strong style={{ color: '#ef4444' }}>{capturasNoPersona} captura{capturasNoPersona > 1 ? 's' : ''}</strong> sin una persona claramente visible. Revisar posible anomalía de identidad.
              </div>
            </div>
          )}
          {/* Eventos del navegador durante la entrevista */}
          {(entrevista.eventos_navegador && entrevista.eventos_navegador.length > 0) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 10 }}>
                <i className="ti ti-eye-exclamation" style={{ marginRight: 6 }} />Actividad del navegador ({entrevista.eventos_navegador.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entrevista.eventos_navegador.map((ev, i) => {
                  const ICONO = {
                    copiar: 'ti-copy', pegar: 'ti-clipboard', clic_derecho: 'ti-click',
                    cambio_ventana: 'ti-window-off', cambio_pestana: 'ti-browser-x',
                  }[ev.tipo] || 'ti-alert-circle';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 9, background: t.toggleBg, fontSize: 12.5 }}>
                      <i className={`ti ${ICONO}`} style={{ fontSize: 16, color: '#f59e0b' }} />
                      <span style={{ color: t.text, flex: 1 }}>{ev.detalle || ev.tipo}</span>
                      {ev.timestamp && <span style={{ color: t.textFaint, fontSize: 11 }}>{new Date(ev.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12 }}>
            Verificación IA por captura: <span style={{ color: '#10b981' }}>●</span> persona detectada
            {' '}<span style={{ color: '#ef4444' }}>●</span> sin persona
            {' '}<span style={{ color: t.textFaint }}>●</span> sin validar
          </div>
          {capturas.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textMuted, padding: 30 }}>
              <i className="ti ti-camera-off" style={{ fontSize: 30, color: t.textFaint }} />
              <div style={{ marginTop: 10, fontSize: 13.5 }}>Sin capturas de auditoría.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {capturas.map(cap => (
                <a key={cap.id} href={cap.url} target="_blank" rel="noreferrer"
                  style={{ position: 'relative', borderRadius: 11, overflow: 'hidden', border: `2px solid ${cap.es_persona === false ? '#ef4444' : cap.es_persona === true ? 'rgba(16,185,129,0.5)' : t.cardBorder}`, display: 'block' }}>
                  {cap.url && <img src={cap.url} alt={cap.tipo} style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 11, height: 11, borderRadius: '50%', background: cap.es_persona === false ? '#ef4444' : cap.es_persona === true ? '#10b981' : '#9ca3af', border: '2px solid #fff' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '3px 7px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{cap.tipo === 'identidad_inicial' ? 'Identidad' : 'Periódica'}</span>
                    {cap.timestamp && <span style={{ opacity: 0.8 }}>{new Date(cap.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
