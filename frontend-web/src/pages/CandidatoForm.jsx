import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

// ─── Fuera del componente ─────────────────────────────────────────────────────
function Field({ label, required, hint, textMuted, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: textMuted, marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#7c3aed' }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: textMuted, opacity: 0.6, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const INITIAL = {
  vacante: '', nombre: '', apellido_paterno: '', apellido_materno: '',
  email: '', telefono: '', ciudad: '', linkedin: '',
  pretension_salarial: '',
  disponibilidad: '',
  nivel_educativo: '', carrera: '', anios_experiencia: 0,
  habilidades_declaradas: '',
  analizar_al_crear: false, // NUEVO — checkbox "Analizar CV con IA al guardar"
};

export default function CandidatoForm() {
  const { t } = useTheme();
  const navigate = useNavigate();

  const [form, setForm]         = useState(INITIAL);
  const [cvFile, setCvFile]     = useState(null);

  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text,
    outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
  };
  const section = {
    background: t.card, border: `1px solid ${t.cardBorder}`,
    borderRadius: 12, padding: '22px 24px', marginBottom: 16,
    transition: 'background 0.25s',
  };
  const sTitle = {
    fontSize: 11, fontWeight: 600, color: t.textFaint,
    letterSpacing: '0.13em', textTransform: 'uppercase',
    marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
  };
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
  const g3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 };

  const { data: vacantesData } = useQuery({
    queryKey: qk.vacantes.list(),
    queryFn: async () => {
      const { data } = await api.get('/api/vacantes/');
      return data.results || data;
    },
  });
  const vacantes = (vacantesData || []).filter(v => ['abierta', 'en_proceso'].includes(v.estado));

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file && file.type !== 'application/pdf') {
      toast.error('Solo se aceptan archivos PDF.');
      e.target.value = '';
      return;
    }
    setCvFile(file || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!cvFile) { setError('El CV en PDF es obligatorio.'); return; }
    setSaving(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'analizar_al_crear') return; // se agrega aparte como string
      if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
    });
    fd.append('analizar_al_crear', form.analizar_al_crear ? 'true' : 'false');
    fd.append('cv', cvFile);

    try {
      await api.post('/api/candidatos/', fd, { headers: { 'Content-Type': undefined } });
      if (form.analizar_al_crear) {
        toast.success('Candidato registrado. Analizando CV con IA — el score aparecerá en unos segundos.');
      } else {
        toast.success('Candidato registrado correctamente.');
      }
      navigate('/candidatos');
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        setError(Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | '));
      } else {
        setError('Error al guardar. Verifica los campos.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', color: t.text }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: t.textMuted }}>
        <button onClick={() => navigate('/candidatos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Candidatos
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>Registrar candidato</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Vacante ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-briefcase" style={{ fontSize: 14 }} /> Vacante</div>
          <Field label="Vacante a la que postula" required textMuted={t.textMuted}>
            <select name="vacante" value={form.vacante} onChange={handleChange} required style={{ ...inp, cursor: 'pointer' }}>
              <option value="">— Selecciona una vacante —</option>
              {vacantes.map(v => (
                <option key={v.id} value={v.id}>{v.titulo} {v.ciudad ? `· ${v.ciudad}` : ''}</option>
              ))}
            </select>
            {vacantes.length === 0 && (
              <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} /> No hay vacantes abiertas. Crea una primero.
              </div>
            )}
          </Field>
        </div>

        {/* ── Datos personales ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-user" style={{ fontSize: 14 }} /> Datos personales</div>
          <div style={g3}>
            <Field label="Nombre" required textMuted={t.textMuted}>
              <input name="nombre" value={form.nombre} onChange={handleChange} required style={inp} placeholder="Juan" />
            </Field>
            <Field label="Apellido paterno" required textMuted={t.textMuted}>
              <input name="apellido_paterno" value={form.apellido_paterno} onChange={handleChange} required style={inp} placeholder="García" />
            </Field>
            <Field label="Apellido materno" textMuted={t.textMuted}>
              <input name="apellido_materno" value={form.apellido_materno} onChange={handleChange} style={inp} placeholder="López" />
            </Field>
          </div>
        </div>

        {/* ── Contacto ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-mail" style={{ fontSize: 14 }} /> Contacto y disponibilidad</div>
          <div style={g2}>
            <Field label="Email" required textMuted={t.textMuted}>
              <input name="email" value={form.email} onChange={handleChange} type="email" required style={inp} placeholder="juan@email.com" />
            </Field>
            <Field label="Teléfono" textMuted={t.textMuted}>
              <input name="telefono" value={form.telefono} onChange={handleChange} style={inp} placeholder="+51 999 999 999" />
            </Field>
            <Field label="Ciudad" textMuted={t.textMuted}>
              <input name="ciudad" value={form.ciudad} onChange={handleChange} style={inp} placeholder="Lima" />
            </Field>
            <Field label="LinkedIn" textMuted={t.textMuted} hint="URL completa del perfil">
              <input name="linkedin" value={form.linkedin} onChange={handleChange} type="url" style={inp} placeholder="https://linkedin.com/in/..." />
            </Field>
            {/* NUEVOS */}
            <Field label="Pretensión salarial" textMuted={t.textMuted} hint="Opcional — en la moneda de la vacante">
              <input name="pretension_salarial" value={form.pretension_salarial} onChange={handleChange} type="number" min={0} style={inp} placeholder="3500" />
            </Field>
            <Field label="Disponibilidad de inicio" textMuted={t.textMuted} hint="Ej: Inmediata, 15 días, 1 mes">
              <input name="disponibilidad" value={form.disponibilidad} onChange={handleChange} style={inp} placeholder="Inmediata" />
            </Field>
          </div>
        </div>

        {/* ── Perfil profesional ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-school" style={{ fontSize: 14 }} /> Perfil profesional</div>
          <div style={g3}>
            <Field label="Nivel educativo" textMuted={t.textMuted}>
              <select name="nivel_educativo" value={form.nivel_educativo} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Selecciona —</option>
                <option value="secundaria">Secundaria completa</option>
                <option value="tecnico">Técnico</option>
                <option value="universitario">Universitario</option>
                <option value="bachiller">Bachiller</option>
                <option value="titulado">Titulado</option>
                <option value="maestria">Maestría</option>
                <option value="doctorado">Doctorado</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <Field label="Carrera / Especialidad" textMuted={t.textMuted}>
              <input name="carrera" value={form.carrera} onChange={handleChange} style={inp} placeholder="Ingeniería de Sistemas" />
            </Field>
            <Field label="Años de experiencia" textMuted={t.textMuted}>
              <input name="anios_experiencia" value={form.anios_experiencia} onChange={handleChange} type="number" min={0} style={inp} />
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Habilidades declaradas" textMuted={t.textMuted} hint="Separadas por comas. La IA las comparará con los requisitos de la vacante.">
              <textarea name="habilidades_declaradas" value={form.habilidades_declaradas} onChange={handleChange} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Python, Django, React, SQL, Git..." />
            </Field>
          </div>
        </div>

        {/* ── CV ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-file-cv" style={{ fontSize: 14 }} /> Curriculum Vitae</div>
          <Field label="Archivo PDF del CV" required textMuted={t.textMuted} hint="Solo PDF. El sistema extraerá el texto automáticamente para el análisis IA.">
            <div style={{
              border: `2px dashed ${cvFile ? 'rgba(124,58,237,0.5)' : t.inputBorder}`,
              borderRadius: 10, padding: '20px 16px', textAlign: 'center',
              background: cvFile ? 'rgba(124,58,237,0.05)' : t.inputBg,
              transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
            }}>
              <input type="file" accept=".pdf" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              {cvFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <i className="ti ti-file-type-pdf" style={{ fontSize: 22, color: '#a78bfa' }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{cvFile.name}</div>
                    <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{(cvFile.size / 1024).toFixed(1)} KB — Haz clic para cambiar</div>
                  </div>
                </div>
              ) : (
                <div>
                  <i className="ti ti-upload" style={{ fontSize: 28, color: t.textFaint, display: 'block', marginBottom: 8 }} />
                  <div style={{ fontSize: 13.5, color: t.textMuted }}>Arrastra el PDF aquí o haz clic para seleccionar</div>
                  <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 4 }}>Máximo recomendado: 5 MB</div>
                </div>
              )}
            </div>
          </Field>
        </div>

        {/* ── Análisis IA (NUEVO) ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-robot" style={{ fontSize: 14 }} /> Análisis con inteligencia artificial</div>
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              name="analizar_al_crear"
              checked={form.analizar_al_crear}
              onChange={handleChange}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>
                Analizar CV con IA al guardar
              </div>
              <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 3, lineHeight: 1.5 }}>
                Si lo activas, el sistema analizará el CV automáticamente en segundo plano y el candidato
                aparecerá con su score en unos segundos. Si lo dejas desactivado, podrás analizarlo
                después desde el botón "Analizar IA" en la lista de candidatos.
              </div>
            </div>
          </label>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
          <button type="button" onClick={() => navigate('/candidatos')} style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(124,58,237,0.3)' }}>
            {saving && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {saving ? 'Registrando...' : 'Registrar candidato'}
          </button>
        </div>

      </form>
    </div>
  );
}