// ==========================================
// frontend-web/src/pages/EntrevistaPanel.jsx
// Vista 360° de la entrevista con EVA, para el detalle del candidato:
// radar de dimensiones, feedback por dimensión, resumen de EVA,
// audio completo, transcripción y capturas de auditoría con
// verificación IA de persona (semáforo).
// Se inserta en CandidatoDetalle: <EntrevistaPanel candidatoId={id} t={t} />
// ==========================================

import { useState, useEffect } from 'react';
import api from '../services/api';

// ---------- Radar SVG (sin dependencias) ----------
function Radar({ dimensiones, t }) {
  const nombres = Object.keys(dimensiones || {});
  if (nombres.length < 3) return null;
  const size = 300, cx = size / 2, cy = size / 2, R = 96;
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
        return <circle key={n} cx={x} cy={y} r="4" fill="#7c3aed" />;
      })}
      {nombres.map((n, i) => {
        const [x, y] = punto(i, R + 24);
        const corto = n.length > 16 ? n.slice(0, 15) + '…' : n;
        return (
          <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 10.5, fontWeight: 600, fill: t.textMuted }}>
            {corto} ({notaDe(n)})
          </text>
        );
      })}
    </svg>
  );
}

export default function EntrevistaPanel({ candidatoId, t }) {
  const [entrevista, setEntrevista] = useState(null);
  const [capturas, setCapturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verTranscripcion, setVerTranscripcion] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const { data } = await api.get(`/api/evaluaciones/entrevistas/?candidato_id=${candidatoId}`);
        const lista = data.results || data || [];
        const ent = lista[0] || null;
        if (!activo) return;
        setEntrevista(ent);
        if (ent?.id) {
          try {
            const caps = await api.get(`/api/evaluaciones/entrevistas/${ent.id}/capturas/`);
            if (activo) setCapturas(caps.data || []);
          } catch { /* capturas opcionales */ }
        }
      } catch { /* sin entrevista aún */ }
      if (activo) setLoading(false);
    })();
    return () => { activo = false; };
  }, [candidatoId]);

  if (loading || !entrevista || entrevista.estado !== 'finalizada') return null;

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14 };
  const dims = entrevista.analisis_dimensiones || {};
  const nombresDims = Object.keys(dims);
  const notaColor = (v) => v >= 14 ? '#10b981' : v >= 11 ? '#f59e0b' : '#ef4444';
  const lineasTranscripcion = (entrevista.transcripcion || '').split('\n').filter(Boolean);

  return (
    <div style={{ ...card, padding: '22px 24px', marginTop: 20, animation: 'fadeInUp 0.4s ease both' }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-robot" style={{ fontSize: 17, color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: t.text }}>Entrevista con EVA</div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            {entrevista.duracion_minutos} min · {entrevista.plantilla_nombre || 'Plantilla general'}
            {entrevista.fecha_fin && <> · {new Date(entrevista.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })}</>}
          </div>
        </div>
        {entrevista.nota != null && (
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: notaColor(entrevista.nota), lineHeight: 1 }}>{entrevista.nota}</div>
            <div style={{ fontSize: 10.5, color: t.textFaint, fontWeight: 600 }}>sobre 20</div>
          </div>
        )}
      </div>

      {/* Radar + dimensiones */}
      {nombresDims.length > 0 && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
          <div style={{ flex: '0 0 auto' }}><Radar dimensiones={dims} t={t} /></div>
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nombresDims.map(nombre => {
              const d = dims[nombre];
              const nota = typeof d === 'object' ? (d.nota ?? d.puntaje ?? 0) : Number(d) || 0;
              const feedback = typeof d === 'object' ? (d.feedback || d.comentario || '') : '';
              return (
                <div key={nombre}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: t.text }}>{nombre}</span>
                    <span style={{ fontWeight: 700, color: notaColor(nota) }}>{nota}/20</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: t.toggleBg, overflow: 'hidden' }}>
                    <div style={{ width: `${(nota / 20) * 100}%`, height: '100%', borderRadius: 4, background: notaColor(nota), transition: 'width 0.8s cubic-bezier(0.2,0.8,0.3,1)' }} />
                  </div>
                  {feedback && <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 4, lineHeight: 1.5 }}>{feedback}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen de EVA */}
      {entrevista.resumen_ia && (
        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 11, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.16)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>
            <i className="ti ti-sparkles" style={{ marginRight: 5 }} />Resumen de EVA
          </div>
          <div style={{ fontSize: 13, color: t.text, lineHeight: 1.65 }}>{entrevista.resumen_ia}</div>
        </div>
      )}

      {/* Audio */}
      {entrevista.audio_url && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 7 }}>
            <i className="ti ti-headphones" style={{ marginRight: 5 }} />Audio completo de la conversación
          </div>
          <audio controls src={entrevista.audio_url} style={{ width: '100%', height: 38 }} />
        </div>
      )}

      {/* Transcripción colapsable */}
      {lineasTranscripcion.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setVerTranscripcion(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, fontSize: 12.5, fontWeight: 600, padding: 0 }}>
            <i className={`ti ti-chevron-${verTranscripcion ? 'down' : 'right'}`} style={{ fontSize: 14 }} />
            Transcripción completa ({lineasTranscripcion.length} intervenciones)
          </button>
          {verTranscripcion && (
            <div style={{ marginTop: 10, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 2px' }}>
              {lineasTranscripcion.map((linea, i) => {
                const esEva = linea.startsWith('EVA:');
                const texto = linea.replace(/^(EVA|Candidato):\s*/, '');
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: esEva ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '78%', padding: '8px 13px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55,
                      background: esEva ? 'rgba(124,58,237,0.09)' : t.toggleBg,
                      color: t.text,
                      borderTopLeftRadius: esEva ? 4 : 12, borderTopRightRadius: esEva ? 12 : 4,
                    }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: esEva ? '#7c3aed' : t.textMuted, marginBottom: 2 }}>
                        {esEva ? 'EVA' : 'Candidato'}
                      </div>
                      {texto}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Capturas de auditoría con verificación IA */}
      {capturas.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, marginBottom: 8 }}>
            <i className="ti ti-camera" style={{ marginRight: 5 }} />Capturas de auditoría
            <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
              verificación IA: <span style={{ color: '#10b981' }}>●</span> persona
              {' '}<span style={{ color: '#ef4444' }}>●</span> sin persona
              {' '}<span style={{ color: t.textFaint }}>●</span> sin validar
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {capturas.map(cap => (
              <a key={cap.id} href={cap.url} target="_blank" rel="noreferrer"
                style={{ position: 'relative', width: 108, borderRadius: 10, overflow: 'hidden', border: `2px solid ${cap.es_persona === false ? '#ef4444' : cap.es_persona === true ? 'rgba(16,185,129,0.5)' : t.cardBorder}` }}>
                {cap.url && <img src={cap.url} alt={cap.tipo} style={{ width: '100%', display: 'block' }} />}
                <div style={{ position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: '50%', background: cap.es_persona === false ? '#ef4444' : cap.es_persona === true ? '#10b981' : '#9ca3af', border: '1.5px solid #fff' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9.5, padding: '2px 6px', fontWeight: 600 }}>
                  {cap.tipo === 'identidad_inicial' ? 'Identidad' : 'Periódica'}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
