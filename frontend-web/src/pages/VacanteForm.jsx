import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../App';
import api from '../services/api';

const INITIAL = {
  titulo: '', codigo: '', area: '', departamento: '',
  descripcion: '', requisitos: '', responsabilidades: '', beneficios: '',
  habilidades: '', tecnologias: '',
  nivel_experiencia: 'junior', modalidad: 'presencial', tipo_contrato: 'indefinido',
  ciudad: '', pais: 'Perú',
  estado: 'borrador', prioridad: 'media',
  numero_vacantes: 1, salario_minimo: '', salario_maximo: '', moneda: 'PEN',
};

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'inherit', opacity: 0.55, marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#7c3aed', opacity: 1 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, opacity: 0.4, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export default function VacanteForm() {
  const { t } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm]   = useState(INITIAL);
  const [loading, setLoad] = useState(false);
  const [saving, setSave]  = useState(false);
  const [error, setError]  = useState(null);

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text, outline: 'none',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  };

  useEffect(() => { if (isEdit) load(); }, [id]);

  async function load() {
    try { setLoad(true); const { data } = await api.get(`/vacantes/${id}/`); setForm({ ...INITIAL, ...data, salario_minimo: data.salario_minimo ?? '', salario_maximo: data.salario_maximo ?? '' }); }
    catch { setError('No se pudo cargar la vacante.'); }
    finally { setLoad(false); }
  }

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError(null); setSave(true);
    const payload = { ...form, salario_minimo: form.salario_minimo === '' ? null : form.salario_minimo, salario_maximo: form.salario_maximo === '' ? null : form.salario_maximo, numero_vacantes: Number(form.numero_vacantes) };
    try {
      if (isEdit) await api.put(`/vacantes/${id}/`, payload);
      else await api.post('/vacantes/', payload);
      navigate('/vacantes');
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error al guardar.');
    } finally { setSave(false); }
  }

  const section = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: '22px 24px', marginBottom: 16, transition: 'background 0.25s' };
  const sTitle  = { fontSize: 11, fontWeight: 600, color: t.textFaint, letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 };
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  const g3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', color: t.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: t.textMuted }}>
        <button onClick={() => navigate('/vacantes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Vacantes
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>{isEdit ? `Editar #${id}` : 'Nueva vacante'}</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={section}>
          <div style={sTitle}><i className="ti ti-info-circle" style={{ fontSize: 14 }} /> Información básica</div>
          <div style={g2}>
            <Field label="Título del puesto" required><input name="titulo" value={form.titulo} onChange={set} required style={inputStyle} placeholder="Ej: Desarrollador Backend Senior" /></Field>
            <Field label="Código único" required hint="Ej: VAC-001"><input name="codigo" value={form.codigo} onChange={set} required style={inputStyle} placeholder="VAC-001" /></Field>
            <Field label="Área" required><input name="area" value={form.area} onChange={set} required style={inputStyle} placeholder="Ej: Tecnología" /></Field>
            <Field label="Departamento"><input name="departamento" value={form.departamento} onChange={set} style={inputStyle} placeholder="Ej: Ingeniería de Software" /></Field>
          </div>
        </div>

        <div style={section}>
          <div style={sTitle}><i className="ti ti-file-text" style={{ fontSize: 14 }} /> Descripción del puesto</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Descripción general" required><textarea name="descripcion" value={form.descripcion} onChange={set} required rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Describe el rol, equipo y contexto..." /></Field>
            <Field label="Requisitos" required><textarea name="requisitos" value={form.requisitos} onChange={set} required rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Formación, experiencia, conocimientos..." /></Field>
            <div style={g2}>
              <Field label="Responsabilidades"><textarea name="responsabilidades" value={form.responsabilidades} onChange={set} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Principales tareas..." /></Field>
              <Field label="Beneficios"><textarea name="beneficios" value={form.beneficios} onChange={set} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Seguro médico, bonos..." /></Field>
            </div>
          </div>
        </div>

        <div style={section}>
          <div style={sTitle}><i className="ti ti-tools" style={{ fontSize: 14 }} /> Habilidades y tecnologías</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Habilidades" required hint="Separadas por comas"><input name="habilidades" value={form.habilidades} onChange={set} required style={inputStyle} placeholder="Trabajo en equipo, Liderazgo, Comunicación" /></Field>
            <Field label="Tecnologías" hint="Separadas por comas"><input name="tecnologias" value={form.tecnologias} onChange={set} style={inputStyle} placeholder="Python, Django, React, MySQL" /></Field>
          </div>
        </div>

        <div style={section}>
          <div style={sTitle}><i className="ti ti-building" style={{ fontSize: 14 }} /> Condiciones del puesto</div>
          <div style={g3}>
            <Field label="Nivel de experiencia" required>
              <select name="nivel_experiencia" value={form.nivel_experiencia} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="junior">Junior (0-2 años)</option>
                <option value="semi_senior">Semi Senior (2-5 años)</option>
                <option value="senior">Senior (5+ años)</option>
                <option value="lead">Tech Lead</option>
                <option value="manager">Manager</option>
              </select>
            </Field>
            <Field label="Modalidad">
              <select name="modalidad" value={form.modalidad} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </Field>
            <Field label="Tipo de contrato">
              <select name="tipo_contrato" value={form.tipo_contrato} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="indefinido">Indefinido</option>
                <option value="temporal">Temporal</option>
                <option value="practicas">Prácticas</option>
                <option value="freelance">Freelance</option>
              </select>
            </Field>
            <Field label="Ciudad" required><input name="ciudad" value={form.ciudad} onChange={set} required style={inputStyle} placeholder="Lima" /></Field>
            <Field label="País"><input name="pais" value={form.pais} onChange={set} style={inputStyle} /></Field>
            <Field label="N° de vacantes"><input name="numero_vacantes" value={form.numero_vacantes} onChange={set} type="number" min={1} style={inputStyle} /></Field>
          </div>
          <div style={{ ...g3, marginTop: 14 }}>
            <Field label="Salario mínimo"><input name="salario_minimo" value={form.salario_minimo} onChange={set} type="number" style={inputStyle} placeholder="2000" /></Field>
            <Field label="Salario máximo"><input name="salario_maximo" value={form.salario_maximo} onChange={set} type="number" style={inputStyle} placeholder="4000" /></Field>
            <Field label="Moneda">
              <select name="moneda" value={form.moneda} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </Field>
          </div>
        </div>

        <div style={section}>
          <div style={sTitle}><i className="ti ti-flag" style={{ fontSize: 14 }} /> Estado y prioridad</div>
          <div style={g2}>
            <Field label="Estado" required>
              <select name="estado" value={form.estado} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="borrador">Borrador</option>
                <option value="abierta">Abierta</option>
                <option value="pausada">Pausada</option>
                <option value="cerrada">Cerrada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </Field>
            <Field label="Prioridad">
              <select name="prioridad" value={form.prioridad} onChange={set} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
          <button type="button" onClick={() => navigate('/vacantes')} style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(124,58,237,0.3)' }}>
            {saving && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear vacante'}
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </form>
    </div>
  );
}