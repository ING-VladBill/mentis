import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useTheme } from '../ThemeContext';
import api from '../services/api';

// ─── Ícono PDF ────────────────────────────────────────────────────────────────
function PdfIcon({ size = 18 }) {
  return (
    <div style={{
      width: size + 8, height: size + 8, borderRadius: 5, flexShrink: 0,
      background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <i className="ti ti-file-type-pdf" style={{ fontSize: size, color: '#f87171' }} />
    </div>
  );
}

// ─── Fila de archivo ──────────────────────────────────────────────────────────
function ArchivoFila({ file, onRemove, t }) {
  const kb = (file.size / 1024).toFixed(1);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 8,
      background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    }}>
      <PdfIcon />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {file.name}
        </div>
        <div style={{ fontSize: 11, color: t.textFaint, marginTop: 1 }}>{kb} KB</div>
      </div>
      <button
        onClick={() => onRemove(file.name)}
        style={{
          width: 22, height: 22, borderRadius: 5, flexShrink: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.textFaint, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
        onMouseLeave={e => e.currentTarget.style.color = t.textFaint}
      >
        <i className="ti ti-x" style={{ fontSize: 13 }} />
      </button>
    </div>
  );
}

// ─── Fila de resultado ────────────────────────────────────────────────────────
function ResultadoFila({ item, t }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px', borderRadius: 8,
      background: item.exito ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
      border: `1px solid ${item.exito ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'}`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: item.exito ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i
          className={`ti ${item.exito ? 'ti-check' : 'ti-x'}`}
          style={{ fontSize: 11, color: item.exito ? '#34d399' : '#f87171' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: t.text, wordBreak: 'break-all' }}>
          {item.archivo}
        </div>
        <div style={{ fontSize: 12, color: item.exito ? '#34d399' : '#f87171', marginTop: 2 }}>
          {item.exito
            ? (item.candidato?.nombre_completo ? `Candidato creado: ${item.candidato.nombre_completo}` : 'Candidato creado exitosamente')
            : (item.error || 'Error al procesar el archivo')
          }
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CargaMasiva() {
  const { t, dark } = useTheme();

  const [vacantes,    setVacantes]    = useState([]);
  const [vacanteId,   setVacanteId]   = useState('');
  const [archivos,    setArchivos]    = useState([]);
  const [enviando,    setEnviando]    = useState(false);
  const [resultado,   setResultado]   = useState(null);

  useEffect(() => {
    api.get('/api/vacantes/abiertas/')
      .then(r => setVacantes(r.data.vacantes || r.data))
      .catch(() => toast.error('Error al cargar las vacantes'));
  }, []);

  const onDrop = useCallback((accepted) => {
    if (!vacanteId) return;
    const nuevos = accepted.filter(f => !archivos.find(a => a.name === f.name));
    const combinados = [...archivos, ...nuevos].slice(0, 20);
    setArchivos(combinados);
  }, [archivos, vacanteId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    disabled: !vacanteId || enviando,
    maxFiles: 20,
    multiple: true,
  });

  function quitarArchivo(nombre) {
    setArchivos(prev => prev.filter(f => f.name !== nombre));
  }

  async function handleEnviar() {
    if (!vacanteId || archivos.length === 0 || enviando) return;
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('vacante_id', vacanteId);
      archivos.forEach(f => fd.append('archivos', f));

      const { data } = await api.post('/api/candidatos/carga-masiva/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResultado(data);

      if (data.exitosos > 0) {
        toast.success(data.mensaje || `${data.exitosos} candidato${data.exitosos !== 1 ? 's' : ''} procesado${data.exitosos !== 1 ? 's' : ''} correctamente`);
      }
      if (data.exitosos === 0) {
        toast.error('Todos los archivos fallaron al procesarse');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Error al procesar los CVs';
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  function resetear() {
    setArchivos([]);
    setResultado(null);
    setVacanteId('');
  }

  const card  = { background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 12 };
  const inp   = {
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 9, color: t.text, fontSize: 13.5,
    outline: 'none', colorScheme: dark ? 'dark' : 'light',
    padding: '10px 13px', width: '100%', boxSizing: 'border-box',
  };

  const vacanteActual = vacantes.find(v => String(v.id) === String(vacanteId));

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Selector de vacante ── */}
      <div style={{ ...card, padding: '22px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <i className="ti ti-briefcase" style={{ fontSize: 16, color: '#7c3aed' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Vacante destino</span>
          <span style={{ fontSize: 12, color: '#f87171', marginLeft: 2 }}>*</span>
        </div>
        <select value={vacanteId} onChange={e => { setVacanteId(e.target.value); setArchivos([]); setResultado(null); }} style={inp}>
          <option value="">— Selecciona la vacante destino —</option>
          {vacantes.map(v => (
            <option key={v.id} value={v.id}>
              {v.codigo ? `[${v.codigo}] ` : ''}{v.titulo}
            </option>
          ))}
        </select>
        {vacanteActual && (
          <div style={{ marginTop: 8, fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-check" style={{ color: '#34d399', fontSize: 13 }} />
            Vacante seleccionada: <strong style={{ color: t.text }}>{vacanteActual.titulo}</strong>
          </div>
        )}
      </div>

      {/* ── Resultados ── */}
      {resultado ? (
        <div style={{ ...card, padding: '24px 26px' }}>
          {/* Resumen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 16, color: '#7c3aed' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Resultados del procesamiento</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total enviados',   value: resultado.total,     color: '#7c3aed', icon: 'ti-files'        },
              { label: 'Procesados',        value: resultado.exitosos,  color: '#34d399', icon: 'ti-circle-check' },
              { label: 'Con errores',       value: resultado.fallidos,  color: '#f87171', icon: 'ti-circle-x'    },
            ].map(s => (
              <div key={s.label} style={{
                padding: '16px 18px', borderRadius: 10,
                background: `${s.color}0d`, border: `1px solid ${s.color}28`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalle por archivo */}
          {resultado.detalle?.length > 0 && (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: t.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Detalle por archivo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resultado.detalle.map((item, i) => (
                  <ResultadoFila key={i} item={item} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* Botón reset */}
          <button
            onClick={resetear}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, marginTop: 22,
              padding: '10px 20px', borderRadius: 9, border: 'none',
              background: '#7c3aed', color: '#fff',
              fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <i className="ti ti-refresh" style={{ fontSize: 15 }} />
            Procesar otro lote
          </button>
        </div>
      ) : (
        /* ── Zona de upload ── */
        <div style={{ ...card, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <i className="ti ti-upload" style={{ fontSize: 16, color: '#7c3aed' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Archivos PDF</span>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${!vacanteId ? t.inputBorder : isDragActive ? '#7c3aed' : t.cardBorder}`,
              borderRadius: 12, padding: '40px 24px', textAlign: 'center',
              cursor: !vacanteId || enviando ? 'not-allowed' : 'pointer',
              background: isDragActive ? 'rgba(124,58,237,0.06)' : (!vacanteId ? t.inputBg : 'transparent'),
              transition: 'all 0.2s',
              opacity: enviando ? 0.6 : 1,
            }}
          >
            <input {...getInputProps()} />
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
              background: !vacanteId ? t.toggleBg : isDragActive ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${!vacanteId ? t.inputBorder : 'rgba(124,58,237,0.2)'}`,
            }}>
              <i
                className={`ti ${isDragActive ? 'ti-cloud-download' : 'ti-files'}`}
                style={{ fontSize: 26, color: !vacanteId ? t.textFaint : isDragActive ? '#7c3aed' : '#a78bfa' }}
              />
            </div>

            {!vacanteId ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.textFaint, marginBottom: 6 }}>
                  Selecciona primero una vacante
                </div>
                <div style={{ fontSize: 12, color: t.textFaint }}>
                  Debes elegir la vacante destino antes de subir archivos
                </div>
              </>
            ) : isDragActive ? (
              <div style={{ fontSize: 15, fontWeight: 600, color: '#7c3aed' }}>
                Suelta los archivos aquí
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text, marginBottom: 6 }}>
                  Arrastra tus CVs aquí o <span style={{ color: '#7c3aed', textDecoration: 'underline' }}>haz clic para seleccionar</span>
                </div>
                <div style={{ fontSize: 12, color: t.textMuted }}>
                  Solo archivos PDF — máximo 20 archivos por lote
                </div>
              </>
            )}
          </div>

          {/* Lista previa de archivos */}
          {archivos.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: t.textMuted }}>
                  {archivos.length} archivo{archivos.length !== 1 ? 's' : ''} seleccionado{archivos.length !== 1 ? 's' : ''}
                </span>
                {archivos.length > 1 && (
                  <button
                    onClick={() => setArchivos([])}
                    style={{ background: 'none', border: 'none', fontSize: 12, color: t.textFaint, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Limpiar todo
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {archivos.map(f => (
                  <ArchivoFila key={f.name} file={f} onRemove={quitarArchivo} t={t} />
                ))}
              </div>
            </div>
          )}

          {/* Botón enviar */}
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleEnviar}
              disabled={!vacanteId || archivos.length === 0 || enviando}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 9, border: 'none',
                background: (!vacanteId || archivos.length === 0 || enviando)
                  ? 'rgba(124,58,237,0.3)'
                  : '#7c3aed',
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: (!vacanteId || archivos.length === 0 || enviando) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {enviando ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Procesando...
                </>
              ) : (
                <>
                  <i className="ti ti-rocket" style={{ fontSize: 16 }} />
                  Procesar {archivos.length > 0 ? `${archivos.length} ` : ''}CVs
                </>
              )}
            </button>

            {archivos.length > 0 && !enviando && (
              <span style={{ fontSize: 12, color: t.textMuted }}>
                Se enviarán {archivos.length} archivo{archivos.length !== 1 ? 's' : ''} para la vacante <strong style={{ color: t.text }}>{vacanteActual?.titulo}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
