import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../App';
import api from '../services/api';

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
  titulo: '', area: '', departamento: '', industria: 'otro',
  // Organizacional (NUEVO)
  motivo_vacante: 'nuevo_puesto', nombre_reemplazado: '',
  jefe_directo: '', solicitante: '', cantidad_posiciones: 1,
  confidencial: false, fecha_limite: '',
  // Descripción
  descripcion: '', responsabilidades: '', requisitos: '',
  requisitos_deseables: '', habilidades: '', tecnologias: '',
  conocimientos_especificos: '', beneficios: '',
  // Condiciones
  nivel_experiencia: 'semi_senior', anios_experiencia: 0,
  nivel_educativo: '', carrera_afin: '',
  modalidad: 'presencial', tipo_contrato: 'indefinido',
  horario: '', horario_tipo: 'tiempo_completo', ubicacion: '', // NUEVO
  ciudad: 'Lima', pais: 'Perú',
  salario_minimo: '', salario_maximo: '', moneda: 'PEN', mostrar_salario: false,
  // Estado
  estado: 'abierta', prioridad: 'media',
  // IA
  score_cv_minimo: 60, nota_minima_examen: 13, top_candidatos_finalistas: 5,
};

export default function VacanteForm() {
  const { t } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]    = useState(INITIAL);
  const [areas, setAreas]  = useState([]);
  const [loading, setLoad] = useState(false);
  const [saving, setSave]  = useState(false);
  const [error, setError]  = useState(null);

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text,
    outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
    colorScheme: 'dark',
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

  useEffect(() => {
    api.get('/api/areas/activas/').then(r => setAreas(r.data)).catch(() => setAreas([]));
  }, []);

  useEffect(() => { if (isEdit) loadVacante(); }, [id]);

  async function loadVacante() {
    try {
      setLoad(true);
      const { data } = await api.get(`/api/vacantes/${id}/`);

      // Vacantes antiguas (creadas antes de los campos RRHH de Sprint 2) pueden
      // tener choices guardados como "" en BD. Los <select> no tienen opción
      // vacía, así que reemplazamos "" por el valor por defecto de INITIAL
      // para evitar guardar/publicar con un valor inválido.
      const merged = { ...INITIAL, ...data };
      Object.keys(INITIAL).forEach(key => {
        if (merged[key] === '' && typeof INITIAL[key] === 'string' && INITIAL[key] !== '') {
          merged[key] = INITIAL[key];
        }
      });

      setForm({
        ...merged,
        area: data.area?.id || data.area || '',
        salario_minimo: data.salario_minimo ?? '',
        salario_maximo: data.salario_maximo ?? '',
        fecha_limite: data.fecha_limite || '',
      });
    } catch { setError('No se pudo cargar la vacante.'); }
    finally { setLoad(false); }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setSave(true);
    const payload = {
      ...form,
      salario_minimo: form.salario_minimo === '' ? null : form.salario_minimo,
      salario_maximo: form.salario_maximo === '' ? null : form.salario_maximo,
      fecha_limite:   form.fecha_limite === '' ? null : form.fecha_limite,
      anios_experiencia: Number(form.anios_experiencia),
      cantidad_posiciones: Number(form.cantidad_posiciones),
      score_cv_minimo: Number(form.score_cv_minimo),
      nota_minima_examen: Number(form.nota_minima_examen),
      top_candidatos_finalistas: Number(form.top_candidatos_finalistas),
    };
    try {
      if (isEdit) await api.put(`/api/vacantes/${id}/`, payload);
      else        await api.post('/api/vacantes/', payload);
      navigate('/vacantes');
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error al guardar.');
    } finally { setSave(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', color: t.text }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, fontSize: 13, color: t.textMuted }}>
        <button onClick={() => navigate('/vacantes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Vacantes
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>{isEdit ? `Editar #${id}` : 'Nueva vacante'}</span>
      </div>

      {isEdit && form.codigo && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '6px 14px', marginBottom: 18, fontSize: 13, color: '#a78bfa' }}>
          <i className="ti ti-hash" style={{ fontSize: 14 }} />
          Código: <strong>{form.codigo}</strong>
          <span style={{ fontSize: 11, opacity: 0.6 }}>— generado automáticamente</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', gap: 8 }}>
          <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Información básica ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-info-circle" style={{ fontSize: 14 }} /> Información básica</div>
          <div style={g2}>
            <Field label="Título del puesto" required textMuted={t.textMuted}>
              <input name="titulo" value={form.titulo} onChange={handleChange} required style={inp} placeholder="Ej: Desarrollador Backend Senior" />
            </Field>
            <Field label="Área / Departamento" required textMuted={t.textMuted}>
              <select name="area" value={form.area} onChange={handleChange} required style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Selecciona un área —</option>
                {areas.map(a => <option key={a.id} value={a.id}>[{a.codigo_corto}] {a.nombre}</option>)}
              </select>
              {areas.length === 0 && (
                <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 13 }} /> No hay áreas activas.
                </div>
              )}
            </Field>
            <Field label="Sub-departamento" textMuted={t.textMuted} hint="Opcional. Ej: Backend, Frontend, Data">
              <input name="departamento" value={form.departamento} onChange={handleChange} style={inp} placeholder="Ej: Ingeniería de Software" />
            </Field>
            <Field label="Industria" textMuted={t.textMuted}>
              <select name="industria" value={form.industria} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="software">Software / SaaS</option>
                <option value="banca">Banca y Finanzas</option>
                <option value="retail">Retail / Comercio</option>
                <option value="salud">Salud / Farmacia</option>
                <option value="educacion">Educación</option>
                <option value="manufactura">Manufactura / Industrial</option>
                <option value="servicios">Servicios Profesionales</option>
                <option value="gobierno">Gobierno / Sector Público</option>
                <option value="telecomunicaciones">Telecomunicaciones</option>
                <option value="construccion">Construcción / Inmobiliaria</option>
                <option value="agricultura">Agricultura / Agroindustria</option>
                <option value="ong">ONG / Sin fines de lucro</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── Información organizacional (NUEVO) ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-building-community" style={{ fontSize: 14 }} /> Información organizacional</div>
          <div style={g2}>
            <Field label="Motivo de la vacante" textMuted={t.textMuted}>
              <select name="motivo_vacante" value={form.motivo_vacante} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="nuevo_puesto">Nuevo puesto</option>
                <option value="reemplazo">Reemplazo</option>
                <option value="expansion">Expansión del equipo</option>
                <option value="campana">Campaña temporal</option>
              </select>
            </Field>
            {form.motivo_vacante === 'reemplazo' && (
              <Field label="Nombre del colaborador a reemplazar" textMuted={t.textMuted}>
                <input name="nombre_reemplazado" value={form.nombre_reemplazado} onChange={handleChange} style={inp} placeholder="Nombre del colaborador que se reemplaza" />
              </Field>
            )}
            <Field label="Jefe directo" textMuted={t.textMuted}>
              <input name="jefe_directo" value={form.jefe_directo} onChange={handleChange} style={inp} placeholder="Ej: María López — Gerente de TI" />
            </Field>
            <Field label="Solicitante" textMuted={t.textMuted}>
              <input name="solicitante" value={form.solicitante} onChange={handleChange} style={inp} placeholder="Ej: Carlos Ruiz — Gerente General" />
            </Field>
            <Field label="N° de posiciones disponibles" textMuted={t.textMuted}>
              <input name="cantidad_posiciones" value={form.cantidad_posiciones} onChange={handleChange} type="number" min={1} style={inp} />
            </Field>
            <Field label="Fecha límite de postulación" textMuted={t.textMuted}>
              <input name="fecha_limite" value={form.fecha_limite} onChange={handleChange} type="date" style={inp} />
            </Field>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" name="confidencial" id="confidencial" checked={form.confidencial} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer' }} />
            <label htmlFor="confidencial" style={{ fontSize: 13, color: t.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-eye-off" style={{ fontSize: 14 }} />
              Vacante confidencial — no mostrar nombre de empresa al candidato
            </label>
          </div>
        </div>

        {/* ── Descripción ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-file-text" style={{ fontSize: 14 }} /> Descripción del puesto</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Descripción general" required textMuted={t.textMuted}>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} required rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Describe el rol, equipo y contexto de la empresa..." />
            </Field>
            <Field label="Requisitos obligatorios" required textMuted={t.textMuted}>
              <textarea name="requisitos" value={form.requisitos} onChange={handleChange} required rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Formación, experiencia mínima, conocimientos obligatorios..." />
            </Field>
            <div style={g2}>
              <Field label="Responsabilidades" textMuted={t.textMuted}>
                <textarea name="responsabilidades" value={form.responsabilidades} onChange={handleChange} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Principales tareas del cargo..." />
              </Field>
              <Field label="Requisitos deseables" textMuted={t.textMuted}>
                <textarea name="requisitos_deseables" value={form.requisitos_deseables} onChange={handleChange} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Conocimientos opcionales que suman..." />
              </Field>
            </div>
            <Field label="Beneficios" textMuted={t.textMuted}>
              <textarea name="beneficios" value={form.beneficios} onChange={handleChange} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Seguro médico, bonos, horario flexible..." />
            </Field>
          </div>
        </div>

        {/* ── Habilidades ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-tools" style={{ fontSize: 14 }} /> Habilidades y tecnologías</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Habilidades requeridas" required textMuted={t.textMuted} hint="Separadas por comas. Ej: Trabajo en equipo, Liderazgo, Comunicación">
              <input name="habilidades" value={form.habilidades} onChange={handleChange} required style={inp} placeholder="Trabajo en equipo, Liderazgo, Comunicación" />
            </Field>
            <Field label="Tecnologías / Herramientas" textMuted={t.textMuted} hint="Separadas por comas. Ej: Python, Django, React, MySQL">
              <input name="tecnologias" value={form.tecnologias} onChange={handleChange} style={inp} placeholder="Python, Django, React, MySQL" />
            </Field>
            <Field label="Conocimientos específicos para examen IA" textMuted={t.textMuted} hint="Temas que la IA evaluará en el examen teórico">
              <textarea name="conocimientos_especificos" value={form.conocimientos_especificos} onChange={handleChange} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} placeholder="Patrones de diseño, microservicios, SOLID..." />
            </Field>
          </div>
        </div>

        {/* ── Condiciones ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-building" style={{ fontSize: 14 }} /> Condiciones del puesto</div>
          <div style={g3}>
            <Field label="Nivel de experiencia" required textMuted={t.textMuted}>
              <select name="nivel_experiencia" value={form.nivel_experiencia} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="practicante">Practicante / Intern</option>
                <option value="junior">Junior (0-2 años)</option>
                <option value="semi_senior">Semi-Senior (2-4 años)</option>
                <option value="senior">Senior (4+ años)</option>
                <option value="lider">Líder / Tech Lead</option>
                <option value="gerencial">Gerencial / C-Level</option>
              </select>
            </Field>
            <Field label="Años mínimos de experiencia" textMuted={t.textMuted}>
              <input name="anios_experiencia" value={form.anios_experiencia} onChange={handleChange} type="number" min={0} style={inp} />
            </Field>
            <Field label="Modalidad" textMuted={t.textMuted}>
              <select name="modalidad" value={form.modalidad} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </Field>
            <Field label="Tipo de contrato" textMuted={t.textMuted}>
              <select name="tipo_contrato" value={form.tipo_contrato} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="indefinido">Contrato indefinido</option>
                <option value="plazo_fijo">Plazo fijo</option>
                <option value="por_obra">Por obra o servicio</option>
                <option value="practicas">Prácticas profesionales</option>
                <option value="freelance">Freelance / Honorarios</option>
                <option value="part_time">Part-time</option>
              </select>
            </Field>
            <Field label="Tipo de horario" textMuted={t.textMuted}>
              <select name="horario_tipo" value={form.horario_tipo} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="tiempo_completo">Tiempo completo</option>
                <option value="medio_tiempo">Medio tiempo</option>
                <option value="turnos">Por turnos</option>
                <option value="flexible">Horario flexible</option>
                <option value="por_objetivos">Por objetivos</option>
              </select>
            </Field>
            <Field label="Horario" textMuted={t.textMuted}>
              <input name="horario" value={form.horario} onChange={handleChange} style={inp} placeholder="Ej: Lunes a viernes 9am-6pm" />
            </Field>
            <Field label="Ciudad" required textMuted={t.textMuted}>
              <input name="ciudad" value={form.ciudad} onChange={handleChange} required style={inp} placeholder="Lima" />
            </Field>
            <Field label="Ubicación exacta" textMuted={t.textMuted}>
              <input name="ubicacion" value={form.ubicacion} onChange={handleChange} style={inp} placeholder="Ej: San Isidro, Torre Parque Mar Piso 12" />
            </Field>
            <Field label="País" textMuted={t.textMuted}>
              <input name="pais" value={form.pais} onChange={handleChange} style={inp} />
            </Field>
          </div>
          <div style={{ ...g3, marginTop: 14 }}>
            <Field label="Salario mínimo" textMuted={t.textMuted}>
              <input name="salario_minimo" value={form.salario_minimo} onChange={handleChange} type="number" style={inp} placeholder="2000" />
            </Field>
            <Field label="Salario máximo" textMuted={t.textMuted}>
              <input name="salario_maximo" value={form.salario_maximo} onChange={handleChange} type="number" style={inp} placeholder="4000" />
            </Field>
            <Field label="Moneda" textMuted={t.textMuted}>
              <select name="moneda" value={form.moneda} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="PEN">PEN — Soles</option>
                <option value="USD">USD — Dólares</option>
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" name="mostrar_salario" id="mostrar_salario" checked={form.mostrar_salario} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer' }} />
            <label htmlFor="mostrar_salario" style={{ fontSize: 13, color: t.textMuted, cursor: 'pointer' }}>
              Mostrar rango salarial al candidato
            </label>
          </div>
        </div>

        {/* ── Configuración IA ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-robot" style={{ fontSize: 14 }} /> Configuración del proceso IA</div>
          <div style={g3}>
            <Field label="Score mínimo de CV" textMuted={t.textMuted} hint="0–100. Candidatos por debajo son rechazados automáticamente">
              <input name="score_cv_minimo" value={form.score_cv_minimo} onChange={handleChange} type="number" min={0} max={100} style={inp} />
            </Field>
            <Field label="Nota mínima del examen" textMuted={t.textMuted} hint="0–20. Nota mínima para avanzar">
              <input name="nota_minima_examen" value={form.nota_minima_examen} onChange={handleChange} type="number" min={0} max={20} style={inp} />
            </Field>
            <Field label="Top candidatos finalistas" textMuted={t.textMuted} hint="Cantidad que pasa a entrevista presencial">
              <input name="top_candidatos_finalistas" value={form.top_candidatos_finalistas} onChange={handleChange} type="number" min={1} style={inp} />
            </Field>
          </div>
        </div>

        {/* ── Estado ── */}
        <div style={section}>
          <div style={sTitle}><i className="ti ti-flag" style={{ fontSize: 14 }} /> Estado y prioridad</div>
          <div style={g2}>
            <Field label="Estado" required textMuted={t.textMuted}>
              <select name="estado" value={form.estado} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="borrador">Borrador</option>
                <option value="abierta">Abierta</option>
                <option value="en_proceso">En proceso de selección</option>
                <option value="pausada">Pausada</option>
                <option value="cerrada">Cerrada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </Field>
            <Field label="Prioridad" textMuted={t.textMuted}>
              <select name="prioridad" value={form.prioridad} onChange={handleChange} style={{ ...inp, cursor: 'pointer' }}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
          <button type="button" onClick={() => navigate('/vacantes')} style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: saving ? 'none' : '0 0 20px rgba(124,58,237,0.3)' }}>
            {saving && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear vacante'}
          </button>
        </div>

      </form>
    </div>
  );
}