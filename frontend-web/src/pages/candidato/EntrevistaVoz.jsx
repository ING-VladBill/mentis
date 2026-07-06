// ==========================================
// frontend-web/src/pages/candidato/EntrevistaVoz.jsx  — v2
// La entrevista con E.V.A. (Entrevistadora Virtual Adaptativa)
//
// Novedades v2:
//  · Consentimiento de datos (carta de acuerdos antes de empezar)
//  · Encuadre de cámara con verificación IA de persona (anti cámara tapada)
//  · Ojos naturales: sacádicos (inicio rápido, freno suave), siguen el cursor,
//    y en reposo miran puntos de interés de la interfaz (guían la mirada)
//  · Feedback "te escucho": halo reactivo al volumen del micrófono + chip
//  · Cámara visible (PiP) durante la entrevista
//  · Menos latencia: VAD sensible + reproducción de audio agendada sin gaps
// ==========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

// ------------------------------------------------------------------
// E.V.A. — emociones: geometría de ojos + respiración
// ------------------------------------------------------------------
const EMOCIONES = {
  escuchando: { eyes: [{ h: 54, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }, { h: 54, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }], color: '#534AB7', border: '#AFA9EC', breath: 'breathe-slow 3.4s ease-in-out infinite', jitter: 'soft', gaze: true },
  hablando:   { eyes: [{ h: 54, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }, { h: 54, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }], color: '#534AB7', border: '#AFA9EC', breath: 'breathe-active 1.6s ease-in-out infinite', jitter: 'soft', gaze: true },
  riendo:     { eyes: [{ h: 20, w: 36, r: '999px 999px 0 0', rot: 0, tx: 0, ty: -8 }, { h: 20, w: 36, r: '999px 999px 0 0', rot: 0, tx: 0, ty: -8 }], color: '#534AB7', border: '#AFA9EC', breath: 'breathe-quick 0.65s ease-in-out infinite', jitter: 'big', gaze: false },
  curiosa:    { eyes: [{ h: 62, w: 34, r: '17px', rot: -6, tx: -2, ty: -8 }, { h: 50, w: 32, r: '16px', rot: 2, tx: 0, ty: 2 }], color: '#534AB7', border: '#AFA9EC', breath: 'breathe-tilt 2.4s ease-in-out infinite', jitter: 'soft', gaze: true },
  pensando:   { eyes: [{ h: 44, w: 30, r: '15px', rot: 0, tx: 10, ty: 0 }, { h: 44, w: 30, r: '15px', rot: 0, tx: 10, ty: 0 }], color: '#3C3489', border: '#AFA9EC', breath: 'breathe-drift 5s ease-in-out infinite', jitter: 'soft', gaze: false },
  retando:    { eyes: [{ h: 18, w: 32, r: '999px', rot: 0, tx: 0, ty: -2 }, { h: 54, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }], color: '#534AB7', border: '#AFA9EC', breath: 'breathe-tilt-r 1.6s ease-in-out infinite', jitter: 'big', gaze: true },
  empatica:   { eyes: [{ h: 46, w: 36, r: '18px', rot: -4, tx: -2, ty: 6 }, { h: 46, w: 36, r: '18px', rot: 4, tx: 2, ty: 6 }], color: '#534AB7', border: '#AFA9EC', breath: 'breathe-deep 4.4s ease-in-out infinite', jitter: 'soft', gaze: true },
  seria:      { eyes: [{ h: 24, w: 36, r: '0 0 999px 999px', rot: 0, tx: 0, ty: 4 }, { h: 24, w: 36, r: '0 0 999px 999px', rot: 0, tx: 0, ty: 4 }], color: '#3C3489', border: '#7F77DD', breath: 'breathe-firm 4.2s ease-in-out infinite', jitter: 'soft', gaze: false },
  cerrando:   { eyes: [{ h: 50, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }, { h: 50, w: 34, r: '17px', rot: 0, tx: 0, ty: 0 }], color: '#BA7517', border: '#FAC775', breath: 'breathe-minimal 5.6s ease-in-out infinite', jitter: 'soft', gaze: true },
  feliz:      { eyes: [{ h: 20, w: 36, r: '999px 999px 0 0', rot: 0, tx: 0, ty: -8 }, { h: 20, w: 36, r: '999px 999px 0 0', rot: 0, tx: 0, ty: -8 }], color: '#1D9E75', border: '#9FE1CB', breath: 'breathe-slow 3s ease-in-out infinite', jitter: 'soft', gaze: false },
};

// Puntos de interés hacia donde EVA mira en reposo (offsets de la mirada en px).
// Sirven de guía visual: EVA "señala" con los ojos las zonas útiles de la UI.
const PUNTOS_INTERES = [
  { x: 0,  y: 0,  peso: 4 },   // al frente (a ti)
  { x: 8,  y: -6, peso: 2 },   // el timer (arriba derecha)
  { x: 0,  y: 8,  peso: 3 },   // los subtítulos (abajo centro)
  { x: -7, y: 7,  peso: 1 },   // la cámara PiP (abajo izquierda)
  { x: 6,  y: 7,  peso: 1 },   // controles (abajo derecha)
];

function Eva({ emocion = 'escuchando', size = 200, gaze = { x: 0, y: 0 }, halo = 0 }) {
  const e = EMOCIONES[emocion] || EMOCIONES.escuchando;
  const escala = size / 180;
  const gx = e.gaze ? gaze.x : 0;
  const gy = e.gaze ? gaze.y : 0;
  return (
    <div style={{ position: 'relative', width: size + 44, height: size + 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo reactivo al micrófono: feedback inmediato de "EVA te escucha" */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, rgba(124,58,237,0) 70%)',
        transform: `scale(${1 + halo * 0.35})`, opacity: 0.35 + halo * 0.65,
        transition: 'transform 0.12s ease-out, opacity 0.12s ease-out', pointerEvents: 'none',
      }} />
      <div className={e.jitter === 'big' ? 'eva-jit-big' : 'eva-jit-soft'}>
        <div style={{
          width: size, height: size, background: '#FCFBFF',
          border: `${Math.max(3 * escala, 2.5)}px solid ${e.border}`,
          borderRadius: 46 * escala, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 20 * escala,
          animation: e.breath, boxShadow: '0 8px 32px rgba(83,74,183,0.10)',
          transition: 'border-color 0.5s ease',
        }}>
          {e.eyes.map((eye, i) => (
            <div key={i} style={{
              display: 'flex',
              transform: `translate(${gx}px, ${gy}px)`,
              // Sacádico: arranque veloz, frenado suave (como los ojos reales)
              transition: 'transform 0.18s cubic-bezier(0.15, 0.85, 0.25, 1)',
            }}>
              <div style={{
                width: eye.w * escala, height: eye.h * escala, background: e.color,
                borderRadius: eye.r,
                transform: `rotate(${eye.rot}deg) translate(${eye.tx * escala}px, ${eye.ty * escala}px)`,
                transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Gestos emocionales por palabras de EVA (transcripción en vivo)
// ------------------------------------------------------------------
const GESTOS = [
  { emocion: 'riendo',   dur: 3500, palabras: ['jaja', 'jeje', 'qué bueno', 'me encanta', 'buenísim', 'qué graciós', 'me hiciste reír', 'qué divertido'] },
  { emocion: 'curiosa',  dur: 4000, palabras: ['cuéntame más', 'qué interesante', 'y qué pasó', 'cómo así', 'a ver, cuéntame', 'me interesa', 'en serio?', 'no me digas'] },
  { emocion: 'empatica', dur: 4500, palabras: ['lamento', 'entiendo cómo', 'debe haber sido', 'qué difícil', 'te entiendo', 'uf, eso'] },
  { emocion: 'seria',    dur: 5000, palabras: ['volvamos a', 'enfoquémonos', 'tomemos esto en serio', 'con seriedad', 'concentrémonos', 'te pido que'] },
  { emocion: 'retando',  dur: 4000, palabras: ['todo el mundo dice', 'puedes dar más', 'sorpréndeme', 'suena a manual', 'de verdad, de verdad'] },
];
function detectarGesto(texto) {
  const t = texto.toLowerCase();
  for (const g of GESTOS) if (g.palabras.some(p => t.includes(p))) return g;
  return null;
}

// ------------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------------
export default function EntrevistaVoz() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // cargando | bienvenida | consentimiento | encuadre | verificando | conectando | en_curso | finalizando | terminada | error
  const [fase, setFase] = useState('cargando');
  const [error, setError] = useState('');
  const [contexto, setContexto] = useState(null);
  const [acepta, setAcepta] = useState(false);
  const [verificaFallo, setVerificaFallo] = useState(false);
  const [emocionBase, setEmocionBase] = useState('escuchando');
  const [gesto, setGesto] = useState(null);
  const [segundos, setSegundos] = useState(null);
  const [caption, setCaption] = useState('');
  const [micActivo, setMicActivo] = useState(true);
  const [nivelMic, setNivelMic] = useState(0);      // 0..1 volumen de TU voz
  const [gaze, setGaze] = useState({ x: 0, y: 0 }); // hacia dónde miran los ojos

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const workletRef = useRef(null);
  const transcripcionRef = useRef([]);
  const timerRef = useRef(null);
  const capturaIntervalRef = useRef(null);
  const gestoTimeoutRef = useRef(null);
  const pensandoTimeoutRef = useRef(null);
  const videoRef = useRef(null);       // cámara (encuadre y PiP: mismo stream)
  const mixDestRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioListoRef = useRef(null);
  const micActivoRef = useRef(true);
  const cerrandoRef = useRef(false);
  const nextPlayTimeRef = useRef(0);   // reproducción agendada sin gaps
  const evaRef = useRef(null);         // posición de EVA para calcular la mirada
  const lastMouseRef = useRef(0);
  const gazeIntervalRef = useRef(null);
  const analyserRafRef = useRef(null);

  const emocionActual = gesto || (cerrandoRef.current && emocionBase !== 'hablando' && emocionBase !== 'pensando' ? 'cerrando' : emocionBase);

  // Reconectar el stream al <video> visible cuando cambia la fase
  // (encuadre y PiP son elementos distintos que comparten el mismo ref)
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current && videoRef.current.srcObject !== mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [fase]);

  // ---------------- 0. Contexto ----------------
  useEffect(() => {
    if (!token) { setError('Falta el token de acceso. Usa el enlace de tu correo.'); setFase('error'); return; }
    api.post('/api/evaluaciones/entrevista/acceso/', { token })
      .then(({ data }) => { setContexto(data); setFase('bienvenida'); })
      .catch(err => { setError(err.response?.data?.error || 'No se pudo validar tu acceso.'); setFase('error'); });
  }, [token]);

  // ---------------- Mirada natural: cursor + puntos de interés ----------------
  useEffect(() => {
    function onMouse(e) {
      lastMouseRef.current = Date.now();
      const el = evaRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const max = 7; // radio máximo de desplazamiento de la mirada
      const f = Math.min(1, dist / 260);
      setGaze({ x: (dx / dist) * max * f, y: (dy / dist) * max * f });
    }
    window.addEventListener('mousemove', onMouse);

    // En reposo (sin mouse >3.5s): mirar puntos de interés con pausas variables
    function elegirPunto() {
      const total = PUNTOS_INTERES.reduce((s, p) => s + p.peso, 0);
      let r = Math.random() * total;
      for (const p of PUNTOS_INTERES) { r -= p.peso; if (r <= 0) return p; }
      return PUNTOS_INTERES[0];
    }
    function cicloIdle() {
      if (Date.now() - lastMouseRef.current > 3500) {
        const p = elegirPunto();
        // micro-variación alrededor del punto (fijación imperfecta, como ojos reales)
        setGaze({ x: p.x + (Math.random() * 2 - 1), y: p.y + (Math.random() * 2 - 1) });
      }
      gazeIntervalRef.current = setTimeout(cicloIdle, 1400 + Math.random() * 1800);
    }
    gazeIntervalRef.current = setTimeout(cicloIdle, 2000);

    return () => { window.removeEventListener('mousemove', onMouse); clearTimeout(gazeIntervalRef.current); };
  }, []);

  function dispararGesto(g) {
    clearTimeout(gestoTimeoutRef.current);
    setGesto(g.emocion);
    gestoTimeoutRef.current = setTimeout(() => setGesto(null), g.dur);
  }

  // ---------------- 1. Consentimiento -> permisos -> encuadre ----------------
  async function continuarAConsentimiento() { setFase('consentimiento'); }

  async function pedirPermisos() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
        video: { width: 480, height: 360 },
      });
      mediaStreamRef.current = stream;
      setFase('encuadre');
      // montar el stream en el video cuando el elemento exista
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch {
      setError('Necesitamos tu micrófono y cámara para la entrevista. Habilita los permisos del navegador y reintenta.');
      setFase('error');
    }
  }

  // ---------------- 2. Encuadre: foto de identidad + validación IA ----------------
  function tomarFotoBase64() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 360;
    canvas.getContext('2d').drawImage(video, 0, 0, 480, 360);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  async function confirmarEncuadre() {
    setFase('verificando');
    setVerificaFallo(false);
    const foto = tomarFotoBase64();
    if (!foto) { setVerificaFallo(true); setFase('encuadre'); return; }
    try {
      const { data } = await api.post('/api/evaluaciones/entrevista/captura/', {
        token, imagen_base64: foto, tipo: 'identidad_inicial',
      });
      if (data.es_persona === false) {
        setVerificaFallo(true);
        setFase('encuadre');
        return;
      }
      await iniciarEntrevista();
    } catch {
      // Si la validación falla por red, no bloqueamos: seguimos (la foto quedó guardada)
      await iniciarEntrevista();
    }
  }

  // ---------------- 3. Iniciar ----------------
  async function iniciarEntrevista() {
    setFase('conectando');
    setEmocionBase('pensando');
    try {
      const { data } = await api.post('/api/evaluaciones/entrevista/iniciar/', { token });
      setSegundos(data.segundos_restantes);
      conectarGeminiLive(data);
      capturaIntervalRef.current = setInterval(() => capturarPeriodica(), 3 * 60 * 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar la entrevista.');
      setFase('error');
    }
  }

  async function capturarPeriodica() {
    try {
      const foto = tomarFotoBase64();
      if (!foto) return;
      await api.post('/api/evaluaciones/entrevista/captura/', { token, imagen_base64: foto, tipo: 'periodica' });
    } catch { /* nunca romper la entrevista por una captura */ }
  }

  // ---------------- 4. Gemini Live ----------------
  function conectarGeminiLive({ system_prompt, live_token, live_model }) {
    const ws = new WebSocket(`${LIVE_WS_URL}?access_token=${encodeURIComponent(live_token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        setup: {
          model: `models/${live_model}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
              languageCode: 'es-US',
            },
          },
          systemInstruction: { parts: [{ text: system_prompt }] },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          // Menos latencia: detectar antes que terminaste de hablar
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
              endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
              silenceDurationMs: 400,
            },
          },
        },
      }));
    };

    ws.onmessage = async (event) => {
      const raw = event.data instanceof Blob ? await event.data.text() : event.data;
      const msg = JSON.parse(raw);

      if (msg.setupComplete) {
        setFase('en_curso');
        setEmocionBase('pensando');
        iniciarTimer();
        // PASO 1: EVA saluda PRIMERO. Enviamos el disparador ANTES de encender
        // el micrófono, para que el ruido de fondo del candidato no active el
        // detector de voz y haga que Gemini se quede esperando.
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text: '[INICIO DE LA ENTREVISTA] Preséntate como EVA, saluda al candidato por su nombre con calidez, menciona brevemente el puesto al que postula, explícale en una frase que será una conversación natural, y hazle tu primera pregunta rompehielo. Habla tú ahora, no esperes respuesta previa.' }] }],
              turnComplete: true,
            },
          }));
        }
        // PASO 2: encender el micrófono un instante después, para que EVA tenga
        // el turno de palabra al inicio sin ser interrumpida por el VAD.
        setTimeout(() => { iniciarMicrofono(); }, 1200);
        return;
      }

      const c = msg.serverContent;
      if (!c) return;

      const partes = c.modelTurn?.parts || [];
      for (const p of partes) {
        if (p.inlineData?.data) encolarAudio(p.inlineData.data);
      }

      if (c.outputTranscription?.text) {
        agregarTranscripcion('EVA', c.outputTranscription.text);
        setEmocionBase('hablando');
        clearTimeout(pensandoTimeoutRef.current);
        setCaption(prev => (prev + c.outputTranscription.text).slice(-160));
        const g = detectarGesto(c.outputTranscription.text);
        if (g) dispararGesto(g);
      }
      if (c.inputTranscription?.text) {
        agregarTranscripcion('Candidato', c.inputTranscription.text);
      }
      if (c.turnComplete) {
        setEmocionBase('escuchando');
        setCaption('');
        clearTimeout(pensandoTimeoutRef.current);
        pensandoTimeoutRef.current = setTimeout(() => setEmocionBase('pensando'), 6000);
      }
      if (c.interrupted) {
        // El candidato interrumpió: cortar la reproducción pendiente al instante
        nextPlayTimeRef.current = 0;
        setEmocionBase('escuchando');
        setCaption('');
      }
    };

    ws.onerror = () => { setError('Se perdió la conexión de voz. Recarga para reintentar — tu progreso está guardado.'); setFase('error'); };
  }

  function agregarTranscripcion(quien, texto) {
    const arr = transcripcionRef.current;
    const ultimo = arr[arr.length - 1];
    if (ultimo && ultimo.quien === quien) ultimo.texto += texto;
    else arr.push({ quien, texto });
  }

  // ---------------- 5. Micrófono: PCM + medidor de nivel + grabación ----------------
  async function iniciarMicrofono() {
    const ctx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(mediaStreamRef.current);

    // Medidor de nivel (feedback "te escucho")
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    function medir() {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / buf.length);
      setNivelMic(micActivoRef.current ? Math.min(1, rms * 6) : 0);
      analyserRafRef.current = requestAnimationFrame(medir);
    }
    medir();

    // Grabación de la entrevista completa (candidato + EVA)
    const mixDest = ctx.createMediaStreamDestination();
    mixDestRef.current = mixDest;
    source.connect(mixDest);
    try {
      const recorder = new MediaRecorder(mixDest.stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      audioListoRef.current = new Promise((res) => {
        recorder.onstop = () => res(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      });
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch { mediaRecorderRef.current = null; }

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
      if (!micActivoRef.current) return;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(e.data)));
        wsRef.current.send(JSON.stringify({
          realtimeInput: { audio: { data: b64, mimeType: 'audio/pcm;rate=16000' } },
        }));
      }
    };
    source.connect(worklet);
  }

  function toggleMic() {
    micActivoRef.current = !micActivoRef.current;
    setMicActivo(micActivoRef.current);
  }

  // ---------------- 6. Reproducción agendada (sin gaps ni esperas) ----------------
  function encolarAudio(b64) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const pcm16 = new Int16Array(bytes.buffer);
    const f32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 0x8000;
    const buffer = ctx.createBuffer(1, f32.length, 24000);
    buffer.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    if (mixDestRef.current) src.connect(mixDestRef.current);
    // Agendar de forma continua: cada chunk empieza EXACTAMENTE cuando acaba
    // el anterior (nada de await -> cero micro-pausas entre chunks)
    const t = Math.max(ctx.currentTime + 0.04, nextPlayTimeRef.current);
    src.start(t);
    nextPlayTimeRef.current = t + buffer.duration;
  }

  // ---------------- 7. Timer ----------------
  function iniciarTimer() {
    timerRef.current = setInterval(() => {
      setSegundos(prev => {
        if (prev <= 1) { finalizar(); return 0; }
        if (prev === 300) {
          cerrandoRef.current = true;
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: '[SISTEMA: quedan 5 minutos. Empieza a cerrar la entrevista cubriendo los temas críticos pendientes.]' }] }],
                turnComplete: true,
              },
            }));
          }
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ---------------- 8. Finalizar ----------------
  const finalizar = useCallback(async () => {
    setFase('finalizando');
    setEmocionBase('pensando');
    clearInterval(timerRef.current);
    clearInterval(capturaIntervalRef.current);
    cancelAnimationFrame(analyserRafRef.current);
    try { wsRef.current?.close(); } catch { /* ok */ }
    try { workletRef.current?.disconnect(); } catch { /* ok */ }

    const transcripcion = transcripcionRef.current.map(t => `${t.quien}: ${t.texto.trim()}`).join('\n');

    let audioBase64 = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      try {
        const blob = await audioListoRef.current;
        audioBase64 = await new Promise((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result.split(',')[1]);
          r.readAsDataURL(blob);
        });
      } catch { audioBase64 = null; }
    }
    try { mediaStreamRef.current?.getTracks().forEach(tk => tk.stop()); } catch { /* ok */ }

    try {
      await api.post('/api/evaluaciones/entrevista/finalizar/', { token, transcripcion, audio_base64: audioBase64 });
      setFase('terminada');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la entrevista.');
      setFase('error');
    }
  }, [token]);

  // Auditoría del navegador durante la entrevista (copiar, salir, cambiar pestaña...)
  useEffect(() => {
    if (fase !== 'en_curso') return;
    function reportar(tipo, detalle) {
      api.post('/api/evaluaciones/entrevista/evento/', { token, tipo, detalle }).catch(() => {});
    }
    const onBlur = () => reportar('cambio_ventana', 'El candidato salió de la ventana de la entrevista');
    const onVisibility = () => { if (document.hidden) reportar('cambio_pestana', 'Cambió de pestaña u ocultó la ventana'); };
    const onCopy = () => reportar('copiar', 'Intento de copiar contenido');
    const onPaste = () => reportar('pegar', 'Intento de pegar contenido');
    const onContext = () => reportar('clic_derecho', 'Clic derecho durante la entrevista');
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
    };
  }, [fase, token]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(capturaIntervalRef.current);
    clearTimeout(gestoTimeoutRef.current);
    clearTimeout(pensandoTimeoutRef.current);
    clearTimeout(gazeIntervalRef.current);
    cancelAnimationFrame(analyserRafRef.current);
    try { wsRef.current?.close(); } catch { /* ok */ }
    try { mediaStreamRef.current?.getTracks().forEach(tk => tk.stop()); } catch { /* ok */ }
    try { if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop(); } catch { /* ok */ }
  }, []);

  const mm = String(Math.floor((segundos || 0) / 60)).padStart(2, '0');
  const ss = String((segundos || 0) % 60).padStart(2, '0');
  const enUltimos5 = segundos !== null && segundos <= 300;

  const estadoLabel = {
    escuchando: 'EVA te escucha — habla con confianza',
    hablando: 'EVA está hablando',
    pensando: 'EVA está pensando…',
    riendo: 'EVA se está riendo',
    curiosa: 'A EVA le interesó eso',
    empatica: 'EVA te entiende',
    seria: 'EVA pide retomar el enfoque',
    retando: 'EVA quiere escuchar más de ti',
    cerrando: 'Vamos cerrando la conversación',
    feliz: '',
  }[emocionActual] || '';

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div style={st.page}>
      <style>{cssGlobal}</style>

      {/* ---------- Header ---------- */}
      <header style={st.header}>
        <div style={st.headerLeft}>
          <div style={st.logoBox}><i className="ti ti-brain" style={{ fontSize: 18, color: '#fff' }} /></div>
          <span style={st.logoText}>MENTIS</span>
        </div>
        {fase === 'en_curso' && (
          <div style={{ ...st.timerPill, ...(enUltimos5 ? st.timerPillWarn : {}) }}>
            <i className="ti ti-clock" style={{ fontSize: 14 }} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
          </div>
        )}
      </header>

      {/* ---------- Escenario central ---------- */}
      <main style={st.stage}>

        {fase === 'cargando' && (
          <div style={st.centerCol}>
            <div ref={evaRef}><Eva emocion="pensando" size={160} gaze={gaze} /></div>
            <p style={st.softText}>Preparando tu entrevista…</p>
          </div>
        )}

        {fase === 'bienvenida' && contexto && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.5s ease both' }}>
            <div ref={evaRef}><Eva emocion="escuchando" size={190} gaze={gaze} /></div>
            <h1 style={st.h1}>Hola, {contexto.candidato?.nombre} 👋</h1>
            <p style={st.lead}>
              Soy <strong>EVA</strong>, y voy a conversar contigo sobre el puesto de{' '}
              <strong>{contexto.vacante?.titulo}</strong>.
            </p>
            <div style={st.infoRow}>
              <div style={st.infoChip}><i className="ti ti-microphone" style={st.chipIcon} />Conversación por voz</div>
              <div style={st.infoChip}><i className="ti ti-clock" style={st.chipIcon} />Hasta {contexto.duracion_minutos} minutos</div>
              <div style={st.infoChip}><i className="ti ti-message-heart" style={st.chipIcon} />Una charla, no un cuestionario</div>
            </div>
            <button style={st.ctaBtn} onClick={continuarAConsentimiento}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Continuar <i className="ti ti-arrow-right" style={{ fontSize: 16, verticalAlign: -2 }} />
            </button>
          </div>
        )}

        {fase === 'consentimiento' && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.4s ease both', maxWidth: 560 }}>
            <div ref={evaRef}><Eva emocion="escuchando" size={120} gaze={gaze} /></div>
            <h2 style={{ ...st.h1, fontSize: 20 }}>Antes de empezar: tus datos</h2>
            <div style={st.consentCard}>
              {[
                ['ti-microphone', 'Tu voz será procesada por una inteligencia artificial y la conversación quedará grabada (audio y transcripción) para su evaluación por el equipo de RRHH.'],
                ['ti-camera', 'Se tomarán capturas de tu cámara: una al inicio para verificar tu identidad, y algunas durante la entrevista como parte de la auditoría del proceso.'],
                ['ti-chart-bar', 'La IA analizará la conversación para generar una evaluación de tu perfil, que será revisada por personas del equipo de selección.'],
                ['ti-lock', 'Tus datos se usan únicamente para este proceso de selección.'],
              ].map(([icon, texto], i) => (
                <div key={i} style={st.consentItem}>
                  <i className={`ti ${icon}`} style={{ fontSize: 17, color: '#7c3aed', flexShrink: 0, marginTop: 2 }} />
                  <span>{texto}</span>
                </div>
              ))}
            </div>
            <label style={st.checkRow}>
              <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: '#7c3aed', cursor: 'pointer' }} />
              <span>He leído y acepto el tratamiento de mis datos descrito arriba.</span>
            </label>
            <button style={{ ...st.ctaBtn, marginTop: 18, opacity: acepta ? 1 : 0.45, cursor: acepta ? 'pointer' : 'not-allowed' }}
              disabled={!acepta} onClick={pedirPermisos}>
              Acepto — continuar <i className="ti ti-arrow-right" style={{ fontSize: 16, verticalAlign: -2 }} />
            </button>
          </div>
        )}

        {(fase === 'encuadre' || fase === 'verificando') && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.4s ease both' }}>
            <h2 style={{ ...st.h1, fontSize: 20, marginTop: 0 }}>Verifiquemos que eres tú</h2>
            <p style={{ ...st.lead, marginBottom: 16 }}>Ubícate frente a la cámara, con buena luz y tu rostro visible.</p>
            <div style={st.camFrame}>
              <video ref={videoRef} autoPlay muted playsInline style={st.camVideo} />
              <div style={st.camGuide} />
            </div>
            {verificaFallo && (
              <div style={st.verifyError}>
                <i className="ti ti-alert-circle" style={{ fontSize: 15 }} />
                No pudimos verte con claridad. Revisa que la cámara no esté tapada y que tu rostro esté bien iluminado.
              </div>
            )}
            <button style={{ ...st.ctaBtn, marginTop: 20, opacity: fase === 'verificando' ? 0.6 : 1 }}
              disabled={fase === 'verificando'} onClick={confirmarEncuadre}>
              {fase === 'verificando'
                ? <>Verificando… <i className="ti ti-loader-2" style={{ fontSize: 15, verticalAlign: -2, animation: 'spin 1s linear infinite' }} /></>
                : <>Estoy listo/a <i className="ti ti-check" style={{ fontSize: 16, verticalAlign: -2 }} /></>}
            </button>
          </div>
        )}

        {fase === 'conectando' && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.4s ease both' }}>
            <div ref={evaRef}><Eva emocion="pensando" size={180} gaze={gaze} /></div>
            <h2 style={{ ...st.h1, fontSize: 19 }}>Preparando tu entrevista…</h2>
            <p style={st.lead}>EVA está organizando la conversación. Esto toma solo unos segundos.</p>
            <div style={st.dotsLoader}>
              <span style={st.dot} /><span style={{ ...st.dot, animationDelay: '0.2s' }} /><span style={{ ...st.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {fase === 'en_curso' && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.4s ease both' }}>
            <div ref={evaRef}><Eva emocion={emocionActual} size={210} gaze={gaze} halo={nivelMic} /></div>
            <div style={st.escuchaChip}>
              {micActivo && nivelMic > 0.06
                ? <><MicBars nivel={nivelMic} /> <span>EVA te escucha</span></>
                : <span style={{ opacity: 0.85 }}>{estadoLabel}</span>}
            </div>
            <div style={st.captionBox}>
              {caption && <p style={st.caption}>“{caption}”</p>}
            </div>
          </div>
        )}

        {fase === 'finalizando' && (
          <div style={st.centerCol}>
            <div ref={evaRef}><Eva emocion="pensando" size={160} gaze={gaze} /></div>
            <p style={st.softText}>Guardando tu entrevista…</p>
          </div>
        )}

        {fase === 'terminada' && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.5s ease both' }}>
            <Eva emocion="feliz" size={190} />
            <h1 style={st.h1}>¡Eso fue todo! 🎉</h1>
            <p style={st.lead}>
              Gracias por la conversación. El equipo de RRHH revisará tu proceso completo
              y te contactará por correo con los próximos pasos.
            </p>
            <p style={st.hint}>Ya puedes cerrar esta ventana.</p>
          </div>
        )}

        {fase === 'error' && (
          <div style={{ ...st.centerCol, animation: 'fadeUp 0.4s ease both' }}>
            <Eva emocion="empatica" size={160} />
            <h2 style={{ ...st.h1, fontSize: 20 }}>Algo salió mal</h2>
            <p style={st.lead}>{error}</p>
            <button style={st.ctaBtn} onClick={() => window.location.reload()}>
              <i className="ti ti-refresh" style={{ fontSize: 15, verticalAlign: -2 }} /> Reintentar
            </button>
          </div>
        )}
      </main>

      {/* ---------- Cámara PiP durante la entrevista ---------- */}
      {fase === 'en_curso' && (
        <div style={st.pipWrap}>
          <video ref={videoRef} autoPlay muted playsInline style={st.pipVideo} />
          <div style={st.pipBadge}><span style={st.recDot} /> Cámara activa</div>
        </div>
      )}

      {/* ---------- Barra inferior ---------- */}
      {fase === 'en_curso' && (
        <footer style={st.footer}>
          <div style={st.footerLeft}>
            <span style={st.recDot} />
            <span style={st.footerText}>Verificación de identidad activa</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...st.iconBtn, ...(micActivo ? {} : st.iconBtnOff) }} onClick={toggleMic}
              title={micActivo ? 'Silenciar micrófono' : 'Activar micrófono'}>
              <i className={micActivo ? 'ti ti-microphone' : 'ti ti-microphone-off'} style={{ fontSize: 17 }} />
            </button>
            <button style={st.endBtn} onClick={finalizar}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              Terminar entrevista
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

// Barras de nivel del micrófono (feedback "te escucho")
function MicBars({ nivel }) {
  const alturas = [0.5, 1, 0.7].map(f => 5 + Math.round(nivel * 14 * f));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2.5, height: 18 }}>
      {alturas.map((h, i) => (
        <span key={i} style={{ width: 3.5, height: h, borderRadius: 2, background: '#7c3aed', transition: 'height 0.1s ease-out' }} />
      ))}
    </span>
  );
}

// ------------------------------------------------------------------
// Estilos
// ------------------------------------------------------------------
const st = {
  page: { minHeight: '100vh', background: '#f8f9fb', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logoBox: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontWeight: 700, fontSize: 15, color: '#111827', letterSpacing: '0.06em' },
  timerPill: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 14, fontWeight: 600, color: '#374151', transition: 'all 0.5s ease' },
  timerPillWarn: { background: '#FAEEDA', borderColor: '#FAC775', color: '#854F0B' },
  stage: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 24px 20px' },
  centerCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 520, gap: 4 },
  h1: { fontSize: 24, fontWeight: 700, color: '#111827', margin: '16px 0 4px', letterSpacing: '-0.01em' },
  lead: { fontSize: 15, color: '#4b5563', lineHeight: 1.65, margin: '4px 0 0' },
  hint: { fontSize: 12.5, color: '#9ca3af', lineHeight: 1.6, margin: '14px 0 0', maxWidth: 420 },
  softText: { fontSize: 14, color: '#6b7280', marginTop: 20 },
  dotsLoader: { display: 'flex', gap: 7, marginTop: 22 },
  dot: { width: 9, height: 9, borderRadius: '50%', background: '#7c3aed', animation: 'dotPulse 1.4s ease-in-out infinite' },
  escuchaChip: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 20, minHeight: 26, fontSize: 14.5, fontWeight: 600, color: '#374151' },
  captionBox: { minHeight: 52, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: 6 },
  caption: { fontSize: 13.5, color: '#6b7280', fontStyle: 'italic', lineHeight: 1.55, maxWidth: 460, margin: 0, animation: 'fadeUp 0.3s ease both' },
  infoRow: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', margin: '20px 0 0' },
  infoChip: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: '#374151' },
  chipIcon: { fontSize: 15, color: '#7c3aed' },
  ctaBtn: { marginTop: 24, padding: '13px 30px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(124,58,237,0.30)', transition: 'transform 0.15s ease, opacity 0.2s ease' },
  consentCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left', marginTop: 14 },
  consentItem: { display: 'flex', gap: 11, fontSize: 13, color: '#4b5563', lineHeight: 1.55 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 13, color: '#374151', cursor: 'pointer', textAlign: 'left' },
  camFrame: { position: 'relative', width: 400, maxWidth: '86vw', borderRadius: 20, overflow: 'hidden', border: '3px solid #AFA9EC', boxShadow: '0 8px 32px rgba(83,74,183,0.14)', background: '#111' },
  camVideo: { width: '100%', display: 'block', transform: 'scaleX(-1)' },
  camGuide: { position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: '52%', height: '84%', border: '2.5px dashed rgba(255,255,255,0.55)', borderRadius: '50% 50% 46% 46%', pointerEvents: 'none' },
  verifyError: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, maxWidth: 420, animation: 'fadeUp 0.3s ease both' },
  pipWrap: { position: 'fixed', left: 22, bottom: 84, borderRadius: 14, overflow: 'hidden', border: '2px solid #AFA9EC', boxShadow: '0 6px 24px rgba(0,0,0,0.18)', width: 148, background: '#111', animation: 'fadeUp 0.4s ease both' },
  pipVideo: { width: '100%', display: 'block', transform: 'scaleX(-1)' },
  pipBadge: { position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderTop: '1px solid #eef0f3', background: '#fff' },
  footerLeft: { display: 'flex', alignItems: 'center', gap: 9 },
  recDot: { width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2.4s ease-in-out infinite', display: 'inline-block' },
  footerText: { fontSize: 12.5, color: '#6b7280' },
  iconBtn: { width: 42, height: 42, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnOff: { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' },
  endBtn: { padding: '10px 20px', borderRadius: 12, border: '1px solid #fecaca', background: 'transparent', color: '#dc2626', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s ease' },
};

const cssGlobal = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes dotPulse { 0%,100% { transform: scale(0.7); opacity: 0.4; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes breathe-slow { 0%,100% { transform: scale(1); } 50% { transform: scale(1.025); } }
@keyframes breathe-active { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
@keyframes breathe-quick { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes breathe-tilt { 0%,100% { transform: rotate(-7deg) scale(1); } 50% { transform: rotate(-7deg) scale(1.03); } }
@keyframes breathe-tilt-r { 0%,100% { transform: rotate(4deg) scale(1); } 50% { transform: rotate(4deg) scale(1.035); } }
@keyframes breathe-drift { 0%,100% { transform: rotate(-3deg) scale(1); } 50% { transform: rotate(3deg) scale(1.02); } }
@keyframes breathe-deep { 0%,100% { transform: scale(1); } 50% { transform: scale(1.045); } }
@keyframes breathe-firm { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes breathe-minimal { 0%,100% { transform: scale(1); } 50% { transform: scale(1.012); } }
@keyframes eva-jit-soft-kf { 0%,100% { transform: translate(0,0) rotate(0); } 9% { transform: translate(0.6px,-0.4px) rotate(0.2deg); } 23% { transform: translate(-0.5px,0.4px) rotate(-0.3deg); } 38% { transform: translate(0.4px,0.5px) rotate(0.2deg); } 52% { transform: translate(-0.6px,-0.3px) rotate(-0.2deg); } 67% { transform: translate(0.5px,0.3px) rotate(0.3deg); } 81% { transform: translate(-0.4px,-0.5px) rotate(-0.2deg); } }
@keyframes eva-jit-big-kf { 0%,100% { transform: translate(0,0) rotate(0); } 14% { transform: translate(2px,-1.5px) rotate(1.2deg); } 29% { transform: translate(-1.8px,1.4px) rotate(-1.5deg); } 44% { transform: translate(1.6px,1.8px) rotate(1deg); } 58% { transform: translate(-2px,-1px) rotate(-1.3deg); } 73% { transform: translate(1.4px,1px) rotate(1.4deg); } 87% { transform: translate(-1.5px,-1.6px) rotate(-1deg); } }
.eva-jit-soft { animation: eva-jit-soft-kf 7s ease-in-out infinite; }
.eva-jit-big  { animation: eva-jit-big-kf 2.2s ease-in-out infinite; }
`;
