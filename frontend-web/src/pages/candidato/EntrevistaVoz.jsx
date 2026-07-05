// ==========================================
// frontend-web/src/pages/candidato/EntrevistaVoz.jsx
// Sprint 4 — Entrevista conversacional por voz con Gemini Live
//
// Flujo:
//  1. Lee el token del candidato (query param, igual que el examen)
//  2. POST /api/evaluaciones/entrevista/iniciar/ -> system_prompt + live_token
//  3. Abre WebSocket con Gemini Live API (voz a voz, streaming)
//  4. Captura micrófono -> PCM 16kHz -> envía chunks; reproduce el audio de la IA
//  5. Acumula la transcripción de ambos lados (output_transcription + input_transcription)
//  6. Timer visible; al agotar el tiempo o al presionar "Terminar": 
//     POST /finalizar/ con la transcripción -> pantalla de despedida
//
// Requiere: navegador con soporte de AudioWorklet (Chrome/Edge modernos)
// ==========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api'; // el axios configurado del proyecto

const LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export default function EntrevistaVoz() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [fase, setFase] = useState('permisos');       // permisos | conectando | en_curso | finalizando | terminada | error
  const [error, setError] = useState('');
  const [hablandoIA, setHablandoIA] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const [nombreCandidato, setNombreCandidato] = useState('');

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const workletRef = useRef(null);
  const transcripcionRef = useRef([]);          // [{quien: 'IA'|'Candidato', texto}]
  const colaAudioRef = useRef([]);              // chunks de audio de la IA por reproducir
  const reproduciendoRef = useRef(false);
  const timerRef = useRef(null);
  const capturaIntervalRef = useRef(null);
  const videoRef = useRef(null);

  // ---------------------------------------------------------------
  // 1. Pedir permisos de micrófono y cámara (cámara: solo auditoría)
  // ---------------------------------------------------------------
  async function pedirPermisos() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        video: { width: 320, height: 240 },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      await iniciarEntrevista();
    } catch {
      setError('Necesitamos acceso a tu micrófono y cámara para la entrevista. Revisa los permisos del navegador.');
      setFase('error');
    }
  }

  // ---------------------------------------------------------------
  // 2. Iniciar: pedir prompt + token efímero al backend
  // ---------------------------------------------------------------
  async function iniciarEntrevista() {
    setFase('conectando');
    try {
      const { data } = await api.post('/api/evaluaciones/entrevista/iniciar/', { token });
      setNombreCandidato(data.candidato_nombre);
      setSegundosRestantes(data.segundos_restantes);
      await capturarFoto('identidad_inicial');        // S4-10: foto de identidad
      conectarGeminiLive(data);
      iniciarCapturasPeriodicas();                    // S4-11: fotos cada 3 min
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar la entrevista.');
      setFase('error');
    }
  }

  // ---------------------------------------------------------------
  // 3. Conexión WebSocket con Gemini Live
  // ---------------------------------------------------------------
  function conectarGeminiLive({ system_prompt, live_token, live_model }) {
    // El token efímero se pasa como access_token en la URL del WS
    const ws = new WebSocket(`${LIVE_WS_URL}?access_token=${encodeURIComponent(live_token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Setup de la sesión: modelo + system prompt (la personalidad) + voz + transcripción
      ws.send(JSON.stringify({
        setup: {
          model: `models/${live_model}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }, // voz femenina cálida
              languageCode: 'es-US',
            },
          },
          systemInstruction: { parts: [{ text: system_prompt }] },
          outputAudioTranscription: {},   // transcribe lo que dice la IA
          inputAudioTranscription: {},    // transcribe lo que dice el candidato
        },
      }));
    };

    ws.onmessage = async (event) => {
      const blob = event.data instanceof Blob ? await event.data.text() : event.data;
      const msg = JSON.parse(blob);

      if (msg.setupComplete) {
        setFase('en_curso');
        iniciarTimer();
        await iniciarMicrofono();
        return;
      }

      const contenido = msg.serverContent;
      if (!contenido) return;

      // Audio de la IA -> a la cola de reproducción
      const partes = contenido.modelTurn?.parts || [];
      for (const p of partes) {
        if (p.inlineData?.data) {
          colaAudioRef.current.push(p.inlineData.data);
          reproducirCola();
        }
      }

      // Transcripciones (ambos lados) — para el análisis posterior
      if (contenido.outputTranscription?.text) {
        agregarTranscripcion('IA', contenido.outputTranscription.text);
        setHablandoIA(true);
      }
      if (contenido.inputTranscription?.text) {
        agregarTranscripcion('Candidato', contenido.inputTranscription.text);
      }
      if (contenido.turnComplete) setHablandoIA(false);

      // Si el candidato interrumpe, Gemini manda "interrupted": vaciamos la cola
      if (contenido.interrupted) {
        colaAudioRef.current = [];
        setHablandoIA(false);
      }
    };

    ws.onerror = () => { setError('Se perdió la conexión de voz. Recarga la página para reintentar.'); setFase('error'); };
    ws.onclose = () => { if (fase === 'en_curso') setHablandoIA(false); };
  }

  function agregarTranscripcion(quien, texto) {
    const arr = transcripcionRef.current;
    const ultimo = arr[arr.length - 1];
    if (ultimo && ultimo.quien === quien) ultimo.texto += texto;  // Live manda fragmentos
    else arr.push({ quien, texto });
  }

  // ---------------------------------------------------------------
  // 4. Micrófono -> PCM 16kHz base64 -> WebSocket
  // ---------------------------------------------------------------
  async function iniciarMicrofono() {
    const ctx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(mediaStreamRef.current);

    // AudioWorklet inline: convierte float32 -> int16 PCM
    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0][0];
          if (input) {
            const pcm = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              const s = Math.max(-1, Math.min(1, input[i]));
              pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(pcm.buffer, [pcm.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);`;
    const blobURL = URL.createObjectURL(new Blob([workletCode], { type: 'application/javascript' }));
    await ctx.audioWorklet.addModule(blobURL);

    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
    workletRef.current = worklet;
    worklet.port.onmessage = (e) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(e.data)));
        wsRef.current.send(JSON.stringify({
          realtimeInput: { audio: { data: b64, mimeType: 'audio/pcm;rate=16000' } },
        }));
      }
    };
    source.connect(worklet);
  }

  // ---------------------------------------------------------------
  // 5. Reproducción del audio de la IA (PCM 24kHz que manda Live)
  // ---------------------------------------------------------------
  async function reproducirCola() {
    if (reproduciendoRef.current || colaAudioRef.current.length === 0) return;
    reproduciendoRef.current = true;

    const playCtx = audioCtxRef.current || new AudioContext();
    while (colaAudioRef.current.length > 0) {
      const b64 = colaAudioRef.current.shift();
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;

      const buffer = playCtx.createBuffer(1, float32.length, 24000); // Live responde a 24kHz
      buffer.copyToChannel(float32, 0);
      const src = playCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(playCtx.destination);
      await new Promise(res => { src.onended = res; src.start(); });
    }
    reproduciendoRef.current = false;
  }

  // ---------------------------------------------------------------
  // 6. Timer de la entrevista
  // ---------------------------------------------------------------
  function iniciarTimer() {
    timerRef.current = setInterval(() => {
      setSegundosRestantes(prev => {
        if (prev <= 1) { finalizar(true); return 0; }
        // Aviso interno a la IA cuando quedan 5 minutos (S4-07)
        if (prev === 300 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text: '[SISTEMA: quedan 5 minutos. Empieza a cerrar la entrevista cubriendo los temas críticos pendientes.]' }] }],
              turnComplete: true,
            },
          }));
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ---------------------------------------------------------------
  // 7. Capturas de auditoría (S4-10/S4-11)
  // ---------------------------------------------------------------
  async function capturarFoto(tipo) {
    try {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 240;
      canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
      const imagen = canvas.toDataURL('image/jpeg', 0.7);
      await api.post('/api/evaluaciones/entrevista/captura/', { token, imagen_base64: imagen, tipo });
    } catch { /* la captura no debe romper la entrevista */ }
  }

  function iniciarCapturasPeriodicas() {
    capturaIntervalRef.current = setInterval(() => capturarFoto('periodica'), 3 * 60 * 1000);
  }

  // ---------------------------------------------------------------
  // 8. Finalizar: enviar transcripción y despedirse
  // ---------------------------------------------------------------
  const finalizar = useCallback(async (porTiempo = false) => {
    setFase('finalizando');
    clearInterval(timerRef.current);
    clearInterval(capturaIntervalRef.current);
    try { wsRef.current?.close(); } catch { /* ok */ }
    try { workletRef.current?.disconnect(); } catch { /* ok */ }
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { /* ok */ }

    const transcripcion = transcripcionRef.current
      .map(t => `${t.quien}: ${t.texto.trim()}`)
      .join('\n');

    try {
      await api.post('/api/evaluaciones/entrevista/finalizar/', { token, transcripcion });
      setFase('terminada');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la entrevista.');
      setFase('error');
    }
  }, [token]);

  useEffect(() => () => {   // limpieza al desmontar
    clearInterval(timerRef.current);
    clearInterval(capturaIntervalRef.current);
    try { wsRef.current?.close(); } catch { /* ok */ }
    try { mediaStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { /* ok */ }
  }, []);

  const mm = String(Math.floor((segundosRestantes || 0) / 60)).padStart(2, '0');
  const ss = String((segundosRestantes || 0) % 60).padStart(2, '0');

  // ---------------------------------------------------------------
  // UI  (estilos base — Gabriel: adáptalos a la paleta del portal)
  // ---------------------------------------------------------------
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, textAlign: 'center' }}>
      {/* cámara siempre montada (para las capturas), visible pequeña */}
      <video ref={videoRef} autoPlay muted playsInline
        style={{ position: 'fixed', bottom: 16, right: 16, width: 160, borderRadius: 12,
                 display: fase === 'en_curso' ? 'block' : 'none', border: '2px solid #7c3aed' }} />

      {fase === 'permisos' && (
        <>
          <h1>🎙️ Tu entrevista con Eva</h1>
          <p>Vas a conversar por voz con nuestra entrevistadora IA. Es una conversación natural:
             habla con calma, puedes interrumpir y hacer preguntas, como con una persona real.</p>
          <p style={{ fontSize: 14, opacity: 0.7 }}>Necesitamos acceso a tu micrófono y cámara
             (la cámara es solo para verificación de identidad).</p>
          <button onClick={pedirPermisos} style={{ padding: '14px 32px', fontSize: 16, borderRadius: 12,
                  background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Estoy listo/a — Comenzar
          </button>
        </>
      )}

      {fase === 'conectando' && <h2>Conectando con Eva... 🎧</h2>}

      {fase === 'en_curso' && (
        <>
          <div style={{ fontSize: 40, fontWeight: 700, color: segundosRestantes < 300 ? '#f87171' : '#7c3aed' }}>
            {mm}:{ss}
          </div>
          <div style={{ margin: '32px 0', fontSize: 80 }}>
            {hablandoIA ? '🗣️' : '👂'}
          </div>
          <p style={{ opacity: 0.8 }}>
            {hablandoIA ? 'Eva está hablando...' : 'Eva te escucha — habla con confianza'}
          </p>
          <button onClick={() => finalizar(false)} style={{ marginTop: 24, padding: '10px 24px',
                  borderRadius: 10, background: 'transparent', border: '1px solid #f87171',
                  color: '#f87171', cursor: 'pointer' }}>
            Terminar entrevista
          </button>
        </>
      )}

      {fase === 'finalizando' && <h2>Guardando tu entrevista... ✍️</h2>}

      {fase === 'terminada' && (
        <>
          <h1>¡Gracias, {nombreCandidato}! 🎉</h1>
          <p>Tu entrevista quedó registrada. El equipo de RRHH revisará tu proceso completo
             y te contactará por correo con los próximos pasos.</p>
        </>
      )}

      {fase === 'error' && (
        <>
          <h2>😕 Algo salió mal</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px',
                  borderRadius: 10, cursor: 'pointer' }}>Reintentar</button>
        </>
      )}
    </div>
  );
}
