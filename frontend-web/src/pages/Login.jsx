import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState(null);
  const [loading, setLoad]  = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoad(true);

    try {
      const { data } = await api.post('/api/auth/login/', {
        email:    form.email,
        password: form.password,
      });

      // Guardar tokens y datos del usuario
      localStorage.setItem('access_token',  data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('usuario',       JSON.stringify(data.usuario));

      navigate('/vacantes');
    } catch (err) {
      const msg = err.response?.data?.mensaje
        || err.response?.data?.detail
        || 'Credenciales incorrectas. Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoad(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(140deg, #7c3aed 10%, #4f46e5 90%)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(124,58,237,0.4)',
          }}>
            <i className="ti ti-brain" style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.06em' }}>
            MENTIS
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            Sistema de Reclutamiento IA
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#1a1a24',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '32px 28px',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>
            Iniciar sesión
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
            Ingresa con tu cuenta de RRHH
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 9, padding: '10px 14px',
              marginBottom: 18,
              color: '#f87171', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="admin@mentis.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 14, color: '#f0f0f0',
                  outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 14, color: '#f0f0f0',
                  outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 9, border: 'none',
                background: loading
                  ? 'rgba(124,58,237,0.5)'
                  : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px rgba(124,58,237,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {loading && (
                <span style={{
                  width: 15, height: 15,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  display: 'inline-block',
                }} />
              )}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          MENTIS · Sprint 2 · Tecsup 2026
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}