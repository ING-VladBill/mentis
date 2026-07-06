import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiSpring } from '../../services/api';

export default function AccesoCandidato() {
  const navigate = useNavigate();
  const [token, setToken]   = useState('');
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);
  const [btnHover, setBtnHover] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get('token');
  if (tokenParam && !token) setToken(tokenParam);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoad(true);
    const tokenLimpio = token.trim();

    // 1) ¿Es un token de ENTREVISTA? (lo valida Django). Si sí, la entrevista
    //    con EVA vive en su propia pantalla y no pasa por el flujo del examen.
    try {
      await api.post('/api/evaluaciones/entrevista/acceso/', { token: tokenLimpio });
      navigate(`/candidato/entrevista?token=${encodeURIComponent(tokenLimpio)}`);
      return;
    } catch (err) {
      // 404 = no es token de entrevista -> seguimos con el flujo del examen.
      // Otros errores (500, red) tampoco bloquean: dejamos que el flujo del
      // examen dé su propio veredicto sobre el token.
    }

    // 2) Flujo del EXAMEN (Spring Boot), igual que siempre.
    try {
      const { data } = await apiSpring.post('/api/usuario/auth/acceso', { token: tokenLimpio });
      localStorage.setItem('candidato_token', data.access);
      localStorage.setItem('candidato_data', JSON.stringify({
        candidato: data.candidato,
        vacante:   data.vacante,
        expira_en: data.expira_en,
      }));
      navigate('/candidato/instrucciones');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 404) {
        setError('El enlace no es válido o ya expiró. Revisa el correo que recibiste.');
      } else {
        setError('No se pudo verificar el acceso. Intenta nuevamente.');
      }
    } finally { setLoad(false); }
  }

  return (
    <div style={s.page}>
      <style>{pageCSS}</style>

      {/* Logo — entra 80ms antes que el card */}
      <div style={{ ...s.logoWrapFloating, animation: 'fadeSlideUp 320ms cubic-bezier(0.23,1,0.32,1) both' }}>
        <div style={s.logoBox}><i className="ti ti-brain" style={{ fontSize: 22, color: '#fff' }} /></div>
        <span style={s.logoText}>MENTIS</span>
      </div>

      <div style={{ ...s.card, animation: 'fadeSlideUp 320ms cubic-bezier(0.23,1,0.32,1) 80ms both' }}>
        <h1 style={s.title}>Acceso al examen</h1>
        <p style={s.sub}>Ingresa el código de acceso que recibiste en tu correo, o usa el enlace directo que te enviamos.</p>

        {error && (
          <div style={s.errorBox}>
            <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={s.label}>Código de acceso</label>
            <input
              value={token} onChange={e => setToken(e.target.value)}
              required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style={s.input}
              onFocus={e => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={s.hint}>Lo encontrarás en el correo que te envió el equipo de RRHH.</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...s.btn,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: btnHover && !loading ? '0 10px 28px rgba(124,58,237,0.35)' : '0 6px 20px rgba(124,58,237,0.25)',
              transform: btnHover && !loading ? 'translateY(-1px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = btnHover ? 'translateY(-1px)' : 'translateY(0)'; }}
          >
            {loading
              ? <><span style={s.spinner} /> Verificando...</>
              : <>Ingresar al examen <i className="ti ti-arrow-right" style={{ fontSize: 16 }} /></>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

const pageCSS = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const s = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: "'Inter', system-ui, sans-serif",
    gap: 20,
  },
  logoWrapFloating: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoBox: {
    width: 38, height: 38, borderRadius: 10,
    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: 700, fontSize: 17, color: '#111827', letterSpacing: '0.06em' },
  card: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
    padding: '38px 34px', maxWidth: 420, width: '100%',
    boxShadow: '0 4px 24px rgba(17,24,39,0.06)',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' },
  sub:   { fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%', boxSizing: 'border-box', background: '#f9fafb',
    border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px',
    fontSize: 13.5, color: '#111827', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  hint:  { fontSize: 12, color: '#9ca3af', marginTop: 5 },
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 0', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff',
    fontSize: 14.5, fontWeight: 700,
    transition: 'transform 0.1s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s cubic-bezier(0.23,1,0.32,1)',
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    padding: '11px 14px', marginBottom: 18, color: '#dc2626',
    fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start',
  },
  spinner: {
    width: 14, height: 14, display: 'inline-block',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
};
