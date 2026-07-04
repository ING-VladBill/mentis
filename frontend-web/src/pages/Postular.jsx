import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MODALIDAD_ICON = { Presencial: 'ti-building', Remoto: 'ti-home', Híbrido: 'ti-building-arch' };

// ─── Componentes auxiliares (FUERA del componente principal) ──────────────────

function Badge({ icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 20,
      background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
      color: '#a78bfa', fontSize: 13, fontWeight: 500,
    }}>
      <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
      {label}
    </span>
  );
}

function ListaItems({ texto }) {
  if (!texto) return null;
  // Soporta texto con saltos de línea o viñetas simples
  const items = texto
    .split(/\n+/)
    .map(l => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return <p style={{ fontSize: 14.5, lineHeight: 1.75, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{texto}</p>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: '#374151' }}>{item}</li>
      ))}
    </ul>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

// ─── Pantallas de estado (loading / error / éxito) ────────────────────────────

function PantallaCarga() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PantallaError({ codigo: errCodigo, mensaje }) {
  const ICONOS = { 404: 'ti-search-off', 403: 'ti-eye-off', 410: 'ti-door-exit' };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`ti ${ICONOS[errCodigo] || 'ti-alert-circle'}`} style={{ fontSize: 28, color: '#7c3aed' }} />
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          {errCodigo === 404 && 'Oferta no encontrada'}
          {errCodigo === 403 && 'Oferta no disponible'}
          {errCodigo === 410 && 'Posiciones cubiertas'}
          {![404, 403, 410].includes(errCodigo) && 'Ocurrió un error'}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
          {mensaje || 'No pudimos cargar esta oferta de trabajo. Verifica el enlace o intenta más tarde.'}
        </p>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, color: '#7c3aed', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
          <i className="ti ti-arrow-left" /> Ir al inicio
        </Link>
      </div>
    </div>
  );
}

function PantallaExito({ titulo }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', padding: 24 }}>
      <div style={{
        textAlign: 'center', maxWidth: 460,
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
        padding: '40px 36px', boxShadow: '0 10px 40px rgba(17,24,39,0.06)',
        animation: 'slideUp 0.35s ease',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-circle-check" style={{ fontSize: 30, color: '#10b981' }} />
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
          ¡Tu postulación fue recibida!
        </h1>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.7, margin: '0 0 6px' }}>
          Gracias por postular a <strong style={{ color: '#374151' }}>{titulo}</strong>.
        </p>
        <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
          Nuestro equipo revisará tu CV y nos pondremos en contacto contigo a través del correo
          que registraste si tu perfil avanza en el proceso.
        </p>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const FORM_INITIAL = {
  nombre: '', apellido_paterno: '', apellido_materno: '',
  email: '', telefono: '', ciudad: '', linkedin: '',
  pretension_salarial: '', disponibilidad: '',
};

export default function Postular() {
  const { codigo } = useParams();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [errCodigo, setErrCodigo] = useState(null);
  const [errMensaje, setErrMensaje] = useState(null);

  const [form, setForm]       = useState(FORM_INITIAL);
  const [cvFile, setCvFile]   = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aceptaModalidad, setAceptaModalidad] = useState(false);
  const [aceptaCiudad, setAceptaCiudad]       = useState(false);
  const [aceptaTerminos, setAceptaTerminos]   = useState(false);

  // ── Carga de la oferta ──
  useEffect(() => {
    let activo = true;
    setLoading(true);
    api.get(`/api/postular/${codigo}/`)
      .then(r => { if (activo) setData(r.data); })
      .catch(err => {
        if (!activo) return;
        const status = err.response?.status;
        setErrCodigo(status || 500);
        setErrMensaje(err.response?.data?.error || err.response?.data?.detail || null);
      })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [codigo]);

  // ── Inyección de schema.org para Google for Jobs ──
  useEffect(() => {
    if (!data?.schema_org) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data.schema_org);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [data]);

  // ── Título de pestaña ──
  useEffect(() => {
    if (data?.titulo) document.title = `${data.titulo} — MENTIS`;
    return () => { document.title = 'MENTIS'; };
  }, [data]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file && file.type !== 'application/pdf') {
      setFormError('Solo se aceptan archivos PDF.');
      e.target.value = '';
      return;
    }
    setFormError(null);
    setCvFile(file || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!cvFile) { setFormError('Adjunta tu CV en PDF para continuar.'); return; }
    if (!aceptaTerminos) { setFormError('Debes aceptar el tratamiento de datos personales para continuar.'); return; }
    if (data?.modalidad && !aceptaModalidad) { setFormError('Debes confirmar que aceptas la modalidad de trabajo.'); return; }
    if (data?.ciudad && !aceptaCiudad) { setFormError('Debes confirmar tu disponibilidad para la ubicación del puesto.'); return; }

    setEnviando(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
    });
    fd.append('cv', cvFile);
    fd.append('acepta_modalidad', aceptaModalidad ? 'true' : 'false');
    fd.append('acepta_ciudad', aceptaCiudad ? 'true' : 'false');

    try {
      await api.post(`/api/postular/${codigo}/enviar/`, fd, { headers: { 'Content-Type': undefined } });
      setEnviado(true);
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) => Array.isArray(v) ? v.join(' ') : v);
        setFormError(msgs.join(' '));
      } else {
        setFormError('No se pudo enviar tu postulación. Intenta nuevamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <PantallaCarga />;
  if (errCodigo) return <PantallaError codigo={errCodigo} mensaje={errMensaje} />;
  if (enviado) return <PantallaExito titulo={data.titulo} />;

  const v = data;

  // ── Estilos compartidos ──
  const card = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18,
    boxShadow: '0 1px 3px rgba(17,24,39,0.04)',
  };
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: 10, padding: '11px 14px',
    fontSize: 14, color: '#111827',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: '#9ca3af',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  };
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        input:focus, textarea:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
        @media (max-width: 760px) {
          .postular-grid { grid-template-columns: 1fr !important; }
          .postular-g2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header con branding */}
      <header style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-brain" style={{ fontSize: 16, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827', letterSpacing: '0.06em' }}>MENTIS</span>
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>Portal de postulaciones</span>
        </div>
      </header>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 64px', display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease' }}>

        {/* ═══ SECCIÓN 1 — LA OFERTA ═══ */}
        <div style={{ ...card, padding: '32px 36px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {v.area && <Badge icon="ti-layout-grid" label={v.area} />}
            {v.modalidad && <Badge icon={MODALIDAD_ICON[v.modalidad] || 'ti-briefcase'} label={v.modalidad} />}
            {v.ciudad && <Badge icon="ti-map-pin" label={v.ciudad} />}
            {v.tipo_contrato && <Badge icon="ti-file-text" label={v.tipo_contrato} />}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            {v.titulo}
          </h1>

          {v.nivel && (
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>{v.nivel}</div>
          )}

          {v.horario && (
            <div style={{ fontSize: 13.5, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <i className="ti ti-clock" style={{ fontSize: 14 }} /> {v.horario}
            </div>
          )}

          {v.mostrar_salario && v.salario_minimo && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 14, padding: '8px 16px', borderRadius: 10,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              color: '#059669', fontSize: 14, fontWeight: 700,
            }}>
              <i className="ti ti-cash" style={{ fontSize: 16 }} />
              {v.moneda} {Number(v.salario_minimo).toLocaleString()} - {Number(v.salario_maximo).toLocaleString()}
            </div>
          )}

          {/* Descripción */}
          {v.descripcion && (
            <div style={{ marginTop: 28 }}>
              <div style={sectionLabel}><i className="ti ti-file-text" /> Sobre el puesto</div>
              <ListaItems texto={v.descripcion} />
            </div>
          )}

          {/* Requisitos */}
          {v.requisitos && (
            <div style={{ marginTop: 28 }}>
              <div style={sectionLabel}><i className="ti ti-checklist" /> Requisitos</div>
              <ListaItems texto={v.requisitos} />
            </div>
          )}

          {/* Requisitos deseables */}
          {v.requisitos_deseables && (
            <div style={{ marginTop: 28 }}>
              <div style={sectionLabel}><i className="ti ti-sparkles" /> Deseable (no excluyente)</div>
              <ListaItems texto={v.requisitos_deseables} />
            </div>
          )}

          {/* Beneficios */}
          {v.beneficios && (
            <div style={{ marginTop: 28 }}>
              <div style={sectionLabel}><i className="ti ti-gift" /> Beneficios</div>
              <ListaItems texto={v.beneficios} />
            </div>
          )}
        </div>

        {/* ═══ SECCIÓN 2 — FORMULARIO ═══ */}
        <div style={{ ...card, padding: '32px 36px' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Postula a esta vacante</h2>
            <p style={{ fontSize: 13.5, color: '#9ca3af', margin: 0 }}>Completa tus datos y adjunta tu CV. Te contactaremos por correo.</p>
          </div>

          {formError && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
              padding: '12px 16px', marginBottom: 18, color: '#dc2626', fontSize: 13,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="postular-g2" style={g2}>
              <Field label="Nombre" required>
                <input name="nombre" value={form.nombre} onChange={handleChange} required style={inp} placeholder="Juan" />
              </Field>
              <Field label="Apellido paterno" required>
                <input name="apellido_paterno" value={form.apellido_paterno} onChange={handleChange} required style={inp} placeholder="García" />
              </Field>
            </div>

            <div className="postular-g2" style={g2}>
              <Field label="Apellido materno">
                <input name="apellido_materno" value={form.apellido_materno} onChange={handleChange} style={inp} placeholder="López" />
              </Field>
              <Field label="Email" required>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={inp} placeholder="juan@email.com" />
              </Field>
            </div>

            <div className="postular-g2" style={g2}>
              <Field label="Teléfono">
                <input name="telefono" value={form.telefono} onChange={handleChange} style={inp} placeholder="+51 999 999 999" />
              </Field>
              <Field label="Ciudad">
                <input name="ciudad" value={form.ciudad} onChange={handleChange} style={inp} placeholder="Lima" />
              </Field>
            </div>

            <Field label="LinkedIn" hint="Opcional — si no lo completas, intentaremos detectarlo de tu CV automáticamente">
              <input name="linkedin" type="url" value={form.linkedin} onChange={handleChange} style={inp} placeholder="https://linkedin.com/in/..." />
            </Field>

            <div className="postular-g2" style={g2}>
              <Field label="Pretensión salarial" hint="Opcional">
                <input name="pretension_salarial" type="number" min={0} value={form.pretension_salarial} onChange={handleChange} style={inp} placeholder="3500" />
              </Field>
              <Field label="Disponibilidad" hint="Ej: Inmediata, 15 días">
                <input name="disponibilidad" value={form.disponibilidad} onChange={handleChange} style={inp} placeholder="Inmediata" />
              </Field>
            </div>

            {/* CV */}
            <Field label="Curriculum Vitae (PDF)" required>
              <div style={{
                border: `2px dashed ${cvFile ? '#a78bfa' : '#e5e7eb'}`,
                borderRadius: 12, padding: '22px 16px', textAlign: 'center',
                background: cvFile ? 'rgba(124,58,237,0.04)' : '#f9fafb',
                transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
              }}>
                <input type="file" accept=".pdf" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                {cvFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <i className="ti ti-file-type-pdf" style={{ fontSize: 24, color: '#7c3aed' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cvFile.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{(cvFile.size / 1024).toFixed(1)} KB — Haz clic para cambiar</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <i className="ti ti-upload" style={{ fontSize: 30, color: '#d1d5db', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>Arrastra tu CV aquí o haz clic para seleccionar</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Solo PDF — Máximo recomendado 5 MB</div>
                  </div>
                )}
              </div>
            </Field>

            {/* Confirmaciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {v.modalidad && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
                  <input type="checkbox" checked={aceptaModalidad} onChange={e => setAceptaModalidad(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                  Acepto la modalidad de trabajo <strong>{v.modalidad.toLowerCase()}</strong> de este puesto.
                </label>
              )}
              {v.ciudad && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
                  <input type="checkbox" checked={aceptaCiudad} onChange={e => setAceptaCiudad(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                  Confirmo disponibilidad para trabajar en <strong>{v.ciudad}</strong>.
                </label>
              )}
            </div>

            {/* Términos y condiciones */}
            <div style={{
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                <i className="ti ti-shield-check" style={{ fontSize: 16, color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Tratamiento de datos personales e IA</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 }}>
                    Tu CV y datos personales serán procesados por sistemas de inteligencia artificial para evaluar tu perfil y generar un análisis automático de tus habilidades, experiencia y compatibilidad con el puesto. Esta información será utilizada únicamente por el equipo de RRHH durante el proceso de selección y no será compartida con terceros. Tienes derecho a solicitar la eliminación de tus datos en cualquier momento escribiéndonos al correo de contacto.
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={e => setAceptaTerminos(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 2, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }}
                />
                Acepto el tratamiento de mis datos personales por sistemas de inteligencia artificial para fines de selección de personal. <strong style={{ color: '#dc2626' }}>*</strong>
              </label>
            </div>

            <button type="submit" disabled={enviando} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 0', borderRadius: 12, border: 'none', marginTop: 8,
              background: enviando ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: enviando ? 'wait' : 'pointer',
              boxShadow: enviando ? 'none' : '0 8px 24px rgba(124,58,237,0.25)',
            }}>
              {enviando && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              {enviando ? 'Enviando postulación...' : 'Postular ahora'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#d1d5db' }}>
          MENTIS · Reclutamiento con inteligencia artificial
        </div>
      </div>
    </div>
  );
}