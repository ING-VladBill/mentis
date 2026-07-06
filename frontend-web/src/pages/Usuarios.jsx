import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../ThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { qk } from '../lib/queryKeys';
import ConfirmModal from '../components/ConfirmModal';

// ─── Fuera del componente ─────────────────────────────────────────────────────

function Avatar({ nombre, apellidos }) {
  const n = (nombre?.[0] || '').toUpperCase();
  const a = (apellidos?.[0] || '').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const color = colors[((nombre?.charCodeAt(0) || 0) + (apellidos?.charCodeAt(0) || 0)) % colors.length];
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${color}22`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>
      {n}{a}
    </div>
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
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
}

function ModalCrear({ t, onClose, onCreado }) {
  const [form, setForm] = useState({
    nombre: '', apellidos: '', email: '',
    rol: 'reclutador', telefono: '+51 ',
  });
  const [areas, setAreas]   = useState([]);
  const [saving, setSave]   = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.get('/api/areas/').then(r => setAreas(r.data.results || r.data)).catch(() => {});
  }, []);

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text, outline: 'none', fontFamily: 'inherit',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSave(true);
    try {
      const { data } = await api.post('/api/auth/usuarios/crear/', form);
      toast.success(`Usuario ${data.nombre} creado. Se envió correo con credenciales.`);
      onCreado(data);
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Error al crear.');
    } finally { setSave(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: '28px 26px', maxWidth: 480, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 20 }}>Nuevo usuario</div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#f87171', fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Nombre y apellidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['nombre','Nombre *','Juan'],['apellidos','Apellidos *','García']].map(([name,label,ph]) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>{label}</label>
                <input
                  name={name} value={form[name]}
                  onChange={e => setForm(p => ({...p, [e.target.name]: e.target.value}))}
                  required style={inp} placeholder={ph}
                />
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Email *</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm(p => ({...p, email: e.target.value}))}
              required style={inp} placeholder="juan@empresa.com"
            />
          </div>

          {/* Aviso auto-contraseña */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', fontSize: 12.5, color: t.textMuted }}>
            <i className="ti ti-lock" style={{ fontSize: 15, color: '#a78bfa', marginTop: 1, flexShrink: 0 }} />
            El sistema generará una contraseña segura automáticamente y la enviará al correo del usuario.
          </div>

          {/* Rol y teléfono */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Rol *</label>
              <select
                value={form.rol}
                onChange={e => setForm(p => ({...p, rol: e.target.value}))}
                style={{ ...inp, cursor: 'pointer' }}
              >
                <option value="reclutador">Reclutador</option>
                <option value="evaluador">Evaluador</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Teléfono</label>
              <input
                value={form.telefono}
                onChange={e => {
                  const val = e.target.value;
                  // No permite borrar el prefijo +51
                  if (!val.startsWith('+51 ')) return;
                  setForm(p => ({...p, telefono: val}));
                }}
                style={inp}
                placeholder="+51 999 999 999"
              />
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              {saving && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal cambiar contraseña (sin cambios — minLength 6 está correcto aquí) ──
function ModalPassword({ t, usuario, onClose }) {
  const [pwd, setPwd]     = useState('');
  const [saving, setSave] = useState(false);
  const [error, setError] = useState(null);

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: t.text, outline: 'none', fontFamily: 'inherit',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setSave(true);
    try {
      const { data } = await api.post(`/api/auth/usuarios/${usuario.id}/cambiar-password/`, { password_nuevo: pwd });
      toast.success(data.mensaje || 'Contraseña actualizada.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña.');
    } finally { setSave(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: '28px 26px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 6 }}>Cambiar contraseña</div>
        <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 20 }}>
          Nueva contraseña para <strong style={{ color: t.text }}>{usuario.nombre} {usuario.apellidos}</strong>
        </div>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#f87171', fontSize: 12.5 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: t.textMuted, marginBottom: 5 }}>Nueva contraseña *</label>
            <input
              type="password" value={pwd}
              onChange={e => setPwd(e.target.value)}
              required style={inp}
              placeholder="Mínimo 6 caracteres"
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 13.5, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              {saving && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              {saving ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Usuarios() {
  const { t } = useTheme();
  const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

  const queryClient = useQueryClient();
  const [showCrear, setCrear]      = useState(false);
  const [modalPwd, setModalPwd]    = useState(null);
  const [confirm, setConfirm]      = useState(null);
  const [confirmLoad, setConfLoad] = useState(false);

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: qk.usuarios.all,
    queryFn: async () => {
      const { data } = await api.get('/api/auth/usuarios/');
      return data;
    },
  });
  const usuarios = data || [];
  const error = isError ? 'No se pudo cargar la lista de usuarios.' : null;

  // Actualiza el cache directamente (mismo patrón que antes con setUsuarios)
  function setUsuarios(updater) {
    queryClient.setQueryData(qk.usuarios.all, updater);
  }

  function pedirReenviarCredenciales(u) {
    setConfirm({
      tipo: 'warning',
      icono: '📧',
      titulo: 'Reenviar credenciales',
      mensaje: `¿Reenviar correo a ${u.nombre} ${u.apellidos}? Se generará una nueva contraseña temporal y se enviará a ${u.email}. La contraseña anterior dejará de funcionar.`,
      labelOk: 'Reenviar',
      onConfirm: async () => {
        setConfLoad(true);
        try {
          const { data } = await api.post(`/api/auth/usuarios/${u.id}/reenviar-credenciales/`);
          toast.success(data.mensaje || 'Correo reenviado.');
          setConfirm(null);
        } catch (err) {
          toast.error(err.response?.data?.error || 'Error al reenviar.');
        } finally { setConfLoad(false); }
      },
    });
  }

  function pedirDesactivar(u) {
    setConfirm({
      tipo: 'warning',
      icono: '⛔',
      titulo: 'Desactivar usuario',
      mensaje: `¿Desactivar a ${u.nombre} ${u.apellidos}? Perderá acceso al sistema inmediatamente. Puedes reactivarlo después.`,
      labelOk: 'Desactivar',
      onConfirm: async () => {
        setConfLoad(true);
        try {
          const { data } = await api.post(`/api/auth/usuarios/${u.id}/desactivar/`);
          setUsuarios(prev => prev.map(x => x.id === u.id ? data.usuario : x));
          toast.success(data.mensaje);
          setConfirm(null);
        } catch (err) {
          toast.error(err.response?.data?.error || 'Error al desactivar.');
        } finally { setConfLoad(false); }
      },
    });
  }

  function pedirActivar(u) {
    setConfirm({
      tipo: 'success',
      icono: '✅',
      titulo: 'Activar usuario',
      mensaje: `¿Reactivar a ${u.nombre} ${u.apellidos}? Podrá volver a iniciar sesión.`,
      labelOk: 'Activar',
      onConfirm: async () => {
        setConfLoad(true);
        try {
          const { data } = await api.post(`/api/auth/usuarios/${u.id}/activar/`);
          setUsuarios(prev => prev.map(x => x.id === u.id ? data.usuario : x));
          toast.success(data.mensaje);
          setConfirm(null);
        } catch (err) {
          toast.error(err.response?.data?.error || 'Error al activar.');
        } finally { setConfLoad(false); }
      },
    });
  }

  const stats = {
    total:     usuarios.length,
    activos:   usuarios.filter(u => u.is_active).length,
    inactivos: usuarios.filter(u => !u.is_active).length,
    admins:    usuarios.filter(u => u.rol === 'admin').length,
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

      {showCrear && <ModalCrear t={t} onClose={() => setCrear(false)} onCreado={u => setUsuarios(p => [...p, u])} />}
      {modalPwd  && <ModalPassword t={t} usuario={modalPwd} onClose={() => setModalPwd(null)} />}
      {confirm   && <ConfirmModal {...confirm} loading={confirmLoad} onClose={() => { if (!confirmLoad) setConfirm(null); }} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total usuarios',  value: stats.total,     icon: 'ti-users',        accent: '#7c3aed' },
          { label: 'Activos',         value: stats.activos,   icon: 'ti-circle-check', accent: '#10b981' },
          { label: 'Inactivos',       value: stats.inactivos, icon: 'ti-circle-x',     accent: '#6b7280' },
          { label: 'Administradores', value: stats.admins,    icon: 'ti-shield-check', accent: '#a78bfa' },
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

      {/* Botón nuevo usuario */}
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
              {['Usuario', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
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
                  style={{ borderBottom: i < usuarios.length - 1 ? `1px solid ${t.cardBorder}` : 'none', transition: 'background 0.12s', opacity: u.is_active ? 1 : 0.6 }}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar nombre={u.nombre} apellidos={u.apellidos} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{u.nombre} {u.apellidos}</span>
                          {soyYo && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)', padding: '1px 7px', borderRadius: 4 }}>Tú</span>}
                          {!u.is_active && <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(107,114,128,0.1)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)', padding: '1px 7px', borderRadius: 4 }}>Inactivo</span>}
                        </div>
                        {u.telefono && <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>{u.telefono}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: t.textMuted }}>{u.email}</td>
                  <td style={{ padding: '13px 16px' }}><RolBadge rol={u.rol} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: u.is_active ? 'rgba(52,211,153,0.1)' : 'rgba(107,114,128,0.1)', color: u.is_active ? '#34d399' : '#6b7280', border: u.is_active ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(107,114,128,0.2)' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {!soyYo && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Reenviar credenciales */}
                        <button
                          onClick={() => pedirReenviarCredenciales(u)}
                          title="Reenviar credenciales por correo"
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                        >
                          <i className="ti ti-mail-forward" />
                        </button>

                        {/* Cambiar contraseña */}
                        <button
                          onClick={() => setModalPwd(u)}
                          title="Cambiar contraseña"
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}
                        >
                          <i className="ti ti-key" />
                        </button>

                        {/* Desactivar / Activar */}
                        {u.is_active ? (
                          <button
                            onClick={() => pedirDesactivar(u)}
                            title="Desactivar usuario"
                            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.07)', color: 'rgba(248,113,113,0.6)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(248,113,113,0.6)'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
                          >
                            <i className="ti ti-user-off" />
                          </button>
                        ) : (
                          <button
                            onClick={() => pedirActivar(u)}
                            title="Activar usuario"
                            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.07)', color: 'rgba(52,211,153,0.6)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#34d399'; e.currentTarget.style.background = 'rgba(52,211,153,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(52,211,153,0.6)'; e.currentTarget.style.background = 'rgba(52,211,153,0.07)'; }}
                          >
                            <i className="ti ti-user-check" />
                          </button>
                        )}
                      </div>
                    )}
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
    </div>
  );
}