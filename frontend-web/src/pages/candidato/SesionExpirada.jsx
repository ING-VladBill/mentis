import { useNavigate } from 'react-router-dom';

export default function SesionExpirada() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: '44px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(17,24,39,0.06)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 22px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-clock-off" style={{ fontSize: 30, color: '#ef4444' }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Sesión expirada</h1>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: '0 0 28px' }}>
          Tu enlace de acceso ya no es válido o expiró. Contacta al equipo de RRHH para recibir un nuevo enlace.
        </p>
        <button onClick={() => navigate('/candidato/acceso')} style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Ingresar con otro código
        </button>
      </div>
    </div>
  );
}