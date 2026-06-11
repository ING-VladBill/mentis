import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import api from '../services/api';

// ─── F debe estar FUERA del componente principal ───────────────────────────────
function F({ label, required, hint, textMuted, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12.5, fontWeight: 500,
        color: textMuted, marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: '#7c3aed' }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: textMuted, opacity: 0.6, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

// ─── Estado inicial del formulario ────────────────────────────────────────────
const INITIAL = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  tipo_documento: 'dni',
  numero_documento: '',
  genero: 'prefiero_no_decir',
  email: '',
  telefono: '',
  ciudad: '',
  pais: 'Perú',
  nivel_educacion: 'universitario',
  institucion_educativa: '',
  carrera: '',
  años_experiencia: 0,
  linkedin_url: '',
  github_url: '',
  vacante: '',
  fuente: 'web_corporativa',
};

export default function CandidatoForm() {
  const { t } = useTheme();
  const navigate  = useNavigate();
  const cvRef     = useRef();
  const cartaRef  = useRef();

  const [form, setForm]       = useState(INITIAL);
  const [cvFile, setCv]       = useState(null);
  const [cartaFile, setCarta] = useState(null);
  const [vacantes, setVac]    = useState([]);
  const [saving, setSave]     = useState(false);
  const [success, setOk]      = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get('/vacantes/abiertas/')
      .then(r => setVac(r.data))
      .catch(() =>
        api.get('/vacantes/')
          .then(r => setVac(r.data.filter(v => v.estado === 'abierta')))
          .catch(() => {})
      );
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!cvFile) { setError('El CV es obligatorio.'); return; }
    setSave(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    fd.append('cv', cvFile);
    if (cartaFile) fd.append('carta_presentacion', cartaFile);

    try {
      await api.post('/candidatos/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOk(true);
    } catch (err) {
      const d = err.response?.data;
      setError(
        d
          ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
          : 'Error al registrar. Intenta de nuevo.'
      );
    } finally {
      setSave(false);
    }
  }

  // ─── Estilos derivados del tema ─────────────────────────────────────────────
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text,
    outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  const section = {
    background: t.card,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 12, padding: '22px 24px',
    marginBottom: 16,
    transition: 'background 0.25s',
  };

  const sTitle = {
    fontSize: 11, fontWeight: 600, color: t.textFaint,
    letterSpacing: '0.13em', textTransform: 'uppercase',
    marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
  };

  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  const g3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };

  // ─── Pantalla de éxito ───────────────────────────────────────────────────────
  if (success) return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', color: t.text }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <i className="ti ti-check" style={{ fontSize: 28, color: '#34d399' }} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Candidato registrado</div>
      <div style={{ fontSize: 14, color: t.textMuted, marginBottom: 28 }}>
        La postulación fue enviada correctamente.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={() => { setOk(false); setForm(INITIAL); setCv(null); setCarta(null); }}
          style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}
        >
          Registrar otro
        </button>
        <button
          onClick={() => navigate('/candidatos')}
          style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Ver candidatos
        </button>
      </div>
    </div>
  );

  // ─── Formulario ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', color: t.text }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: t.textMuted }}>
        <button
          onClick={() => navigate('/candidatos')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Candidatos
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>Registrar candidato</span>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Vacante ── */}
        <div style={section}>
          <div style={sTitle}>
            <i className="ti ti-briefcase" style={{ fontSize: 14 }} /> Vacante a postular
          </div>
          <div style={g2}>
            <F label="Postulando a" required textMuted={t.textMuted}>
              <select name="vacante" value={form.vacante} onChange={handleChange} required style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Selecciona una vacante —</option>
                {vacantes.map(v => (
                  <option key={v.id} value={v.id}>[{v.codigo}] {v.titulo} — {v.ciudad}</option>
                ))}
              </select>
              {vacantes.length === 0 && (
                <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} />
                  No hay vacantes abiertas. Crea una primero.
                </div>
              )}
            </F>
            <F label="¿Cómo se enteró?" textMuted={t.textMuted}>
              <select name="fuente" value={form.fuente} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="web_corporativa">Web Corporativa</option>
                <option value="linkedin">LinkedIn</option>
                <option value="computrabajo">Computrabajo</option>
                <option value="bumeran">Bumeran</option>
                <option value="referido">Referido</option>
                <option value="otro">Otro</option>
              </select>
            </F>
          </div>
        </div>

        {/* ── Datos personales ── */}
        <div style={section}>
          <div style={sTitle}>
            <i className="ti ti-user" style={{ fontSize: 14 }} /> Datos personales
          </div>
          <div style={g3}>
            <F label="Nombre" required textMuted={t.textMuted}>
              <input name="nombre" value={form.nombre} onChange={handleChange} required style={inp} placeholder="Juan" />
            </F>
            <F label="Apellido paterno" required textMuted={t.textMuted}>
              <input name="apellido_paterno" value={form.apellido_paterno} onChange={handleChange} required style={inp} placeholder="García" />
            </F>
            <F label="Apellido materno" textMuted={t.textMuted}>
              <input name="apellido_materno" value={form.apellido_materno} onChange={handleChange} style={inp} placeholder="López" />
            </F>
            <F label="Tipo de documento" textMuted={t.textMuted}>
              <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="dni">DNI</option>
                <option value="ce">Carné de Extranjería</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </F>
            <F label="N° de documento" required textMuted={t.textMuted}>
              <input name="numero_documento" value={form.numero_documento} onChange={handleChange} required style={inp} placeholder="12345678" />
            </F>
            <F label="Género" textMuted={t.textMuted}>
              <select name="genero" value={form.genero} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </F>
          </div>
        </div>

        {/* ── Contacto ── */}
        <div style={section}>
          <div style={sTitle}>
            <i className="ti ti-address-book" style={{ fontSize: 14 }} /> Contacto y ubicación
          </div>
          <div style={g2}>
            <F label="Email" required textMuted={t.textMuted}>
              <input name="email" value={form.email} onChange={handleChange} type="email" required style={inp} placeholder="juan@email.com" />
            </F>
            <F label="Teléfono" required textMuted={t.textMuted}>
              <input name="telefono" value={form.telefono} onChange={handleChange} required style={inp} placeholder="+51 999 999 999" />
            </F>
            <F label="Ciudad" required textMuted={t.textMuted}>
              <input name="ciudad" value={form.ciudad} onChange={handleChange} required style={inp} placeholder="Lima" />
            </F>
            <F label="País" textMuted={t.textMuted}>
              <input name="pais" value={form.pais} onChange={handleChange} style={inp} />
            </F>
          </div>
        </div>

        {/* ── Educación ── */}
        <div style={section}>
          <div style={sTitle}>
            <i className="ti ti-school" style={{ fontSize: 14 }} /> Educación y experiencia
          </div>
          <div style={g2}>
            <F label="Nivel de educación" textMuted={t.textMuted}>
              <select name="nivel_educacion" value={form.nivel_educacion} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="secundaria">Secundaria</option>
                <option value="tecnico">Técnico</option>
                <option value="universitario">Universitario</option>
                <option value="bachiller">Bachiller</option>
                <option value="maestria">Maestría</option>
                <option value="doctorado">Doctorado</option>
              </select>
            </F>
            <F label="Años de experiencia" textMuted={t.textMuted}>
              <input name="años_experiencia" value={form.años_experiencia} onChange={handleChange} type="number" min={0} style={inp} />
            </F>
            <F label="Institución educativa" textMuted={t.textMuted}>
              <input name="institucion_educativa" value={form.institucion_educativa} onChange={handleChange} style={inp} placeholder="TECSUP, PUCP, UPC..." />
            </F>
            <F label="Carrera" textMuted={t.textMuted}>
              <input name="carrera" value={form.carrera} onChange={handleChange} style={inp} placeholder="Ingeniería de Software" />
            </F>
            <F label="LinkedIn" textMuted={t.textMuted}>
              <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} type="url" style={inp} placeholder="https://linkedin.com/in/usuario" />
            </F>
            <F label="GitHub" textMuted={t.textMuted}>
              <input name="github_url" value={form.github_url} onChange={handleChange} type="url" style={inp} placeholder="https://github.com/usuario" />
            </F>
          </div>
        </div>

        {/* ── Documentos ── */}
        <div style={section}>
          <div style={sTitle}>
            <i className="ti ti-file-upload" style={{ fontSize: 14 }} /> Documentos
          </div>
          <div style={g2}>

            {/* CV */}
            <F label="CV (PDF)" required textMuted={t.textMuted}>
              <div
                onClick={() => cvRef.current?.click()}
                style={{
                  border: `2px dashed ${cvFile ? 'rgba(124,58,237,0.5)' : t.inputBorder}`,
                  borderRadius: 10, padding: '22px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: cvFile ? 'rgba(124,58,237,0.05)' : t.inputBg,
                }}
              >
                <input
                  ref={cvRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => setCv(e.target.files[0] || null)}
                />
                <i className="ti ti-file-type-pdf" style={{ fontSize: 28, color: cvFile ? '#a78bfa' : t.textFaint, display: 'block', marginBottom: 8 }} />
                {cvFile ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#a78bfa' }}>{cvFile.name}</div>
                    <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3 }}>{(cvFile.size / 1024).toFixed(1)} KB — clic para cambiar</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: t.textMuted }}>Clic para adjuntar CV</div>
                    <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3 }}>Solo PDF</div>
                  </>
                )}
              </div>
            </F>

            {/* Carta */}
            <F label="Carta de presentación (opcional)" textMuted={t.textMuted}>
              <div
                onClick={() => cartaRef.current?.click()}
                style={{
                  border: `2px dashed ${cartaFile ? t.inputBorder : t.cardBorder}`,
                  borderRadius: 10, padding: '22px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: t.inputBg,
                }}
              >
                <input
                  ref={cartaRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => setCarta(e.target.files[0] || null)}
                />
                <i className="ti ti-file-text" style={{ fontSize: 28, color: t.textFaint, display: 'block', marginBottom: 8 }} />
                {cartaFile ? (
                  <div style={{ fontSize: 13, color: t.textMuted }}>{cartaFile.name}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: t.textFaint }}>Carta de presentación</div>
                    <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3 }}>Opcional — PDF</div>
                  </>
                )}
              </div>
            </F>

          </div>
        </div>

        {/* ── Acciones ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
          <button
            type="button"
            onClick={() => navigate('/candidatos')}
            style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 24px', borderRadius: 9, border: 'none',
              background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', fontSize: 13.5, fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: saving ? 'none' : '0 0 20px rgba(124,58,237,0.3)',
            }}
          >
            {saving && (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            )}
            {saving ? 'Registrando...' : 'Registrar candidato'}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </form>
    </div>
  );
}