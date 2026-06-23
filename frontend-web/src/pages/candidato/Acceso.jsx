import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSpring } from '../../services/api';

export default function AccesoCandidato() {
  const navigate = useNavigate();
  const [token, setToken]   = useState('');
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);

  // Si viene el token como query param (?token=xxx) lo precarga
  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get('token');
  if (tokenParam && !token) setToken(tokenParam);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoad(true);
    try {
      const { data } = await apiSpring.post('/api/usuario/auth/acceso', { token: token.trim() });
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

  const s = styles;

  return (
    <div style={s.page}>
      <style>{pageCSS}</style>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoBox}><i className="ti ti-brain" style={{ fontSize: 22, color: '#fff' }} /></div>
          <span style={s.logoText}>MENTIS</span>
        </div>

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
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
              onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            <div style={s.hint}>Lo encontrarás en el correo que te envió el equipo de RRHH.</div>
          </div>

          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.75 : 1, cursor: loading ? 'wait' : 'pointer' }}>
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

const pageCSS = `@keyframes spin{to{transform:rotate(360deg)}}`;

const styles = {
  page: { minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '38px 34px', maxWidth: 420, width: '100%', boxShadow: '0 4px 24px rgba(17,24,39,0.06)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoBox:  { width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontWeight: 700, fontSize: 17, color: '#111827', letterSpacing: '0.06em' },
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' },
  sub:   { fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, color: '#111827', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s' },
  hint:  { fontSize: 12, color: '#9ca3af', marginTop: 5 },
  btn:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 14.5, fontWeight: 700, transition: 'all 0.15s', boxShadow: '0 6px 20px rgba(124,58,237,0.25)' },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 14px', marginBottom: 18, color: '#dc2626', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' },
  spinner:  { width: 14, height: 14, display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
};