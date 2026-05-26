import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../App';
import api from '../services/api';

// ─── Configuración de roles ───────────────────────────────────────────────────
const ROL = {
  admin:      { label: 'Admin',      color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  reclutador: { label: 'Reclutador', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  evaluador:  { label: 'Evaluador',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  gerente:    { label: 'Gerente',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

// ─── Avatar con iniciales ─────────────────────────────────────────────────────
function Avatar({ nombre, apellidos, size = 36 }) {
  const partes = `${nombre || ''} ${apellidos || ''}`.trim().split(/\s+/);
  const iniciales = partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : (partes[0]?.[0] || '?').toUpperCase();
  const colors = ['#7c3aed', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  const color = colors[(nombre?.charCodeAt(0) || 0) % colors.length];

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color, userSelect: 'none',
    }}>
      {iniciales}
    </div>
  );
}

// ─── Modal crear usuario ──────────────────────────────────────────────────────
function UsuarioModal({ onClose, onCreado, t, dark }) {
  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '', password: '',
    rol: 'reclutador', area_responsable: '', telefono: '',
  });
  const [areas,   setAreas]   = useState([]);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/api/areas/activas/').then(r => setAreas(r.data || [])).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.area_responsable) delete payload.area_responsable;
      if (!payload.telefono)         delete payload.telefono;
      await api.post('/api/auth/usuarios/crear/', payload);
      toast.success('Usuario creado correctamente');
      onCreado();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setErrors(data);
      } else {
        toast.error('Error al crear el usuario');
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
        borderRadius: 16, width: '100%', maxWidth: 520,
        padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: t.text, margin: 0 }}>Nuevo usuario</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: t.textMuted, padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Nombre */}
            <div>
              <label style={lbl}>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange}
                style={{ ...inp, borderColor: errors.nombre ? '#f87171' : t.inputBorder }}
                placeholder="Juan" />
              {errors.nombre && <div style={err}>{Array.isArray(errors.nombre) ? errors.nombre[0] : errors.nombre}</div>}
            </div>

            {/* Apellidos */}
            <div>
              <label style={lbl}>Apellidos *</label>
              <input name="apellidos" value={form.apellidos} onChange={handleChange}
                style={{ ...inp, borderColor: errors.apellidos ? '#f87171' : t.inputBorder }}
                placeholder="Pérez García" />
              {errors.apellidos && <div style={err}>{Array.isArray(errors.apellidos) ? errors.apellidos[0] : errors.apellidos}</div>}
            </div>

            {/* Email */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                style={{ ...inp, borderColor: errors.email ? '#f87171' : t.inputBorder }}
                placeholder="juan.perez@empresa.com" />
              {errors.email && <div style={err}>{Array.isArray(errors.email) ? errors.email[0] : errors.email}</div>}
            </div>

            {/* Password */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Contraseña *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                style={{ ...inp, borderColor: errors.password ? '#f87171' : t.inputBorder }}
                placeholder="Mínimo 8 caracteres" />
              {errors.password && <div style={err}>{Array.isArray(errors.password) ? errors.password[0] : errors.password}</div>}
            </div>

            {/* Rol */}
            <div>
              <label style={lbl}>Rol *</label>
              <select name="rol" value={form.rol} onChange={handleChange}
                style={{ ...inp, borderColor: errors.rol ? '#f87171' : t.inputBorder }}>
                {Object.entries(ROL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              {errors.rol && <div style={err}>{Array.isArray(errors.rol) ? errors.rol[0] : errors.rol}</div>}
            </div>

            {/* Área responsable */}
            <div>
              <label style={lbl}>Área responsable</label>
              <select name="area_responsable" value={form.area_responsable} onChange={handleChange}
                style={inp}>
                <option value="">Sin área</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Teléfono */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange}
                style={inp} placeholder="+51 999 999 999" />
            </div>
          </div>

          {/* Vista previa del badge de rol */}
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 9,
            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar nombre={form.nombre} apellidos={form.apellidos} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                {form.nombre || form.apellidos ? `${form.nombre} ${form.apellidos}`.trim() : 'Nombre del usuario'}
              </div>
              <div style={{ fontSize: 11.5, color: t.textMuted }}>{form.email || 'email@empresa.com'}</div>
            </div>
            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
              background: ROL[form.rol]?.bg, color: ROL[form.rol]?.color,
            }}>{ROL[form.rol]?.label}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
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
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal editar usuario ─────────────────────────────────────────────────────
function EditUsuarioModal({ usuario, onClose, onGuardado, t, dark }) {
  const [form, setForm] = useState({
    nombre:           usuario.nombre           || '',
    apellidos:        usuario.apellidos        || '',
    email:            usuario.email            || '',
    rol:              usuario.rol              || 'reclutador',
    area_responsable: usuario.area_responsable?.id ?? usuario.area_responsable ?? '',
    telefono:         usuario.telefono         || '',
  });
  const [areas,  setAreas]  = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/areas/activas/').then(r => setAreas(r.data || [])).catch(() => {});
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.area_responsable) delete payload.area_responsable;
      if (!payload.telefono)         delete payload.telefono;
      await api.put(`/api/auth/usuarios/${usuario.id}/`, payload);
      toast.success('Usuario actualizado correctamente');
      onGuardado();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setErrors(data);
      } else {
        toast.error('Error al actualizar el usuario');
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
        borderRadius: 16, width: '100%', maxWidth: 520,
        padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: t.text, margin: 0 }}>Editar usuario</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: t.textMuted, padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <i className="ti ti-x" style={{ fontSize: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange}
                style={{ ...inp, borderColor: errors.nombre ? '#f87171' : t.inputBorder }}
                placeholder="Juan" />
              {errors.nombre && <div style={err}>{Array.isArray(errors.nombre) ? errors.nombre[0] : errors.nombre}</div>}
            </div>

            <div>
              <label style={lbl}>Apellidos *</label>
              <input name="apellidos" value={form.apellidos} onChange={handleChange}
                style={{ ...inp, borderColor: errors.apellidos ? '#f87171' : t.inputBorder }}
                placeholder="Pérez García" />
              {errors.apellidos && <div style={err}>{Array.isArray(errors.apellidos) ? errors.apellidos[0] : errors.apellidos}</div>}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                style={{ ...inp, borderColor: errors.email ? '#f87171' : t.inputBorder }}
                placeholder="juan.perez@empresa.com" />
              {errors.email && <div style={err}>{Array.isArray(errors.email) ? errors.email[0] : errors.email}</div>}
            </div>

            <div>
              <label style={lbl}>Rol *</label>
              <select name="rol" value={form.rol} onChange={handleChange}
                style={{ ...inp, borderColor: errors.rol ? '#f87171' : t.inputBorder }}>
                {Object.entries(ROL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              {errors.rol && <div style={err}>{Array.isArray(errors.rol) ? errors.rol[0] : errors.rol}</div>}
            </div>

            <div>
              <label style={lbl}>Área responsable</label>
              <select name="area_responsable" value={form.area_responsable} onChange={handleChange} style={inp}>
                <option value="">Sin área</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange}
                style={inp} placeholder="+51 999 999 999" />
            </div>
          </div>

          {/* Vista previa */}
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 9,
            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar nombre={form.nombre} apellidos={form.apellidos} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                {`${form.nombre} ${form.apellidos}`.trim() || 'Nombre del usuario'}
              </div>
              <div style={{ fontSize: 11.5, color: t.textMuted }}>{form.email || 'email@empresa.com'}</div>
            </div>
            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
              background: ROL[form.rol]?.bg, color: ROL[form.rol]?.color,
            }}>{ROL[form.rol]?.label}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
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
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Usuarios() {
  const { t, dark } = useTheme();
  const [usuarios,     setUsuarios]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editUsuario,  setEditUsuario]  = useState(null);

  const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/auth/usuarios/');
      setUsuarios(data.results || data);
    } catch {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  function onCreado()   { setModalOpen(false); fetchUsuarios(); }
  function onGuardado() { setEditUsuario(null); fetchUsuarios(); }

  const total      = usuarios.length;
  const admins     = usuarios.filter(u => u.rol === 'admin').length;
  const reclut     = usuarios.filter(u => u.rol === 'reclutador').length;
  const otros      = usuarios.filter(u => u.rol === 'evaluador' || u.rol === 'gerente').length;

  const STATS = [
    { label: 'Total usuarios',      value: total,   icon: 'ti-users',        color: '#7c3aed' },
    { label: 'Admins',              value: admins,  icon: 'ti-shield-check', color: '#7c3aed' },
    { label: 'Reclutadores',        value: reclut,  icon: 'ti-search',       color: '#3b82f6' },
    { label: 'Evaluadores/Gerentes',value: otros,   icon: 'ti-star',         color: '#10b981' },
  ];

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>Gestión de Usuarios</h1>
          <p style={{ fontSize: 13, color: t.textMuted, margin: '4px 0 0' }}>Administra el equipo de RRHH</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 10,
            background: '#7c3aed', border: 'none',
            color: '#fff', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <i className="ti ti-user-plus" style={{ fontSize: 16 }} />
          Nuevo usuario
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
            Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: t.textMuted }}>
            <i className="ti ti-users-group" style={{ fontSize: 36, marginBottom: 10, display: 'block' }} />
            No hay usuarios registrados
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                {['Usuario', 'Email', 'Rol', 'Área responsable', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '13px 16px', textAlign: 'left',
                    fontSize: 11.5, fontWeight: 600, color: t.textMuted,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const rolCfg = ROL[u.rol] || { label: u.rol, color: t.textMuted, bg: t.toggleBg };
                const esSelf = u.email === usuarioActual.email;
                return (
                  <tr
                    key={u.id}
                    style={{ borderBottom: `1px solid ${t.divider}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Avatar + Nombre */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar nombre={u.nombre} apellidos={u.apellidos} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>
                              {u.nombre_completo || `${u.nombre} ${u.apellidos}`.trim()}
                            </span>
                            {esSelf && (
                              <span style={{
                                fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
                              }}>Tú</span>
                            )}
                          </div>
                          {u.telefono && (
                            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>{u.telefono}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, color: t.textMuted }}>{u.email}</span>
                    </td>

                    {/* Rol */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
                        background: rolCfg.bg, color: rolCfg.color,
                      }}>{rolCfg.label}</span>
                    </td>

                    {/* Área responsable */}
                    <td style={{ padding: '12px 16px' }}>
                      {u.area_responsable_nombre || u.area_responsable?.nombre ? (
                        <span style={{ fontSize: 13, color: t.text }}>
                          {u.area_responsable_nombre || u.area_responsable?.nombre}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12.5, color: t.textFaint }}>—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
                        background: u.is_active ? '#34d39918' : 'rgba(156,163,175,0.15)',
                        color: u.is_active ? '#34d399' : '#9ca3af',
                      }}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setEditUsuario(u)}
                        title="Editar usuario"
                        style={{
                          width: 30, height: 30, borderRadius: 7,
                          background: 'transparent', border: `1px solid ${t.cardBorder}`,
                          cursor: 'pointer', color: t.textMuted,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                      >
                        <i className="ti ti-pencil" style={{ fontSize: 14 }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear */}
      {modalOpen && (
        <UsuarioModal
          onClose={() => setModalOpen(false)}
          onCreado={onCreado}
          t={t}
          dark={dark}
        />
      )}

      {/* Modal editar */}
      {editUsuario && (
        <EditUsuarioModal
          usuario={editUsuario}
          onClose={() => setEditUsuario(null)}
          onGuardado={onGuardado}
          t={t}
          dark={dark}
        />
      )}
    </div>
  );
}
