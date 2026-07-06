import { useEffect } from 'react';
import { useTheme } from '../App';

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
// Reemplaza todos los confirm() y alert() nativos del navegador.
//
// Uso:
//   const [confirm, setConfirm] = useState(null);
//
//   setConfirm({
//     tipo: 'danger' | 'warning' | 'info' | 'success',
//     icono: '🗑',
//     titulo: 'Eliminar área',
//     mensaje: '¿Estás seguro? Esta acción no se puede deshacer.',
//     labelOk: 'Eliminar',
//     labelCancel: 'Cancelar', // opcional, por defecto "Cancelar"
//     onConfirm: () => { /* acción */ },
//   });
//
//   {confirm && <ConfirmModal {...confirm} onClose={() => setConfirm(null)} />}

const TIPO_CFG = {
  danger: {
    iconBg:  'rgba(239,68,68,0.12)',
    iconBorder: 'rgba(239,68,68,0.25)',
    btnBg:   'rgba(239,68,68,0.15)',
    btnText: '#f87171',
    btnBorder: 'rgba(239,68,68,0.3)',
  },
  warning: {
    iconBg:  'rgba(251,191,36,0.12)',
    iconBorder: 'rgba(251,191,36,0.25)',
    btnBg:   'rgba(251,191,36,0.15)',
    btnText: '#fbbf24',
    btnBorder: 'rgba(251,191,36,0.3)',
  },
  info: {
    iconBg:  'rgba(96,165,250,0.12)',
    iconBorder: 'rgba(96,165,250,0.25)',
    btnBg:   'linear-gradient(135deg,#7c3aed,#4f46e5)',
    btnText: '#fff',
    btnBorder: 'none',
  },
  success: {
    iconBg:  'rgba(52,211,153,0.12)',
    iconBorder: 'rgba(52,211,153,0.25)',
    btnBg:   'rgba(52,211,153,0.15)',
    btnText: '#34d399',
    btnBorder: 'rgba(52,211,153,0.3)',
  },
};

export default function ConfirmModal({
  tipo       = 'danger',
  icono      = '⚠️',
  titulo,
  mensaje,
  labelOk    = 'Confirmar',
  labelCancel = 'Cancelar',
  onConfirm,
  onClose,
  loading    = false,
}) {
  const { t } = useTheme();
  const cfg = TIPO_CFG[tipo] || TIPO_CFG.danger;

  // Cerrar con Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to   { transform: rotate(360deg) } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.card,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 16,
          padding: '32px 28px',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Ícono */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: cfg.iconBg,
          border: `1px solid ${cfg.iconBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          fontSize: 24,
        }}>
          {icono}
        </div>

        {/* Título */}
        <div style={{
          fontSize: 17, fontWeight: 700, color: t.text,
          textAlign: 'center', marginBottom: 10,
        }}>
          {titulo}
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            fontSize: 13.5, color: t.textMuted,
            textAlign: 'center', lineHeight: 1.6,
            marginBottom: 26,
          }}>
            {mensaje}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 9,
              border: `1px solid ${t.cardBorder}`,
              background: t.toggleBg,
              color: t.textMuted,
              fontSize: 13.5, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = t.inputBg; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = t.toggleBg; }}
          >
            {labelCancel}
          </button>

          <button
            onClick={() => { if (!loading) onConfirm(); }}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 9,
              border: cfg.btnBorder !== 'none' ? cfg.btnBorder : 'none',
              background: cfg.btnBg,
              color: cfg.btnText,
              fontSize: 13.5, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && (
              <span style={{
                width: 13, height: 13,
                border: `2px solid ${cfg.btnText === '#fff' ? 'rgba(255,255,255,0.3)' : `${cfg.btnText}40`}`,
                borderTopColor: cfg.btnText,
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
                flexShrink: 0,
              }} />
            )}
            {loading ? 'Procesando...' : labelOk}
          </button>
        </div>
      </div>
    </div>
  );
}