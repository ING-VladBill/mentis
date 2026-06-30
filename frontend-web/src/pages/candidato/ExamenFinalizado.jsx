import { useNavigate } from 'react-router-dom';

export default function ExamenFinalizado() {
  const navigate = useNavigate();
  const raw  = localStorage.getItem('candidato_data');
  const info = raw ? JSON.parse(raw) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{pageCSS}</style>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(17,24,39,0.07)' }}>

        {/* Ícono de éxito — scale(0.5)→1 con ease-spring, 400ms */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'checkSpring 400ms cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <i className="ti ti-circle-check" style={{ fontSize: 36, color: '#10b981' }} />
        </div>

        {/* Texto — 200ms después del ícono */}
        <div style={{ animation: 'fadeSlideUp 280ms cubic-bezier(0.23,1,0.32,1) 200ms both' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            ¡Examen enviado!
          </h1>

          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: '0 0 12px' }}>
            Gracias por completar el examen técnico
            {info?.vacante?.titulo ? <> para <strong style={{ color: '#374151' }}>{info.vacante.titulo}</strong></> : ''}.
          </p>

          <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, margin: '0 0 32px' }}>
            Nuestro equipo revisará tus respuestas. Si avanzas al siguiente paso del proceso,
            te contactaremos a través del correo que registraste.
          </p>

          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 18px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <i className="ti ti-info-circle" style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                Por política del proceso, no compartimos resultados individuales en esta etapa. Recibirás noticias solo si hay novedad.
              </div>
            </div>
          </div>
        </div>

        {/* Botón "Ver progreso" — 500ms delay, entra desde abajo */}
        <div style={{ animation: 'fadeSlideUp 280ms cubic-bezier(0.23,1,0.32,1) 500ms both' }}>
          <button
            onClick={() => navigate('/candidato/progreso')}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff',
              fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(124,58,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
              transition: 'transform 0.1s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s cubic-bezier(0.23,1,0.32,1)',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <i className="ti ti-timeline" style={{ fontSize: 17 }} /> Ver mi progreso en el proceso
          </button>

          <div style={{ fontSize: 12, color: '#d1d5db' }}>MENTIS · Reclutamiento con inteligencia artificial</div>
        </div>
      </div>
    </div>
  );
}

const pageCSS = `
@keyframes checkSpring {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
