import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const INITIAL = {
  nombre: '', apellido_paterno: '', apellido_materno: '',
  tipo_documento: 'dni', numero_documento: '',
  genero: 'prefiero_no_decir',
  email: '', telefono: '',
  ciudad: '', pais: 'Perú',
  nivel_educacion: 'universitario',
  institucion_educativa: '', carrera: '',
  años_experiencia: 0,
  linkedin_url: '', github_url: '',
  vacante: '', fuente: 'web_corporativa',
};

const S = {
  section: {
    background: '#1a1a24',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '22px 24px',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 18,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  label: { display: 'block', fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: '#f0f0f0',
    outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
};

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={S.label}>{label} {required && <span style={{ color: '#7c3aed' }}>*</span>}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function FInput({ name, value, onChange, type='text', placeholder, required }) {
  const [f, setF] = useState(false);
  return <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} required={required} style={{ ...S.input, borderColor: f ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)' }} onFocus={() => setF(true)} onBlur={() => setF(false)} />;
}

function FSelect({ name, value, onChange, required, children }) {
  const [f, setF] = useState(false);
  return <select name={name} value={value} onChange={onChange} required={required} style={{ ...S.input, cursor: 'pointer', borderColor: f ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)' }} onFocus={() => setF(true)} onBlur={() => setF(false)}>{children}</select>;
}

export default function CandidatoForm() {
  const navigate   = useNavigate();
  const cvRef      = useRef();
  const cartaRef   = useRef();
  const [form, setForm]         = useState(INITIAL);
  const [cvFile, setCv]         = useState(null);
  const [cartaFile, setCarta]   = useState(null);
  const [vacantes, setVacantes] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    api.get('/vacantes/abiertas/')
      .then(r => setVacantes(r.data))
      .catch(() => api.get('/vacantes/').then(r => setVacantes(r.data.filter(v => v.estado === 'abierta'))).catch(() => {}));
  }, []);

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError(null);
    if (!cvFile) { setError('El CV es obligatorio.'); return; }
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    fd.append('cv', cvFile);
    if (cartaFile) fd.append('carta_presentacion', cartaFile);
    try {
      await api.post('/candidatos/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(true);
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error al registrar.');
    } finally { setSaving(false); }
  }

  if (success) return (
    <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <i className="ti ti-check" style={{ fontSize: 28, color: '#34d399' }} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>Candidato registrado</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 28 }}>La postulación fue enviada correctamente.</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => { setSuccess(false); setForm(INITIAL); setCv(null); setCarta(null); }} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: 13.5, cursor: 'pointer' }}>Registrar otro</button>
        <button onClick={() => navigate('/vacantes')} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Ver vacantes</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
        <button onClick={() => navigate('/vacantes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Vacantes
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>Registrar candidato</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <form onSubmit={submit}>

        {/* Vacante */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-briefcase" style={{ fontSize: 14 }} /> Vacante a postular</div>
          <div style={S.grid2}>
            <Field label="Postulando a" required>
              <FSelect name="vacante" value={form.vacante} onChange={set} required>
                <option value="">— Selecciona una vacante —</option>
                {vacantes.map(v => <option key={v.id} value={v.id}>[{v.codigo}] {v.titulo} — {v.ciudad}</option>)}
              </FSelect>
              {vacantes.length === 0 && <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 6, display: 'flex', gap: 5 }}><i className="ti ti-alert-triangle" style={{ fontSize: 13 }} />No hay vacantes abiertas aún.</div>}
            </Field>
            <Field label="¿Cómo se enteró?">
              <FSelect name="fuente" value={form.fuente} onChange={set}>
                <option value="web_corporativa">Web Corporativa</option>
                <option value="linkedin">LinkedIn</option>
                <option value="computrabajo">Computrabajo</option>
                <option value="bumeran">Bumeran</option>
                <option value="referido">Referido</option>
                <option value="otro">Otro</option>
              </FSelect>
            </Field>
          </div>
        </div>

        {/* Datos personales */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-user" style={{ fontSize: 14 }} /> Datos personales</div>
          <div style={S.grid3}>
            <Field label="Nombre" required><FInput name="nombre" value={form.nombre} onChange={set} required placeholder="Juan" /></Field>
            <Field label="Apellido paterno" required><FInput name="apellido_paterno" value={form.apellido_paterno} onChange={set} required placeholder="García" /></Field>
            <Field label="Apellido materno"><FInput name="apellido_materno" value={form.apellido_materno} onChange={set} placeholder="López" /></Field>
            <Field label="Tipo de documento">
              <FSelect name="tipo_documento" value={form.tipo_documento} onChange={set}>
                <option value="dni">DNI</option>
                <option value="ce">Carné de Extranjería</option>
                <option value="pasaporte">Pasaporte</option>
              </FSelect>
            </Field>
            <Field label="N° de documento" required><FInput name="numero_documento" value={form.numero_documento} onChange={set} required placeholder="12345678" /></Field>
            <Field label="Género">
              <FSelect name="genero" value={form.genero} onChange={set}>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </FSelect>
            </Field>
          </div>
        </div>

        {/* Contacto */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-address-book" style={{ fontSize: 14 }} /> Contacto y ubicación</div>
          <div style={S.grid2}>
            <Field label="Email" required><FInput name="email" value={form.email} onChange={set} type="email" required placeholder="juan@email.com" /></Field>
            <Field label="Teléfono" required><FInput name="telefono" value={form.telefono} onChange={set} required placeholder="+51 999 999 999" /></Field>
            <Field label="Ciudad" required><FInput name="ciudad" value={form.ciudad} onChange={set} required placeholder="Lima" /></Field>
            <Field label="País"><FInput name="pais" value={form.pais} onChange={set} /></Field>
          </div>
        </div>

        {/* Educación */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-school" style={{ fontSize: 14 }} /> Educación y experiencia</div>
          <div style={S.grid2}>
            <Field label="Nivel de educación">
              <FSelect name="nivel_educacion" value={form.nivel_educacion} onChange={set}>
                <option value="secundaria">Secundaria</option>
                <option value="tecnico">Técnico</option>
                <option value="universitario">Universitario</option>
                <option value="bachiller">Bachiller</option>
                <option value="maestria">Maestría</option>
                <option value="doctorado">Doctorado</option>
              </FSelect>
            </Field>
            <Field label="Años de experiencia">
              <FInput name="años_experiencia" value={form.años_experiencia} onChange={set} type="number" />
            </Field>
            <Field label="Institución educativa"><FInput name="institucion_educativa" value={form.institucion_educativa} onChange={set} placeholder="TECSUP, PUCP, UPC..." /></Field>
            <Field label="Carrera"><FInput name="carrera" value={form.carrera} onChange={set} placeholder="Ingeniería de Software" /></Field>
            <Field label="LinkedIn"><FInput name="linkedin_url" value={form.linkedin_url} onChange={set} type="url" placeholder="https://linkedin.com/in/usuario" /></Field>
            <Field label="GitHub"><FInput name="github_url" value={form.github_url} onChange={set} type="url" placeholder="https://github.com/usuario" /></Field>
          </div>
        </div>

        {/* Documentos */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-file-upload" style={{ fontSize: 14 }} /> Documentos</div>
          <div style={S.grid2}>
            {/* CV */}
            <Field label="Currículum Vitae (PDF)" required>
              <div
                onClick={() => cvRef.current?.click()}
                style={{
                  border: `2px dashed ${cvFile ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, padding: '22px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: cvFile ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <input ref={cvRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setCv(e.target.files[0] || null)} />
                <i className="ti ti-file-type-pdf" style={{ fontSize: 28, color: cvFile ? '#a78bfa' : 'rgba(255,255,255,0.18)', display: 'block', marginBottom: 8 }} />
                {cvFile
                  ? <><div style={{ fontSize: 13, fontWeight: 500, color: '#a78bfa' }}>{cvFile.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{(cvFile.size/1024).toFixed(1)} KB — clic para cambiar</div></>
                  : <><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Arrastra o haz clic para adjuntar</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 3 }}>Solo PDF</div></>
                }
              </div>
            </Field>

            {/* Carta */}
            <Field label="Carta de presentación (opcional)">
              <div
                onClick={() => cartaRef.current?.click()}
                style={{
                  border: `2px dashed ${cartaFile ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, padding: '22px 16px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <input ref={cartaRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setCarta(e.target.files[0] || null)} />
                <i className="ti ti-file-text" style={{ fontSize: 28, color: cartaFile ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)', display: 'block', marginBottom: 8 }} />
                {cartaFile
                  ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{cartaFile.name}</div>
                  : <><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Carta de presentación</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 3 }}>Opcional — Solo PDF</div></>
                }
              </div>
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
          <button type="button" onClick={() => navigate('/vacantes')} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 13.5, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(124,58,237,0.3)' }}>
            {saving && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {saving ? 'Registrando...' : 'Registrar candidato'}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </form>
    </div>
  );
}