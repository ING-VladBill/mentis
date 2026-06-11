import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import api from '../services/api';

const ESTADO_CFG = {
  registrado:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  cv_revisado:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
  en_evaluacion:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
  evaluado:        { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)'  },
  entrevista_ia:   { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)' },
  entrevista_rrhh: { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)'  },
  aprobado:        { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
  rechazado:       { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  contratado:      { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)' },
};

const ESTADO_LABEL = {
  registrado: 'Registrado', cv_revisado: 'CV Revisado',
  en_evaluacion: 'En Evaluación', evaluado: 'Evaluado',
  entrevista_ia: 'Entrevista IA', entrevista_rrhh: 'Entrevista RRHH',
  aprobado: 'Aprobado', rechazado: 'Rechazado', contratado: 'Contratado',
};

const NIVEL_EDU = {
  secundaria: 'Secundaria', tecnico: 'Técnico', universitario: 'Universitario',
  bachiller: 'Bachiller', maestria: 'Maestría', doctorado: 'Doctorado',
};

function Initials({ nombre, apellido }) {
  const n = (nombre?.[0] || '').toUpperCase();
  const a = (apellido?.[0] || '').toUpperCase();
  const colors = ['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const idx = ((nombre?.charCodeAt(0) || 0) + (apellido?.charCodeAt(0) || 0)) % colors.length;
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: `${colors[idx]}22`, border: `1.5px solid ${colors[idx]}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: colors[idx],
    }}>{n}{a}</div>
  );
}

export default function CandidatosList() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filtro, setFiltro]         = useState('todos');
  const [busqueda, setBusqueda]     = useState('');

  useEffect(() => { fetch(); }, []);

  async function fetch() {
    try {
      setLoading(true);
      const { data } = await api.get('/candidatos/');
      setCandidatos(data);
    } catch {
      setError('No se pudo conectar. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total:      candidatos.length,
    aprobados:  candidatos.filter(c => c.estado === 'aprobado' || c.estado === 'contratado').length,
    enProceso:  candidatos.filter(c => ['en_evaluacion','entrevista_ia','entrevista_rrhh','evaluado'].includes(c.estado)).length,
    rechazados: candidatos.filter(c => c.estado === 'rechazado').length,
  };

  const lista = candidatos
    .filter(c => filtro === 'todos' || c.estado === filtro)
    .filter(c => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        c.nombre?.toLowerCase().includes(q) ||
        c.apellido_paterno?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.vacante_detalle?.titulo?.toLowerCase().includes(q)
      );
    });

  const card = {
    background: t.card,
    border: `1px solid ${t.cardBorder}`,
    borderRadius: 12,
    transition: 'background 0.25s, border-color 0.25s',
  };

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
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total candidatos', value: stats.total,      icon: 'ti-users',         accent: '#7c3aed' },
          { label: 'Aprobados',        value: stats.aprobados,  icon: 'ti-circle-check',  accent: '#10b981' },
          { label: 'En proceso',       value: stats.enProceso,  icon: 'ti-loader',        accent: '#f59e0b' },
          { label: 'Rechazados',       value: stats.rechazados, icon: 'ti-circle-x',      accent: '#ef4444' },
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

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        {/* Filtros por estado */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['todos', 'registrado', 'en_evaluacion', 'aprobado', 'rechazado', 'contratado'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: '6px 13px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
              transition: 'all 0.15s',
              background: filtro === f ? '#7c3aed' : t.toggleBg,
              color: filtro === f ? '#fff' : t.textMuted,
            }}>
              {f === 'todos' ? `Todos (${stats.total})` : (ESTADO_LABEL[f] || f)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Búsqueda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '6px 12px' }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: t.textFaint }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar candidato..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.text, width: 180 }}
            />
          </div>
          {/* Registrar */}
          <button onClick={() => navigate('/candidatos/registrar')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 0 18px rgba(124,58,237,0.28)',
          }}>
            <i className="ti ti-user-plus" style={{ fontSize: 16 }} /> Registrar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {lista.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="ti ti-users-off" style={{ fontSize: 40, color: t.textFaint, display: 'block', marginBottom: 12 }} />
            <div style={{ color: t.textMuted, fontSize: 14 }}>
              {busqueda ? `Sin resultados para "${busqueda}".` : 'No hay candidatos registrados aún.'}
            </div>
            <button onClick={() => navigate('/candidatos/registrar')} style={{ marginTop: 14, background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Registrar primer candidato
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                {['Candidato', 'Documento', 'Vacante', 'Educación', 'Exp.', 'Estado', 'Score CV', 'Contacto'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((c, i) => {
                const est = ESTADO_CFG[c.estado] || ESTADO_CFG.registrado;
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < lista.length - 1 ? `1px solid ${t.cardBorder}` : 'none', transition: 'background 0.12s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Candidato */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Initials nombre={c.nombre} apellido={c.apellido_paterno} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>
                            {c.nombre} {c.apellido_paterno}
                          </div>
                          <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{c.ciudad}</div>
                        </div>
                      </div>
                    </td>

                    {/* Documento */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: t.textMuted, background: t.toggleBg, padding: '2px 7px', borderRadius: 5, display: 'inline-block' }}>
                        {c.tipo_documento?.toUpperCase()} {c.numero_documento}
                      </div>
                    </td>

                    {/* Vacante */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
                        {c.vacante_detalle?.titulo || `Vacante #${c.vacante}`}
                      </div>
                      {c.vacante_detalle?.codigo && (
                        <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{c.vacante_detalle.codigo}</div>
                      )}
                    </td>

                    {/* Educación */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: t.textMuted }}>
                      {NIVEL_EDU[c.nivel_educacion] || c.nivel_educacion}
                      {c.carrera && <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{c.carrera}</div>}
                    </td>

                    {/* Experiencia */}
                    <td style={{ padding: '13px 16px', fontSize: 13, color: t.textMuted, textAlign: 'center' }}>
                      {c.años_experiencia > 0 ? `${c.años_experiencia}a` : '—'}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 500,
                        background: est.bg, color: est.color, border: `1px solid ${est.border}`,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                        {ESTADO_LABEL[c.estado] || c.estado}
                      </span>
                    </td>

                    {/* Score CV */}
                    <td style={{ padding: '13px 16px' }}>
                      {c.score_cv != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.toggleBg, minWidth: 50 }}>
                            <div style={{ width: `${c.score_cv}%`, height: '100%', borderRadius: 2, background: c.score_cv >= 70 ? '#34d399' : c.score_cv >= 40 ? '#fbbf24' : '#f87171', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: c.score_cv >= 70 ? '#34d399' : c.score_cv >= 40 ? '#fbbf24' : '#f87171', minWidth: 28 }}>{c.score_cv}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: t.textFaint }}>Pendiente</span>
                      )}
                    </td>

                    {/* Contacto */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`mailto:${c.email}`} title={c.email} style={{ width: 28, height: 28, borderRadius: 7, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, textDecoration: 'none', transition: 'all 0.15s', fontSize: 14 }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}>
                          <i className="ti ti-mail" />
                        </a>
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noreferrer" title="LinkedIn" style={{ width: 28, height: 28, borderRadius: 7, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, textDecoration: 'none', transition: 'all 0.15s', fontSize: 14 }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}>
                            <i className="ti ti-brand-linkedin" />
                          </a>
                        )}
                        {c.github_url && (
                          <a href={c.github_url} target="_blank" rel="noreferrer" title="GitHub" style={{ width: 28, height: 28, borderRadius: 7, background: t.toggleBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, textDecoration: 'none', transition: 'all 0.15s', fontSize: 14 }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.cardBorder; }}>
                            <i className="ti ti-brand-github" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {lista.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: t.textFaint, textAlign: 'right' }}>
          Mostrando {lista.length} de {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}