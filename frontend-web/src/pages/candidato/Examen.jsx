import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSpring } from '../../services/api';

// ─── Componentes auxiliares (FUERA del componente principal) ──────────────────

function Timer({ segundos, onExpira }) {
  const [restantes, setRestantes] = useState(segundos);
  const ref = useRef(null);

  useEffect(() => {
    setRestantes(segundos);
  }, [segundos]);

  useEffect(() => {
    if (restantes <= 0) { onExpira(); return; }
    ref.current = setInterval(() => {
      setRestantes(s => {
        if (s <= 1) { clearInterval(ref.current); onExpira(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, []);

  const horas = Math.floor(restantes / 3600);
  const mins  = Math.floor((restantes % 3600) / 60);
  const segs  = restantes % 60;
  const fmt   = n => String(n).padStart(2, '0');
  const critico = restantes < 300; // menos de 5 min

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', borderRadius: 10,
      background: critico ? 'rgba(248,113,113,0.1)' : 'rgba(124,58,237,0.08)',
      border: `1px solid ${critico ? 'rgba(248,113,113,0.3)' : 'rgba(124,58,237,0.2)'}`,
      transition: 'all 0.3s',
    }}>
      <i className="ti ti-clock" style={{ fontSize: 16, color: critico ? '#f87171' : '#7c3aed' }} />
      <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: critico ? '#f87171' : '#7c3aed', letterSpacing: '0.05em' }}>
        {horas > 0 ? `${fmt(horas)}:` : ''}{fmt(mins)}:{fmt(segs)}
      </span>
    </div>
  );
}

function PreguntaMultiple({ pregunta, respuesta, onResponder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pregunta.opciones?.map((op, i) => {
        const seleccionada = respuesta === op;
        return (
          <button key={i} onClick={() => onResponder(op)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
            border: seleccionada ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
            background: seleccionada ? 'rgba(124,58,237,0.07)' : '#fafafa',
            transition: 'all 0.15s', textAlign: 'left', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { if (!seleccionada) e.currentTarget.style.borderColor = '#c4b5fd'; }}
            onMouseLeave={e => { if (!seleccionada) e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              border: seleccionada ? '2px solid #7c3aed' : '2px solid #d1d5db',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {seleccionada && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }} />}
            </div>
            <span style={{ fontSize: 14.5, color: seleccionada ? '#111827' : '#374151', fontWeight: seleccionada ? 500 : 400 }}>{op}</span>
          </button>
        );
      })}
    </div>
  );
}

function PreguntaAbierta({ respuesta, onResponder }) {
  return (
    <textarea
      value={respuesta || ''}
      onChange={e => onResponder(e.target.value)}
      rows={6}
      placeholder="Escribe tu respuesta aquí..."
      style={{
        width: '100%', boxSizing: 'border-box',
        background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12,
        padding: '14px 16px', fontSize: 14.5, color: '#111827',
        lineHeight: 1.65, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => e.target.style.borderColor = '#7c3aed'}
      onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
    />
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Examen() {
  const navigate = useNavigate();

  const [examen,    setExamen]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [pregActual, setPregActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [guardando,  setGuardando]  = useState({});
  const [finalizando, setFinalizando] = useState(false);
  const [mostrarConfirm, setConfirm]  = useState(false);

  // Token de sesión del candidato
  if (!localStorage.getItem('candidato_token')) { navigate('/candidato/acceso'); }

  // ── Carga / retomar examen ──
  useEffect(() => {
    const cached = localStorage.getItem('examen_data');
    if (cached) {
      const data = JSON.parse(cached);
      setExamen(data);
      // Precarga respuestas ya dadas
      const prev = {};
      (data.preguntas || []).forEach(p => { if (p.respuestaCandidato) prev[p.id] = p.respuestaCandidato; });
      setRespuestas(prev);
      setPregActual(data.preguntas?.findIndex(p => !p.respondida) ?? 0);
      setLoading(false);
    } else {
      apiSpring.get('/api/usuario/examen')
        .then(r => {
          setExamen(r.data);
          localStorage.setItem('examen_data', JSON.stringify(r.data));
          const prev = {};
          (r.data.preguntas || []).forEach(p => { if (p.respuestaCandidato) prev[p.id] = p.respuestaCandidato; });
          setRespuestas(prev);
          setPregActual(r.data.preguntas?.findIndex(p => !p.respondida) ?? 0);
        })
        .catch(() => setError('No se pudo cargar el examen. Intenta recargar la página.'))
        .finally(() => setLoading(false));
    }
  }, []);

  // ── Proctoring — detectar eventos sospechosos ──
  const reportarEvento = useCallback(async (tipo, detalle) => {
    try { await apiSpring.post('/api/usuario/examen/evento', { tipo, detalle }); }
    catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    if (!examen) return;

    // Pérdida de foco / cambio de ventana
    const onBlur = () => reportarEvento('perdida_foco', 'El candidato salió de la pestaña o perdió el foco');
    const onVisibility = () => {
      if (document.hidden) reportarEvento('cambio_ventana', 'El candidato cambió de pestaña');
    };

    // Copy / Paste
    const onCopy  = () => reportarEvento('copy_paste', 'Intento de copiar contenido');
    const onPaste = () => reportarEvento('copy_paste', 'Intento de pegar contenido');

    // Click derecho
    const onContext = e => { e.preventDefault(); reportarEvento('click_derecho', 'Click derecho en el examen'); };

    // DevTools (heurística por tamaño de ventana)
    const devtoolsCheck = setInterval(() => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        reportarEvento('devtools', 'Posible apertura de DevTools detectada');
      }
    }, 5000);

    // Inactividad (2 min sin interacción)
    let inactividadTimer;
    const resetInactividad = () => {
      clearTimeout(inactividadTimer);
      inactividadTimer = setTimeout(() => reportarEvento('inactividad', 'Sin interacción por más de 2 minutos'), 120000);
    };
    resetInactividad();
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(ev => window.addEventListener(ev, resetInactividad));

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContext);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContext);
      clearInterval(devtoolsCheck);
      clearTimeout(inactividadTimer);
      activityEvents.forEach(ev => window.removeEventListener(ev, resetInactividad));
    };
  }, [examen, reportarEvento]);

  // ── Guardar respuesta (auto-guardado) ──
  async function guardarRespuesta(preguntaId, respuesta) {
    setRespuestas(prev => ({ ...prev, [preguntaId]: respuesta }));
    setGuardando(prev => ({ ...prev, [preguntaId]: true }));
    try {
      await apiSpring.post('/api/usuario/examen/respuesta', { preguntaId, respuesta });
    } catch { /* reintentará al finalizar */ }
    finally { setGuardando(prev => ({ ...prev, [preguntaId]: false })); }
  }

  // Para abiertas: guardar con debounce
  const debounceRef = useRef({});
  function onResponderAbierta(preguntaId, valor) {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
    clearTimeout(debounceRef.current[preguntaId]);
    debounceRef.current[preguntaId] = setTimeout(() => guardarRespuesta(preguntaId, valor), 1200);
  }

  // ── Finalizar examen ──
  async function finalizar() {
    setFinalizando(true);
    try {
      await apiSpring.post('/api/usuario/examen/finalizar');
      localStorage.removeItem('examen_data');
      navigate('/candidato/finalizado');
    } catch {
      setFinalizando(false);
      setConfirm(false);
    }
  }

  // ── Timer expirado ──
  function onTimerExpira() { finalizar(); }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexDirection: 'column' }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 13.5, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>Cargando examen...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '32px 28px', maxWidth: 420, textAlign: 'center' }}>
        <i className="ti ti-alert-circle" style={{ fontSize: 36, color: '#f87171', display: 'block', marginBottom: 14 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Error al cargar el examen</div>
        <div style={{ fontSize: 13.5, color: '#6b7280' }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
          Recargar
        </button>
      </div>
    </div>
  );

  const preguntas   = examen?.preguntas || [];
  const pregunta    = preguntas[pregActual];
  const totalRespondidas = Object.keys(respuestas).filter(k => respuestas[k]?.trim()).length;
  const respuestaActual  = pregunta ? respuestas[pregunta.id] || '' : '';
  const estaGuardando    = pregunta ? !!guardando[pregunta.id] : false;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Modal confirmación finalizar */}
      {mostrarConfirm && (
        <div onClick={() => setConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: '32px 28px', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <i className="ti ti-send" style={{ fontSize: 36, color: '#7c3aed', display: 'block', marginBottom: 14 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>¿Finalizar el examen?</div>
            <div style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>
              Respondiste <strong>{totalRespondidas}</strong> de <strong>{preguntas.length}</strong> preguntas.
            </div>
            {totalRespondidas < preguntas.length && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                Tienes {preguntas.length - totalRespondidas} pregunta(s) sin responder.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={finalizar} disabled={finalizando} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: finalizando ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {finalizando && <span style={{ width: 13, height: 13, display: 'inline-block', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {finalizando ? 'Enviando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header fijo */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-brain" style={{ fontSize: 14, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Examen MENTIS</span>
          <span style={{ fontSize: 12.5, color: '#9ca3af' }}>· {examen?.vacante}</span>
        </div>

        {/* Progreso */}
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {totalRespondidas}/{preguntas.length} respondidas
        </div>

        {/* Timer */}
        {examen?.segundos_restantes != null && (
          <Timer segundos={examen.segundos_restantes} onExpira={onTimerExpira} />
        )}

        {/* Finalizar */}
        <button onClick={() => setConfirm(true)} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-send" style={{ fontSize: 15 }} /> Finalizar examen
        </button>
      </header>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '28px 20px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'start' }}>

        {/* Pregunta actual */}
        {pregunta && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '28px 30px' }}>
            {/* Meta de la pregunta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '3px 10px', borderRadius: 6 }}>
                  {pregunta.categoria}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '3px 10px', borderRadius: 6 }}>
                  {pregunta.tipo === 'multiple' ? 'Opción múltiple' : 'Respuesta abierta'}
                </span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7280' }}>{pregunta.puntos} {pregunta.puntos === 1 ? 'punto' : 'puntos'}</span>
            </div>

            {/* Número + enunciado */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
              Pregunta {pregActual + 1} de {preguntas.length}
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.65, margin: '0 0 24px' }}>
              {pregunta.enunciado}
            </p>

            {/* Respuesta */}
            {pregunta.tipo === 'multiple'
              ? <PreguntaMultiple pregunta={pregunta} respuesta={respuestaActual} onResponder={r => guardarRespuesta(pregunta.id, r)} />
              : <PreguntaAbierta respuesta={respuestaActual} onResponder={r => onResponderAbierta(pregunta.id, r)} />
            }

            {/* Estado guardado */}
            <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, minHeight: 20 }}>
              {estaGuardando
                ? <><span style={{ width: 11, height: 11, display: 'inline-block', border: '1.5px solid #d1d5db', borderTopColor: '#9ca3af', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Guardando...</>
                : respuestaActual
                ? <><i className="ti ti-circle-check" style={{ fontSize: 13, color: '#34d399' }} /> Guardado</>
                : null
              }
            </div>

            {/* Navegación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setPregActual(p => Math.max(0, p - 1))} disabled={pregActual === 0} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13.5, cursor: pregActual === 0 ? 'not-allowed' : 'pointer', opacity: pregActual === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                <i className="ti ti-arrow-left" /> Anterior
              </button>
              <button onClick={() => setPregActual(p => Math.min(preguntas.length - 1, p + 1))} disabled={pregActual === preguntas.length - 1} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 13.5, cursor: pregActual === preguntas.length - 1 ? 'not-allowed' : 'pointer', opacity: pregActual === preguntas.length - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontWeight: 600 }}>
                Siguiente <i className="ti ti-arrow-right" />
              </button>
            </div>
          </div>
        )}

        {/* Panel lateral — mapa de preguntas */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Preguntas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {preguntas.map((p, i) => {
              const respondida = !!respuestas[p.id]?.trim();
              const esActual   = i === pregActual;
              return (
                <button key={p.id} onClick={() => setPregActual(i)} style={{
                  width: 36, height: 36, borderRadius: 9,
                  border: esActual ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
                  background: esActual ? 'rgba(124,58,237,0.1)' : respondida ? 'rgba(52,211,153,0.1)' : '#f9fafb',
                  color: esActual ? '#7c3aed' : respondida ? '#059669' : '#9ca3af',
                  fontSize: 12.5, fontWeight: esActual || respondida ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', label: 'Actual'     },
              { color: '#059669', bg: 'rgba(52,211,153,0.1)',  label: 'Respondida' },
              { color: '#9ca3af', bg: '#f9fafb',               label: 'Pendiente'  },
            ].map(({ color, bg, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: `1.5px solid ${color}` }} />
                <span style={{ fontSize: 11.5, color: '#6b7280' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}