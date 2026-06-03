import { useEffect, useState } from 'react';
import { useTheme } from '../App';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

// ─── Fuera del componente ─────────────────────────────────────────────────────

function Avatar({ nombre, apellidos }) {
  const n = (nombre?.[0] || '').toUpperCase();
  const a = (apellidos?.[0] || '').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const color = colors[((nombre?.charCodeAt(0) || 0) + (apellidos?.charCodeAt(0) || 0)) % colors.length];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color,
    }}>{n}{a}</div>
  );
}

const ROL_CFG = {
  admin:      { color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)', label: 'Administrador' },
  reclutador: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)', label: 'Reclutador'   },
  evaluador:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', label: 'Evaluador'    },
  gerente:    { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', label: 'Gerente'      },
};

function RolBadge({ rol }) {
  const cfg = ROL_CFG[rol] || ROL_CFG.reclutador;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>{cfg.label}</span>
  );
}

function ModalCrear({ t, onClose, onCreado }) {
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', password: '', rol: 'reclutador', area_responsable: '', telefono: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text,
    outline: 'none', fontFamily: 'inherit',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { data } = await api.post('/api/auth/usuarios/crear/', form);
      toast.success(`Usuario ${data.nombre} creado. Se le envió un correo con sus credenciales.`);
      onCreado(data);
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error al crear.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: '28px 26px', maxWidth: 480, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 20 }}>Nuevo usuario</div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#f87171', fontSize: 12.5 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['nombre','Nombre *','Juan'],['apellidos','Apellidos *','García López']].map(([name, label, ph]) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>{label}</label>
                <input name={name} value={form[name]} onChange={e => setForm(p => ({...p, [e.target.name]: e.target.value}))} required style={inp} placeholder={ph} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required style={inp} placeholder="juan@empresa.com" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Contraseña temporal *</label>
            <input name="password" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required style={inp} placeholder="Mínimo 8 caracteres" />
            <div style={{ fontSize: 11, color: t.textFaint, marginTop: 4 }}>El sistema enviará un correo al usuario con sus credenciales.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Rol *</label>
              <select name="rol" value={form.rol} onChange={e => setForm(p => ({...p, rol: e.target.value}))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="reclutador">Reclutador</option>
                <option value="evaluador">Evaluador</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={e => setForm(p => ({...p, telefono: e.target.value}))} style={inp} placeholder="+51 999 999 999" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Área responsable</label>
            <input name="area_responsable" value={form.area_responsable} onChange={e => setForm(p => ({...p, area_responsable: e.target.value}))} style={inp} placeholder="Tecnología, Marketing, etc." />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {saving && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Usuarios() {
  const { t } = useTheme();
  const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showCrear, setCrear]   = useState(false);
  const [confirm, setConfirm]   = useState(null);
  const [confirmLoading, setCL] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setLoading(true);
      const { data } = await api.get('/api/auth/usuarios/');
      setUsuarios(data);
    } catch {
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total:      usuarios.length,
    admins:     usuarios.filter(u => u.rol === 'admin').length,
    reclutadores: usuarios.filter(u => u.rol === 'reclutador').length,
    otros:      usuarios.filter(u => !['admin','reclutador'].includes(u.rol)).length,
  };

  const card = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12, transition: 'background 0.25s' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...card, padding: '14px 18px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 18 }} /> {error}
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Modales */}
      {showCrear && <ModalCrear t={t} onClose={() => setCrear(false)} onCreado={u => setUsuarios(prev => [...prev, u])} />}
      {confirm && <ConfirmModal {...confirm} loading={confirmLoading} onClose={() => { if (!confirmLoading) setConfirm(null); }} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total usuarios', value: stats.total,       icon: 'ti-users',        accent: '#7c3aed' },
          { label: 'Administradores', value: stats.admins,     icon: 'ti-shield-check', accent: '#a78bfa' },
          { label: 'Reclutadores',   value: stats.reclutadores,icon: 'ti-user-search',  accent: '#60a5fa' },
          { label: 'Otros roles',    value: stats.otros,       icon: 'ti-users-group',  accent: '#34d399' },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: `${accent}18`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${icon}`} style={{ fontSize: 20, color: accent }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: t.text, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => setCrear(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 18px rgba(124,58,237,0.28)' }}>
          <i className="ti ti-user-plus" style={{ fontSize: 16 }} /> Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
              {['Usuario', 'Email', 'Rol', 'Área', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => {
              const soyYo = u.email === usuarioActual.email;
              return (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < usuarios.length - 1 ? `1px solid ${t.cardBorder}` : 'none', transition: 'background 0.12s', opacity: u.is_active ? 1 : 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Usuario */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar nombre={u.nombre} apellidos={u.apellidos} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{u.nombre} {u.apellidos}</span>
                          {soyYo && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)', padding: '1px 7px', borderRadius: 4 }}>Tú</span>}
                          {!u.is_active && <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(107,114,128,0.12)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)', padding: '1px 7px', borderRadius: 4 }}>Inactivo</span>}
                        </div>
                        {u.telefono && <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>{u.telefono}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '13px 16px', fontSize: 13, color: t.textMuted }}>{u.email}</td>

                  {/* Rol */}
                  <td style={{ padding: '13px 16px' }}><RolBadge rol={u.rol} /></td>

                  {/* Área */}
                  <td style={{ padding: '13px 16px', fontSize: 13, color: t.textMuted }}>{u.area_responsable || '—'}</td>

                  {/* Estado */}
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: u.is_active ? 'rgba(52,211,153,0.1)' : 'rgba(107,114,128,0.1)',
                      color: u.is_active ? '#34d399' : '#6b7280',
                      border: u.is_active ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(107,114,128,0.2)',
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Cambiar contraseña — pendiente de backend */}
                      {!soyYo && (
                        <button
                          title="Cambiar contraseña"
                          onClick={() => setConfirm({
                            tipo: 'info',
                            icono: '🔒',
                            titulo: 'Función en desarrollo',
                            mensaje: 'El endpoint de cambio de contraseña aún no está disponible en el backend. William debe agregar POST /api/auth/usuarios/{id}/cambiar-password/ para habilitar esta función.',
                            labelOk: 'Entendido',
                            labelCancel: null,
                            onConfirm: () => setConfirm(null),
                          })}
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                        >
                          <i className="ti ti-key" />
                        </button>
                      )}

                      {/* Desactivar/activar — pendiente de backend */}
                      {!soyYo && (
                        <button
                          title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                          onClick={() => setConfirm({
                            tipo: 'info',
                            icono: '⚙️',
                            titulo: 'Función en desarrollo',
                            mensaje: `El endpoint de ${u.is_active ? 'desactivación' : 'activación'} de usuarios aún no está disponible en el backend. William debe agregar POST /api/auth/usuarios/{id}/${u.is_active ? 'desactivar' : 'activar'}/ para habilitar esta función.`,
                            labelOk: 'Entendido',
                            labelCancel: null,
                            onConfirm: () => setConfirm(null),
                          })}
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = u.is_active ? '#f87171' : '#34d399'; e.currentTarget.style.borderColor = u.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                        >
                          <i className={`ti ${u.is_active ? 'ti-user-off' : 'ti-user-check'}`} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {usuarios.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="ti ti-users-off" style={{ fontSize: 40, color: t.textFaint, display: 'block', marginBottom: 12 }} />
            <div style={{ color: t.textMuted, fontSize: 14 }}>No hay usuarios registrados.</div>
          </div>
        )}
      </div>

      {/* Nota sobre endpoints pendientes */}
      <div style={{ marginTop: 14, padding: '10px 16px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 12.5, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 15, flexShrink: 0 }} />
        Los botones de cambiar contraseña y desactivar usuario estarán activos cuando William agregue los endpoints correspondientes al backend.
      </div>
    </div>
  );
}