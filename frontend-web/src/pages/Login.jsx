import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const [form, setForm]    = useState({ email: '', password: '' });
  const [error, setError]  = useState(null);
  const [loading, setLoad] = useState(false);

  const bg         = dark ? '#0f0f14'                : '#f4f4f8';
  const cardBg     = dark ? '#1a1a24'                : '#ffffff';
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain   = dark ? '#f0f0f0'                : '#111118';
  const textSub    = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';
  const inputBg    = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const inputBdr   = dark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)';
  const footerClr  = dark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.25)';

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
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 24,
      transition: 'background 0.3s',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo — es el botón de cambio de tema */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <button
            onClick={toggle}
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              width: 56, height: 56,
              background: 'linear-gradient(140deg, #7c3aed 10%, #4f46e5 90%)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 26,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.4)';
            }}
          >
            {/* Sol cuando oscuro (click → claro), Luna cuando claro (click → oscuro) */}
            {dark ? '☀️' : '🌙'}
          </button>

          <div style={{ fontSize: 26, fontWeight: 700, color: textMain, letterSpacing: '0.06em', transition: 'color 0.3s' }}>
            MENTIS
          </div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 4, transition: 'color 0.3s' }}>
            Sistema de Reclutamiento IA
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: '32px 28px',
          transition: 'background 0.3s, border-color 0.3s',
          boxShadow: dark ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: textMain, marginBottom: 4, transition: 'color 0.3s' }}>
            Iniciar sesión
          </div>
          <div style={{ fontSize: 13, color: textSub, marginBottom: 24, transition: 'color 0.3s' }}>
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
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: labelColor, marginBottom: 6, transition: 'color 0.3s' }}>
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
                  background: inputBg,
                  border: `1px solid ${inputBdr}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 14, color: textMain,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'background 0.3s, border-color 0.2s, color 0.3s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                onBlur={e  => e.target.style.borderColor = inputBdr}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: labelColor, marginBottom: 6, transition: 'color 0.3s' }}>
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
                  background: inputBg,
                  border: `1px solid ${inputBdr}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 14, color: textMain,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'background 0.3s, border-color 0.2s, color 0.3s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                onBlur={e  => e.target.style.borderColor = inputBdr}
              />
            </div>

            {/* Botón ingresar */}
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
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: footerClr, transition: 'color 0.3s' }}>
          MENTIS · Sprint 2 · Tecsup 2026
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}