import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const INITIAL = {
  titulo: '', codigo: '', area: '', departamento: '',
  descripcion: '', requisitos: '', responsabilidades: '', beneficios: '',
  habilidades: '', tecnologias: '',
  nivel_experiencia: 'junior', modalidad: 'presencial', tipo_contrato: 'indefinido',
  ciudad: '', pais: 'Perú',
  estado: 'borrador', prioridad: 'media',
  numero_vacantes: 1,
  salario_minimo: '', salario_maximo: '', moneda: 'PEN',
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
  label: {
    display: 'block', fontSize: 12.5, fontWeight: 500,
    color: 'rgba(255,255,255,0.5)', marginBottom: 6,
  },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: '#f0f0f0',
    outline: 'none', transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 },
};

function Field({ label, required, hint, children, style }) {
  return (
    <div style={style}>
      <label style={S.label}>
        {label} {required && <span style={{ color: '#7c3aed' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Input({ name, value, onChange, type = 'text', placeholder, required, min }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      name={name} value={value} onChange={onChange} type={type}
      placeholder={placeholder} required={required} min={min}
      style={{ ...S.input, borderColor: focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    />
  );
}

function Select({ name, value, onChange, required, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      name={name} value={value} onChange={onChange} required={required}
      style={{ ...S.input, cursor: 'pointer', borderColor: focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    >{children}</select>
  );
}

function Textarea({ name, value, onChange, placeholder, rows = 3, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      name={name} value={value} onChange={onChange} placeholder={placeholder}
      rows={rows} required={required}
      style={{ ...S.input, resize: 'vertical', lineHeight: 1.6, borderColor: focused ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    />
  );
}

export default function VacanteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoad]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => { if (isEdit) load(); }, [id]);

  async function load() {
    try { setLoad(true); const { data } = await api.get(`/vacantes/${id}/`); setForm({ ...INITIAL, ...data, salario_minimo: data.salario_minimo ?? '', salario_maximo: data.salario_maximo ?? '' }); }
    catch { setError('No se pudo cargar la vacante.'); }
    finally { setLoad(false); }
  }

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError(null); setSaving(true);
    const payload = { ...form, salario_minimo: form.salario_minimo === '' ? null : form.salario_minimo, salario_maximo: form.salario_maximo === '' ? null : form.salario_maximo, numero_vacantes: Number(form.numero_vacantes) };
    try {
      if (isEdit) await api.put(`/vacantes/${id}/`, payload);
      else await api.post('/vacantes/', payload);
      navigate('/vacantes');
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error al guardar.');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
        <button onClick={() => navigate('/vacantes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Vacantes
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{isEdit ? `Editar #${id}` : 'Nueva vacante'}</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <form onSubmit={submit}>

        {/* Info básica */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-info-circle" style={{ fontSize: 14 }} /> Información básica</div>
          <div style={S.grid2}>
            <Field label="Título del puesto" required>
              <Input name="titulo" value={form.titulo} onChange={set} required placeholder="Ej: Desarrollador Backend Senior" />
            </Field>
            <Field label="Código único" required hint="Ej: VAC-001 — debe ser único en el sistema">
              <Input name="codigo" value={form.codigo} onChange={set} required placeholder="VAC-001" />
            </Field>
            <Field label="Área" required>
              <Input name="area" value={form.area} onChange={set} required placeholder="Ej: Tecnología" />
            </Field>
            <Field label="Departamento">
              <Input name="departamento" value={form.departamento} onChange={set} placeholder="Ej: Ingeniería de Software" />
            </Field>
          </div>
        </div>

        {/* Descripción */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-file-text" style={{ fontSize: 14 }} /> Descripción del puesto</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Descripción general" required>
              <Textarea name="descripcion" value={form.descripcion} onChange={set} required rows={4} placeholder="Describe el rol, equipo y contexto de la empresa..." />
            </Field>
            <Field label="Requisitos" required>
              <Textarea name="requisitos" value={form.requisitos} onChange={set} required rows={4} placeholder="Formación académica, años de experiencia, conocimientos..." />
            </Field>
            <div style={S.grid2}>
              <Field label="Responsabilidades">
                <Textarea name="responsabilidades" value={form.responsabilidades} onChange={set} rows={3} placeholder="Principales tareas del cargo..." />
              </Field>
              <Field label="Beneficios">
                <Textarea name="beneficios" value={form.beneficios} onChange={set} rows={3} placeholder="Seguro médico, bonos, horario flexible..." />
              </Field>
            </div>
          </div>
        </div>

        {/* Habilidades */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-tools" style={{ fontSize: 14 }} /> Habilidades y tecnologías</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Habilidades" required hint="Separadas por comas. Ej: Trabajo en equipo, Comunicación, Proactividad">
              <Input name="habilidades" value={form.habilidades} onChange={set} required placeholder="Trabajo en equipo, Liderazgo, Comunicación" />
            </Field>
            <Field label="Tecnologías" hint="Separadas por comas. Ej: Python, Django, React, MySQL">
              <Input name="tecnologias" value={form.tecnologias} onChange={set} placeholder="Python, Django, React, MySQL" />
            </Field>
          </div>
        </div>

        {/* Condiciones */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-building" style={{ fontSize: 14 }} /> Condiciones del puesto</div>
          <div style={S.grid3}>
            <Field label="Nivel de experiencia" required>
              <Select name="nivel_experiencia" value={form.nivel_experiencia} onChange={set}>
                <option value="junior">Junior (0-2 años)</option>
                <option value="semi_senior">Semi Senior (2-5 años)</option>
                <option value="senior">Senior (5+ años)</option>
                <option value="lead">Tech Lead</option>
                <option value="manager">Manager</option>
              </Select>
            </Field>
            <Field label="Modalidad">
              <Select name="modalidad" value={form.modalidad} onChange={set}>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </Select>
            </Field>
            <Field label="Tipo de contrato">
              <Select name="tipo_contrato" value={form.tipo_contrato} onChange={set}>
                <option value="indefinido">Indefinido</option>
                <option value="temporal">Temporal</option>
                <option value="practicas">Prácticas</option>
                <option value="freelance">Freelance</option>
              </Select>
            </Field>
            <Field label="Ciudad" required>
              <Input name="ciudad" value={form.ciudad} onChange={set} required placeholder="Lima" />
            </Field>
            <Field label="País">
              <Input name="pais" value={form.pais} onChange={set} />
            </Field>
            <Field label="N° de vacantes">
              <Input name="numero_vacantes" value={form.numero_vacantes} onChange={set} type="number" min={1} />
            </Field>
          </div>
          <div style={{ ...S.grid3, marginTop: 14 }}>
            <Field label="Salario mínimo">
              <Input name="salario_minimo" value={form.salario_minimo} onChange={set} type="number" placeholder="2000" />
            </Field>
            <Field label="Salario máximo">
              <Input name="salario_maximo" value={form.salario_maximo} onChange={set} type="number" placeholder="4000" />
            </Field>
            <Field label="Moneda">
              <Select name="moneda" value={form.moneda} onChange={set}>
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Estado */}
        <div style={S.section}>
          <div style={S.sectionTitle}><i className="ti ti-flag" style={{ fontSize: 14 }} /> Estado y prioridad</div>
          <div style={S.grid2}>
            <Field label="Estado" required>
              <Select name="estado" value={form.estado} onChange={set}>
                <option value="borrador">Borrador</option>
                <option value="abierta">Abierta</option>
                <option value="pausada">Pausada</option>
                <option value="cerrada">Cerrada</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </Field>
            <Field label="Prioridad">
              <Select name="prioridad" value={form.prioridad} onChange={set}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </Select>
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
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear vacante'}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </form>
    </div>
  );
}