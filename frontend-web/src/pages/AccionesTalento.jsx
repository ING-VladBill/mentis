// ==========================================
// frontend-web/src/pages/AccionesTalento.jsx
// Franja de acciones de talento para el detalle del candidato:
//  · Estrella: agregar/quitar del banco de talento
//  · Descartar: con modal de motivo obligatorio
// Se inserta en CandidatoDetalle: <AccionesTalento candidato={c} t={t} />
// ==========================================

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AccionesTalento({ candidato, t }) {
  const [enBanco, setEnBanco] = useState(Boolean(candidato?.en_banco_talento));
  const [cargandoBanco, setCargandoBanco] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [descartando, setDescartando] = useState(false);

  const yaDescartado = candidato?.estado === 'descartado';

  async function toggleBanco() {
    setCargandoBanco(true);
    try {
      const { data } = await api.post(`/api/candidatos/${candidato.id}/banco-talento/`);
      setEnBanco(data.en_banco_talento);
      toast.success(data.mensaje || 'Actualizado.');
    } catch {
      toast.error('No se pudo actualizar el banco de talento.');
    } finally { setCargandoBanco(false); }
  }

  async function confirmarDescarte() {
    if (!motivo.trim()) { toast.error('Escribe el motivo del descarte.'); return; }
    setDescartando(true);
    try {
      await api.post(`/api/candidatos/${candidato.id}/descartar/`, { motivo: motivo.trim() });
      toast.success('Candidato descartado.');
      setModalAbierto(false);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo descartar.');
      setDescartando(false);
    }
  }

  const btn = {
    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'transform 0.12s ease',
  };

  return (
    <>
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 20,
        padding: '14px 18px', borderRadius: 14, background: t.card,
        border: `1px solid ${t.cardBorder}`, animation: 'fadeInUp 0.35s ease both',
      }}>
        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes modalFade { from { opacity: 0; } to { opacity: 1; } } @keyframes modalPop { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginRight: 'auto' }}>
          <i className="ti ti-star" style={{ marginRight: 6, color: '#f59e0b' }} />
          Acciones de talento
        </div>

        <button onClick={toggleBanco} disabled={cargandoBanco}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          style={{
            ...btn,
            border: enBanco ? '1px solid rgba(245,158,11,0.45)' : `1px solid ${t.cardBorder}`,
            background: enBanco ? 'rgba(245,158,11,0.14)' : t.toggleBg,
            color: enBanco ? '#f59e0b' : t.textMuted,
          }}>
          <i className={cargandoBanco ? 'ti ti-loader-2' : (enBanco ? 'ti ti-star' : 'ti ti-star')}
             style={cargandoBanco ? { animation: 'spin 1s linear infinite' } : {}} />
          {enBanco ? 'En el banco de talento' : 'Guardar en banco de talento'}
        </button>

        {!yaDescartado && (
          <button onClick={() => setModalAbierto(true)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            style={{ ...btn, border: '1px solid rgba(239,68,68,0.35)', background: 'transparent', color: '#ef4444' }}>
            <i className="ti ti-user-x" /> Descartar candidato
          </button>
        )}
        {yaDescartado && (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ef4444', padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.10)' }}>
            <i className="ti ti-user-x" style={{ marginRight: 5 }} />Descartado
            {candidato.motivo_descarte ? ` — ${candidato.motivo_descarte}` : ''}
          </span>
        )}
      </div>

      {/* Modal de descarte */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,20,0.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'modalFade 0.2s ease both' }}
          onClick={(e) => { if (e.target === e.currentTarget && !descartando) setModalAbierto(false); }}>
          <div style={{ width: 440, maxWidth: '90vw', background: t.card, borderRadius: 16, border: `1px solid ${t.cardBorder}`, padding: '24px 26px', boxShadow: '0 24px 70px rgba(0,0,0,0.55)', animation: 'modalPop 0.22s cubic-bezier(0.34,1.4,0.5,1) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-user-x" style={{ fontSize: 18, color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Descartar candidato</div>
            </div>
            <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, margin: '8px 0 14px' }}>
              Vas a descartar a <strong style={{ color: t.text }}>{candidato.nombre_completo}</strong> del proceso.
              El motivo quedará registrado en la auditoría y es obligatorio.
            </p>
            <textarea autoFocus value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo del descarte (ej. no cumple requisitos de experiencia, no se presentó a la entrevista...)"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setModalAbierto(false)} disabled={descartando}
                style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={confirmarDescarte} disabled={descartando || !motivo.trim()}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: motivo.trim() ? 'pointer' : 'not-allowed', opacity: motivo.trim() ? 1 : 0.5, fontFamily: 'inherit' }}>
                {descartando ? 'Descartando…' : 'Confirmar descarte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
