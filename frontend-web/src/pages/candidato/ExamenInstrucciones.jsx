import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSpring } from '../../services/api';

export default function ExamenInstrucciones() {
  const navigate = useNavigate();
  const [iniciando, setIniciando] = useState(false);
  const [error, setError]         = useState(null);
  const [acepta, setAcepta]       = useState(false);

  const raw = localStorage.getItem('candidato_data');
  const info = raw ? JSON.parse(raw) : null;

  // Si no hay token, redirige al acceso
  useEffect(() => {
    if (!localStorage.getItem('candidato_token')) navigate('/candidato/acceso');
  }, []);

  async function iniciar() {
    setError(null);
    setIniciando(true);
    try {
      const { data } = await apiSpring.post('/api/usuario/examen/iniciar');
      // Guardamos el examen en localStorage para retomar si recarga
      localStorage.setItem('examen_data', JSON.stringify(data));
      navigate('/candidato/examen');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // Ya tiene un examen en curso — retomar
        navigate('/candidato/examen');
      } else {
        setError('No se pudo iniciar el examen. Intenta nuevamente o contacta a RRHH.');
      }
    } finally { setIniciando(false); }
  }

  const s = styles;

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={s.header}>
        <div style={s.logoBox}><i className="ti ti-brain" style={{ fontSize: 18, color: '#fff' }} /></div>
        <span style={s.logoText}>MENTIS</span>
      </header>

      <div style={s.container}>
        {/* Saludo */}
        <div style={s.card}>
          <div style={s.greeting}>
            <i className="ti ti-user-check" style={{ fontSize: 28, color: '#7c3aed' }} />
            <div>
              <div style={s.greetingName}>Hola, {info?.candidato?.nombre || 'candidato'}</div>
              <div style={s.greetingVacante}>Examen para: <strong>{info?.vacante?.titulo}</strong></div>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div style={s.card}>
          <div style={s.sectionTitle}><i className="ti ti-info-circle" style={{ fontSize: 16, color: '#7c3aed' }} /> Instrucciones del examen</div>

          <div style={s.grid}>
            {[
              { icon: 'ti-clock',         color: '#7c3aed', title: '45 minutos',           desc: 'El examen tiene una duración máxima de 45 minutos. El tiempo corre desde que haces clic en "Iniciar".' },
              { icon: 'ti-list-numbers',  color: '#0891b2', title: '10 preguntas',          desc: 'Encontrarás preguntas de opción múltiple y respuesta abierta sobre los conocimientos de la vacante.' },
              { icon: 'ti-device-floppy', color: '#059669', title: 'Guardado automático',   desc: 'Cada respuesta se guarda al instante. Si pierdes conexión o recargas la página, puedes continuar donde lo dejaste.' },
              { icon: 'ti-eye-off',       color: '#dc2626', title: 'Política de silencio',  desc: 'No verás tu nota al finalizar. El equipo de RRHH te contactará si avanzas en el proceso.' },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} style={s.instruccionItem}>
                <div style={{ ...s.instruccionIcon, background: `${color}15`, border: `1px solid ${color}30` }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 22, color }} />
                </div>
                <div>
                  <div style={s.instruccionTitle}>{title}</div>
                  <div style={s.instruccionDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advertencias */}
        <div style={s.warningCard}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={s.warningTitle}>Consideraciones importantes</div>
            <ul style={s.warningList}>
              <li>El sistema detecta si cambias de pestaña o ventana durante el examen.</li>
              <li>No uses el clic derecho ni intentes copiar/pegar dentro del examen.</li>
              <li>Asegúrate de tener conexión estable antes de iniciar.</li>
              <li>Una vez iniciado, el temporizador no se detiene.</li>
            </ul>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Confirmación + botón */}
        <div style={s.card}>
          <label style={s.aceptaLabel}>
            <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} style={{ width: 17, height: 17, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0, marginTop: 1 }} />
            <span>He leído las instrucciones y entiendo las condiciones del examen. Estoy listo para comenzar.</span>
          </label>

          <button onClick={iniciar} disabled={!acepta || iniciando} style={{
            ...s.btn,
            marginTop: 16,
            opacity: (!acepta || iniciando) ? 0.5 : 1,
            cursor: (!acepta || iniciando) ? 'not-allowed' : 'pointer',
          }}>
            {iniciando
              ? <><span style={s.spinner} /> Generando examen con IA...</>
              : <>Iniciar examen <i className="ti ti-arrow-right" style={{ fontSize: 17 }} /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 48 },
  header:    { borderBottom: '1px solid #e5e7eb', background: '#fff', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 10 },
  logoBox:   { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText:  { fontWeight: 700, fontSize: 15, color: '#111827', letterSpacing: '0.06em' },
  container: { maxWidth: 740, margin: '32px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 18 },
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px' },
  greeting:  { display: 'flex', alignItems: 'center', gap: 16 },
  greetingName: { fontSize: 19, fontWeight: 700, color: '#111827' },
  greetingVacante: { fontSize: 13.5, color: '#6b7280', marginTop: 3 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  instruccionItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  instruccionIcon: { width: 44, height: 44, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  instruccionTitle: { fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 4 },
  instruccionDesc:  { fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 },
  warningCard: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' },
  warningTitle: { fontSize: 13.5, fontWeight: 700, color: '#92400e', marginBottom: 6 },
  warningList:  { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13, display: 'flex', gap: 8 },
  aceptaLabel: { display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151', lineHeight: 1.6 },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: '0 6px 20px rgba(124,58,237,0.25)' },
  spinner: { width: 14, height: 14, display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
};