import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../App';
import api from '../services/api';

// ─── Íconos disponibles para selección visual ─────────────────────────────────
const ICONOS = [
  { nombre: 'monitor',        label: 'Tecnología'    },
  { nombre: 'users',          label: 'Personas'      },
  { nombre: 'briefcase',      label: 'Operaciones'   },
  { nombre: 'chart-bar',      label: 'Analítica'     },
  { nombre: 'currency-dollar',label: 'Finanzas'      },
  { nombre: 'building',       label: 'Administración'},
  { nombre: 'truck',          label: 'Logística'     },
  { nombre: 'shield-check',   label: 'Legal/Seg.'    },
  { nombre: 'shopping-cart',  label: 'Ventas'        },
  { nombre: 'headset',        label: 'Soporte'       },
  { nombre: 'target',         label: 'Marketing'     },
  { nombre: 'tool',           label: 'Mantenimiento' },
  { nombre: 'heart-handshake',label: 'Bienestar'     },
  { nombre: 'globe',          label: 'Internacional' },
  { nombre: 'package',        label: 'Supply Chain'  },
  { nombre: 'code',           label: 'Desarrollo'    },
  { nombre: 'paint',          label: 'Diseño'        },
  { nombre: 'robot',          label: 'IA / Automatiz.'},
  { nombre: 'school',         label: 'Capacitación'  },
  { nombre: 'calculator',     label: 'Contabilidad'  },
  { nombre: 'file-text',      label: 'Documentación' },
  { nombre: 'star',           label: 'Calidad'       },
  { nombre: 'phone',          label: 'Comunicaciones'},
  { nombre: 'home',           label: 'Instalaciones' },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
function AreaModal({ area, onClose, onSaved, t, dark }) {
  const isEdit = !!area?.id;
  const [form, setForm] = useState({
    nombre:       area?.nombre       || '',
    codigo_corto: area?.codigo_corto || '',
    descripcion:  area?.descripcion  || '',
    color:        area?.color        || '#7c3aed',
    icono:        area?.icono        || '',
    orden:        area?.orden        ?? 0,
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'codigo_corto' ? value.toUpperCase() : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/areas/${area.id}/`, form);
        toast.success('Área actualizada');
      } else {
        await api.post('/api/areas/', form);
        toast.success('Área creada');
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setErrors(data);
      } else {
        toast.error('Error al guardar el área');
      }
    } finally {
      setSaving(false);
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, color: t.text, fontSize: 13.5,
    outline: 'none', boxSizing: 'border-box',
    colorScheme: dark ? 'dark' : 'light',
  };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: t.textMuted, marginBottom: 5 };
  const err = { fontSize: 11.5, color: '#f87171', marginTop: 4 };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: t.card, border: `1px solid ${t.cardBorder}`,
        borderRadius: 16, width: '100%', maxWidth: 530,
        padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: t.text, margin: 0 }}>
            {isEdit ? 'Editar área' : 'Nueva área'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: t.textMuted, padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Nombre *</label>
            <input
              name="nombre" value={form.nombre} onChange={handleChange}
              style={{ ...inp, borderColor: errors.nombre ? '#f87171' : t.inputBorder }}
              placeholder="Ej: Tecnología de la Información"
            />
            {errors.nombre && <div style={err}>{Array.isArray(errors.nombre) ? errors.nombre[0] : errors.nombre}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {/* Código corto */}
            <div>
              <label style={lbl}>Código corto *</label>
              <input
                name="codigo_corto" value={form.codigo_corto} onChange={handleChange}
                style={{ ...inp, borderColor: errors.codigo_corto ? '#f87171' : t.inputBorder }}
                placeholder="Ej: TI"
                maxLength={10}
              />
              {errors.codigo_corto && <div style={err}>{Array.isArray(errors.codigo_corto) ? errors.codigo_corto[0] : errors.codigo_corto}</div>}
            </div>

            {/* Orden */}
            <div>
              <label style={lbl}>Orden</label>
              <input
                name="orden" type="number" value={form.orden} onChange={handleChange}
                style={inp} min={0}
              />
            </div>

            {/* Ícono */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Ícono</label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6,
                padding: 10, borderRadius: 8,
                background: t.inputBg, border: `1px solid ${t.inputBorder}`,
              }}>
                {ICONOS.map(ic => (
                  <button
                    key={ic.nombre}
                    type="button"
                    title={ic.label}
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setForm(f => ({ ...f, icono: ic.nombre })); }}
                    style={{
                      width: '100%', aspectRatio: '1',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 3, padding: 0, borderRadius: 7, cursor: 'pointer',
                      border: form.icono === ic.nombre
                        ? `2px solid ${form.color || '#7c3aed'}`
                        : `2px solid transparent`,
                      background: form.icono === ic.nombre
                        ? `${form.color || '#7c3aed'}18`
                        : 'transparent',
                      transition: 'all 0.15s',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      if (form.icono !== ic.nombre) e.currentTarget.style.background = t.rowHover;
                    }}
                    onMouseLeave={e => {
                      if (form.icono !== ic.nombre) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <i
                      className={`ti ti-${ic.nombre}`}
                      style={{
                        fontSize: 20,
                        color: form.icono === ic.nombre ? (form.color || '#7c3aed') : t.textMuted,
                      }}
                    />
                    <span style={{
                      fontSize: 8.5, color: t.textFaint, textAlign: 'center',
                      lineHeight: 1.1, width: '100%', padding: '0 2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ic.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.icono && <div style={err}>{Array.isArray(errors.icono) ? errors.icono[0] : errors.icono}</div>}
            </div>

            {/* Color */}
            <div>
              <label style={lbl}>Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  name="color" type="color" value={form.color} onChange={handleChange}
                  style={{
                    width: 40, height: 38, padding: 2, cursor: 'pointer', flexShrink: 0,
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8,
                  }}
                />
                <input
                  name="color" value={form.color} onChange={handleChange}
                  style={{ ...inp }} placeholder="#2E75B6" maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>Descripción</label>
            <textarea
              name="descripcion" value={form.descripcion} onChange={handleChange}
              style={{ ...inp, resize: 'vertical', minHeight: 72 }}
              placeholder="Descripción opcional del área"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: 8,
              background: t.toggleBg, border: `1px solid ${t.cardBorder}`,
              color: t.textMuted, fontSize: 13.5, cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{
              padding: '9px 22px', borderRadius: 8,
              background: saving ? 'rgba(124,58,237,0.5)' : '#7c3aed',
              border: 'none', color: '#fff',
              fontSize: 13.5, fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear área')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Areas() {
  const { t, dark } = useTheme();
  const [areas,      setAreas]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editArea,   setEditArea]   = useState(null);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/areas/');
      setAreas(data.results || data);
    } catch {
      toast.error('Error al cargar las áreas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  function openCreate() { setEditArea(null); setModalOpen(true); }
  function openEdit(area) { setEditArea(area); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditArea(null); }
  function onSaved() { closeModal(); fetchAreas(); }

  async function handleToggle(area) {
    if (area.activa) {
      if (!window.confirm(`¿Desactivar el área "${area.nombre}"?`)) return;
      try {
        await api.post(`/api/areas/${area.id}/desactivar/`);
        toast.success('Área desactivada');
        fetchAreas();
      } catch (err) {
        const msg = err.response?.data?.detail || err.response?.data?.error || 'No se pudo desactivar el área';
        toast.error(msg);
      }
    } else {
      try {
        await api.post(`/api/areas/${area.id}/activar/`);
        toast.success('Área activada');
        fetchAreas();
      } catch (err) {
        const msg = err.response?.data?.detail || err.response?.data?.error || 'No se pudo activar el área';
        toast.error(msg);
      }
    }
  }

  async function handleDelete(area) {
    if (!window.confirm(`¿Eliminar el área "${area.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/api/areas/${area.id}/`);
      toast.success('Área eliminada');
      fetchAreas();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'No se puede eliminar esta área';
      toast.error(msg);
    }
  }

  const total      = areas.length;
  const activas    = areas.filter(a => a.activa).length;
  const inactivas  = areas.filter(a => !a.activa).length;
  const conVac     = areas.filter(a => (a.vacantes_abiertas ?? 0) > 0).length;

  const STATS = [
    { label: 'Total áreas',      value: total,     icon: 'ti-layout-grid',   color: '#7c3aed' },
    { label: 'Activas',          value: activas,   icon: 'ti-circle-check',  color: '#34d399' },
    { label: 'Inactivas',        value: inactivas, icon: 'ti-circle-x',      color: '#9ca3af' },
    { label: 'Con vacantes',     value: conVac,    icon: 'ti-briefcase',     color: '#f59e0b' },
  ];

  const card = {
    background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12,
  };

  const actionBtn = {
    width: 30, height: 30, borderRadius: 7,
    background: 'transparent', border: `1px solid ${t.cardBorder}`,
    cursor: 'pointer', color: t.textMuted,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>Gestión de Áreas</h1>
          <p style={{ fontSize: 13, color: t.textMuted, margin: '4px 0 0' }}>Administra las áreas del sistema</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 10,
            background: '#7c3aed', border: 'none',
            color: '#fff', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 16 }} />
          Nueva área
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ ...card, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${s.color}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{s.value}</div>
                <div style={{ fontSize: 12, color: t.textMuted }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: t.textMuted }}>
            <i className="ti ti-loader-2" style={{ fontSize: 30, marginBottom: 10, display: 'block' }} />
            Cargando áreas...
          </div>
        ) : areas.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: t.textMuted }}>
            <i className="ti ti-layout-grid-off" style={{ fontSize: 36, marginBottom: 10, display: 'block' }} />
            No hay áreas registradas
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                {['Área', 'Código', 'Nombre', 'Vacantes totales', 'Vacantes abiertas', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '13px 16px', textAlign: 'left',
                    fontSize: 11.5, fontWeight: 600, color: t.textMuted,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map(area => (
                <tr
                  key={area.id}
                  style={{ borderBottom: `1px solid ${t.divider}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Ícono */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: area.color || '#7c3aed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ti ti-${area.icono || 'layout-grid'}`} style={{ fontSize: 17, color: '#fff' }} />
                    </div>
                  </td>

                  {/* Código */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.07em',
                      color: area.color || '#7c3aed',
                      background: `${area.color || '#7c3aed'}18`,
                      padding: '3px 9px', borderRadius: 5,
                    }}>{area.codigo_corto}</span>
                  </td>

                  {/* Nombre */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>{area.nombre}</div>
                    {area.descripcion && (
                      <div style={{
                        fontSize: 11.5, color: t.textMuted, marginTop: 2,
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{area.descripcion}</div>
                    )}
                  </td>

                  {/* Total vacantes */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: 13.5, color: t.text }}>{area.total_vacantes ?? 0}</span>
                  </td>

                  {/* Vacantes abiertas */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {(area.vacantes_abiertas ?? 0) > 0 ? (
                      <span style={{
                        fontSize: 12.5, fontWeight: 600, color: '#f59e0b',
                        background: '#f59e0b18', padding: '3px 9px', borderRadius: 5,
                      }}>{area.vacantes_abiertas}</span>
                    ) : (
                      <span style={{ fontSize: 13.5, color: t.textFaint }}>0</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
                        background: area.activa ? '#34d39918' : 'rgba(156,163,175,0.15)',
                        color: area.activa ? '#34d399' : '#9ca3af',
                      }}>
                        {area.activa ? 'Activa' : 'Inactiva'}
                      </span>
                      {area.es_predefinida && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                          background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                        }}>Sistema</span>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {/* Editar */}
                      <button
                        onClick={() => openEdit(area)}
                        title="Editar"
                        style={actionBtn}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                      >
                        <i className="ti ti-pencil" style={{ fontSize: 14 }} />
                      </button>

                      {/* Activar / Desactivar */}
                      <button
                        onClick={() => handleToggle(area)}
                        title={area.activa ? 'Desactivar' : 'Activar'}
                        style={actionBtn}
                        onMouseEnter={e => {
                          const c = area.activa ? '#f59e0b' : '#34d399';
                          e.currentTarget.style.background = `${c}18`;
                          e.currentTarget.style.color = c;
                          e.currentTarget.style.borderColor = `${c}44`;
                        }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                      >
                        <i className={`ti ${area.activa ? 'ti-toggle-right' : 'ti-toggle-left'}`} style={{ fontSize: 14 }} />
                      </button>

                      {/* Eliminar — solo si no es predefinida */}
                      {!area.es_predefinida && (
                        <button
                          onClick={() => handleDelete(area)}
                          title="Eliminar"
                          style={actionBtn}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                        >
                          <i className="ti ti-trash" style={{ fontSize: 14 }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <AreaModal
          area={editArea}
          onClose={closeModal}
          onSaved={onSaved}
          t={t}
          dark={dark}
        />
      )}
    </div>
  );
}
