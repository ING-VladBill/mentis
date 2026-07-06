// ==========================================
// frontend-web/src/pages/BancoTalento.jsx
// Banco de talento: candidatos destacados guardados para futuras vacantes.
// Filtros por score mínimo, habilidad y área. Toggle con estrella.
// ==========================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

export default function BancoTalento() {
  const { t } = useTheme();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [scoreMin, setScoreMin] = useState('');
  const [habilidad, setHabilidad] = useState('');
  const [areaId, setAreaId] = useState('');

  const filtros = { scoreMin, habilidad: habilidad.trim(), areaId };

  const { data, isLoading: loading } = useQuery({
    queryKey: qk.candidatos.bancoTalento(filtros),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.scoreMin)  params.set('score_min', filtros.scoreMin);
      if (filtros.habilidad) params.set('habilidad', filtros.habilidad);
      if (filtros.areaId)    params.set('area_id', filtros.areaId);
      const { data } = await api.get(`/api/candidatos/banco-talento/?${params.toString()}`);
      return data.candidatos || data || [];
    },
  });
  const candidatos = data || [];

  const { data: areasData } = useQuery({
    queryKey: qk.areas.all,
    queryFn: async () => {
      const { data } = await api.get('/api/areas/');
      return data.results || data || [];
    },
  });
  const areas = areasData || [];

  const quitarMutation = useMutation({
    mutationFn: (c) => api.post(`/api/candidatos/${c.id}/banco-talento/`),
    onSuccess: (_res, c) => {
      toast.success(`${c.nombre_completo} retirado del banco.`);
      queryClient.setQueryData(qk.candidatos.bancoTalento(filtros), (old) => (old || []).filter(x => x.id !== c.id));
    },
    onError: () => toast.error('No se pudo actualizar.'),
  });
  const quitandoId = quitarMutation.isPending ? quitarMutation.variables?.id : null;

  function quitar(c) {
    quitarMutation.mutate(c);
  }

  const scoreColor = (v) => v == null ? t.textFaint : v >= 14 ? '#10b981' : v >= 11 ? '#f59e0b' : '#ef4444';

  const card = {
    background: t.card, border: `1px solid ${t.cardBorder}`,
    borderRadius: 14, animation: 'fadeInUp 0.35s ease both',
  };
  const input = {
    padding: '9px 13px', borderRadius: 9, border: `1px solid ${t.cardBorder}`,
    background: t.toggleBg, color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Filtros */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: t.textMuted, marginBottom: 5 }}>Score CV mínimo</label>
          <input type="number" min="0" max="100" placeholder="Ej. 70" value={scoreMin}
            onChange={e => setScoreMin(e.target.value)} style={{ ...input, width: 110 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: t.textMuted, marginBottom: 5 }}>Habilidad</label>
          <input type="text" placeholder="Ej. Python, liderazgo…" value={habilidad}
            onChange={e => setHabilidad(e.target.value)}
            style={{ ...input, width: 200 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: t.textMuted, marginBottom: 5 }}>Área</label>
          <select value={areaId} onChange={e => setAreaId(e.target.value)} style={{ ...input, width: 170 }}>
            <option value="">Todas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: t.textMuted, paddingBottom: 9 }}>
          <i className="ti ti-star" style={{ marginRight: 5, color: '#f59e0b' }} />
          {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''} guardado{candidatos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ ...card, padding: 50, textAlign: 'center', color: t.textMuted, fontSize: 14 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 22, animation: 'spin 1s linear infinite', display: 'inline-block' }} /> Cargando…
        </div>
      ) : candidatos.length === 0 ? (
        <div style={{ ...card, padding: '56px 30px', textAlign: 'center' }}>
          <i className="ti ti-star" style={{ fontSize: 40, color: t.textFaint }} />
          <div style={{ fontSize: 15.5, fontWeight: 600, color: t.text, marginTop: 12 }}>El banco de talento está vacío</div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 6, maxWidth: 380, margin: '6px auto 0' }}>
            Marca candidatos destacados con la estrella desde su perfil, y quedarán guardados aquí para futuras vacantes.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {candidatos.map((c, i) => (
            <div key={c.id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, animationDelay: `${i * 0.04}s`, cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
              onClick={() => navigate(`/candidatos/${c.id}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {(c.nombre_completo || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: t.text }}>{c.nombre_completo}</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                  {c.vacante_original ? <>Postuló a: {c.vacante_original}</> : c.email}
                </div>
              </div>

              {c.habilidades && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 280 }}>
                  {String(c.habilidades).split(',').slice(0, 4).map(h => (
                    <span key={h} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'rgba(124,58,237,0.10)', color: '#7c3aed', fontWeight: 600 }}>{h.trim()}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                {[['CV', c.score_cv, 100], ['Examen', c.score_examen, 20], ['Final', c.score_final, 20]].map(([label, v, max]) => (
                  <div key={label} style={{ textAlign: 'center', minWidth: 48 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: max === 100 ? (v != null ? '#7c3aed' : t.textFaint) : scoreColor(v) }}>
                      {v != null ? v : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: t.textFaint, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
                  </div>
                ))}
              </div>

              <button title="Quitar del banco de talento" disabled={quitandoId === c.id}
                onClick={(e) => { e.stopPropagation(); quitar(c); }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = t.toggleBg; e.currentTarget.style.borderColor = t.cardBorder; e.currentTarget.style.color = t.textMuted; }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 9, border: `1px solid ${t.cardBorder}`, background: t.toggleBg, color: t.textMuted, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, flexShrink: 0, transition: 'all 0.15s ease', fontFamily: 'inherit' }}>
                <i className={quitandoId === c.id ? 'ti ti-loader-2' : 'ti ti-star-off'} style={{ fontSize: 15, ...(quitandoId === c.id ? { animation: 'spin 1s linear infinite' } : {}) }} />
                {quitandoId === c.id ? 'Quitando…' : 'Quitar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
