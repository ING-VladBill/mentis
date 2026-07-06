import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { qk } from '../lib/queryKeys';

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STEPS = [
  { id: 1, label: 'Lo básico',    icon: 'ti-briefcase',    desc: 'Título, área y tipo de vacante'        },
  { id: 2, label: 'El puesto',    icon: 'ti-file-text',    desc: 'Descripción, requisitos y beneficios'  },
  { id: 3, label: 'Condiciones',  icon: 'ti-building',     desc: 'Modalidad, salario y horario'          },
  { id: 4, label: 'Configuración',icon: 'ti-robot',        desc: 'Parámetros del proceso con IA'         },
];

const INITIAL = {
  // Paso 1
  titulo: '', area: '', industria: 'otro',
  motivo_vacante: 'nuevo_puesto', nombre_reemplazado: '',
  jefe_directo: '', solicitante: '', cantidad_posiciones: 1,
  confidencial: false, fecha_limite: '',
  estado: 'borrador', prioridad: 'media',
  // Paso 2
  descripcion: '', responsabilidades: '', requisitos: '',
  requisitos_deseables: '', beneficios: '',
  habilidades: '', tecnologias: '', conocimientos_especificos: '',
  // Paso 3
  nivel_experiencia: 'semi_senior', anios_experiencia: 0,
  modalidad: 'presencial', tipo_contrato: 'indefinido',
  ciudad: 'Lima', pais: 'Perú', ubicacion: '',
  horario: '', horario_tipo: 'tiempo_completo',
  salario_minimo: '', salario_maximo: '', moneda: 'PEN', mostrar_salario: false,
  // Paso 4
  score_cv_minimo: 60, nota_minima_examen: 13, top_candidatos_finalistas: 5,
};

// Campos requeridos por paso para validación
const REQUIRED_BY_STEP = {
  1: ['titulo', 'area'],
  2: ['descripcion', 'requisitos'],
  3: ['ciudad'],
  4: [],
};

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTES AUXILIARES (fuera del componente principal — rerender-no-inline)
// ═══════════════════════════════════════════════════════════════════════════════

// Indicador de pasos
function StepIndicator({ steps, currentStep, completedSteps, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {steps.map((step, idx) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent   = currentStep === step.id;
        const isFuture    = currentStep < step.id && !isCompleted;

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 'none' }}>
            {/* Nodo del paso */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, transition: 'all 0.25s',
                background: isCompleted
                  ? 'linear-gradient(135deg,#34d399,#10b981)'
                  : isCurrent
                  ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                  : t.toggleBg,
                color: isCompleted || isCurrent ? '#fff' : t.textFaint,
                boxShadow: isCurrent ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
                border: isFuture ? `2px solid ${t.cardBorder}` : 'none',
              }}>
                {isCompleted
                  ? <i className="ti ti-check" style={{ fontSize: 17 }} />
                  : <i className={`ti ${step.icon}`} style={{ fontSize: 17 }} />
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? t.text : isFuture ? t.textFaint : t.textMuted, transition: 'color 0.2s' }}>
                  {step.label}
                </div>
              </div>
            </div>

            {/* Línea conectora */}
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: '0 8px', marginBottom: 28, background: isCompleted ? '#34d399' : t.divider, transition: 'background 0.35s', borderRadius: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Campo de formulario
function Field({ label, required, hint, t, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 550, color: t.textMuted, marginBottom: 7, letterSpacing: '0.01em' }}>
        {label}{required && <span style={{ color: '#f87171', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

// Botones de navegación
function NavButtons({ step, totalSteps, onBack, onNext, onSubmit, saving, t }) {
  const isLast = step === totalSteps;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: `1px solid ${t.divider}` }}>
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          border: `1px solid ${t.cardBorder}`, background: 'transparent',
          color: step === 1 ? t.textFaint : t.textMuted,
          fontSize: 13.5, cursor: step === 1 ? 'not-allowed' : 'pointer',
          opacity: step === 1 ? 0.4 : 1, transition: 'all 0.15s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (step > 1) e.currentTarget.style.color = t.text; }}
        onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Anterior
      </button>

      <div style={{ display: 'flex', gap: 8 }}>
        {/* Puntos de progreso */}
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{
            width: i + 1 === step ? 20 : 7, height: 7, borderRadius: 4,
            background: i + 1 < step ? '#34d399' : i + 1 === step ? '#7c3aed' : t.toggleBg,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }} />
        ))}
      </div>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: saving ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.3)',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {saving && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
          {saving ? 'Guardando...' : <><i className="ti ti-check" style={{ fontSize: 15 }} /> {saving ? 'Guardando...' : 'Guardar vacante'}</>}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Siguiente <i className="ti ti-arrow-right" style={{ fontSize: 15 }} />
        </button>
      )}
    </div>
  );
}

// Chip de opción (para selects visuales tipo radio)
function OptionChip({ value, current, label, icon, onChange, t }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 9, cursor: 'pointer',
        border: active ? '1.5px solid rgba(124,58,237,0.6)' : `1px solid ${t.cardBorder}`,
        background: active ? 'rgba(124,58,237,0.1)' : t.inputBg,
        color: active ? '#a78bfa' : t.textMuted,
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'all 0.15s', fontFamily: 'inherit', flex: 1,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = t.text; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = t.cardBorder; e.currentTarget.style.color = t.textMuted; } }}
    >
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 16 }} />}
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PASOS DEL WIZARD (fuera del componente — rerender-no-inline)
// ═══════════════════════════════════════════════════════════════════════════════

function Paso1({ form, setForm, areas, inp, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Título + área */}
      <Field label="Título del puesto" required t={t}>
        <input
          value={form.titulo}
          onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
          style={inp} placeholder="Ej: Desarrollador Backend Senior"
          onFocus={e => e.target.style.borderColor = '#7c3aed'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Área" required t={t}>
          <select
            value={form.area}
            onChange={e => setForm(prev => ({ ...prev, area: e.target.value }))}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="">— Selecciona —</option>
            {areas.map(a => <option key={a.id} value={a.id}>[{a.codigo_corto}] {a.nombre}</option>)}
          </select>
        </Field>
        <Field label="Prioridad" t={t}>
          <select
            value={form.prioridad}
            onChange={e => setForm(prev => ({ ...prev, prioridad: e.target.value }))}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">🔴 Urgente</option>
          </select>
        </Field>
      </div>

      {/* Motivo */}
      <Field label="¿Por qué se abre esta vacante?" t={t}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { value: 'nuevo_puesto', label: 'Puesto nuevo',    icon: 'ti-plus' },
            { value: 'reemplazo',   label: 'Reemplazo',       icon: 'ti-replace' },
            { value: 'expansion',   label: 'Expansión',       icon: 'ti-trending-up' },
            { value: 'campana',     label: 'Campaña',         icon: 'ti-calendar-event' },
          ].map(op => (
            <OptionChip key={op.value} value={op.value} current={form.motivo_vacante} label={op.label} icon={op.icon} onChange={v => setForm(prev => ({ ...prev, motivo_vacante: v }))} t={t} />
          ))}
        </div>
      </Field>

      {/* Reemplazado — solo si motivo = reemplazo (derived state) */}
      {form.motivo_vacante === 'reemplazo' && (
        <Field label="¿A quién reemplaza?" t={t}>
          <input
            value={form.nombre_reemplazado}
            onChange={e => setForm(prev => ({ ...prev, nombre_reemplazado: e.target.value }))}
            style={inp} placeholder="Nombre del colaborador"
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Jefe directo" t={t}>
          <input
            value={form.jefe_directo}
            onChange={e => setForm(prev => ({ ...prev, jefe_directo: e.target.value }))}
            style={inp} placeholder="Ej: María López — Gerente TI"
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        <Field label="N° de posiciones" t={t}>
          <input
            type="number" min={1} value={form.cantidad_posiciones}
            onChange={e => setForm(prev => ({ ...prev, cantidad_posiciones: Number(e.target.value) }))}
            style={inp}
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Fecha límite" t={t}>
          <input
            type="date" value={form.fecha_limite}
            onChange={e => setForm(prev => ({ ...prev, fecha_limite: e.target.value }))}
            style={inp}
          />
        </Field>
        <Field label="Estado inicial" t={t}>
          <select
            value={form.estado}
            onChange={e => setForm(prev => ({ ...prev, estado: e.target.value }))}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="borrador">Borrador</option>
            <option value="abierta">Publicar ahora</option>
          </select>
        </Field>
      </div>

      {/* Confidencial */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 16px', borderRadius: 10, border: `1px solid ${form.confidencial ? 'rgba(251,191,36,0.3)' : t.cardBorder}`, background: form.confidencial ? 'rgba(251,191,36,0.06)' : 'transparent', transition: 'all 0.15s' }}>
        <input
          type="checkbox" checked={form.confidencial}
          onChange={e => setForm(prev => ({ ...prev, confidencial: e.target.checked }))}
          style={{ width: 16, height: 16, accentColor: '#fbbf24', cursor: 'pointer' }}
        />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: form.confidencial ? '#fbbf24' : t.text }}>
            <i className="ti ti-eye-off" style={{ marginRight: 6 }} />
            Vacante confidencial
          </div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2 }}>No se mostrará el nombre de la empresa al candidato</div>
        </div>
      </label>
    </div>
  );
}

function Paso2({ form, setForm, inp, t }) {
  const ta = { ...inp, resize: 'vertical', lineHeight: 1.65 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <Field label="Descripción del puesto" required t={t} hint="Presenta el rol, el equipo y el contexto. Sé específico para atraer el perfil correcto.">
        <textarea
          rows={5} value={form.descripcion}
          onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
          style={ta} placeholder="Buscamos un profesional apasionado que..."
          onFocus={e => e.target.style.borderColor = '#7c3aed'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </Field>

      <Field label="Requisitos obligatorios" required t={t} hint="Un requisito por línea. Sé realista — pedir demasiado aleja a buenos candidatos.">
        <textarea
          rows={4} value={form.requisitos}
          onChange={e => setForm(prev => ({ ...prev, requisitos: e.target.value }))}
          style={ta} placeholder="Ejemplo de Bachiller o Titulado en Sistemas&#10;Ejemplo de 2+ años con Python&#10;Inglés intermedio"
          onFocus={e => e.target.style.borderColor = '#7c3aed'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </Field>

      <Field label="Responsabilidades" t={t}>
        <textarea
          rows={3} value={form.responsabilidades}
          onChange={e => setForm(prev => ({ ...prev, responsabilidades: e.target.value }))}
          style={ta} placeholder="Principales tareas del cargo..."
          onFocus={e => e.target.style.borderColor = '#7c3aed'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </Field>

      {/* Deseables y beneficios lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Requisitos deseables" t={t} hint="Opcional — suman pero no excluyen">
          <textarea
            rows={3} value={form.requisitos_deseables}
            onChange={e => setForm(prev => ({ ...prev, requisitos_deseables: e.target.value }))}
            style={ta} placeholder="Conocimientos que suman..."
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        <Field label="Beneficios" t={t}>
          <textarea
            rows={3} value={form.beneficios}
            onChange={e => setForm(prev => ({ ...prev, beneficios: e.target.value }))}
            style={ta} placeholder="Seguro médico, horario flexible..."
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
      </div>

      {/* Habilidades y tecnologías */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Habilidades clave" t={t} hint="Separadas por comas">
          <input
            value={form.habilidades}
            onChange={e => setForm(prev => ({ ...prev, habilidades: e.target.value }))}
            style={inp} placeholder="Trabajo en equipo, Liderazgo..."
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        <Field label="Tecnologías" t={t} hint="Separadas por comas">
          <input
            value={form.tecnologias}
            onChange={e => setForm(prev => ({ ...prev, tecnologias: e.target.value }))}
            style={inp} placeholder="Python, React, MySQL..."
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
      </div>
    </div>
  );
}

function Paso3({ form, setForm, inp, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Nivel y modalidad como chips */}
      <Field label="Nivel de experiencia" t={t}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { value: 'practicante', label: 'Practicante' },
            { value: 'junior',      label: 'Junior'      },
            { value: 'semi_senior', label: 'Semi Senior' },
            { value: 'senior',      label: 'Senior'      },
            { value: 'lider',       label: 'Tech Lead'   },
          ].map(op => (
            <OptionChip key={op.value} value={op.value} current={form.nivel_experiencia} label={op.label} onChange={v => setForm(prev => ({ ...prev, nivel_experiencia: v }))} t={t} />
          ))}
        </div>
      </Field>

      <Field label="Modalidad" t={t}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'presencial', label: 'Presencial', icon: 'ti-building'      },
            { value: 'remoto',     label: 'Remoto',     icon: 'ti-home'          },
            { value: 'hibrido',    label: 'Híbrido',    icon: 'ti-building-arch' },
          ].map(op => (
            <OptionChip key={op.value} value={op.value} current={form.modalidad} label={op.label} icon={op.icon} onChange={v => setForm(prev => ({ ...prev, modalidad: v }))} t={t} />
          ))}
        </div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Tipo de contrato" t={t}>
          <select
            value={form.tipo_contrato}
            onChange={e => setForm(prev => ({ ...prev, tipo_contrato: e.target.value }))}
            style={{ ...inp, cursor: 'pointer' }}
          >
            <option value="indefinido">Indefinido</option>
            <option value="plazo_fijo">Plazo fijo</option>
            <option value="practicas">Prácticas</option>
            <option value="freelance">Freelance</option>
            <option value="part_time">Part-time</option>
          </select>
        </Field>
        <Field label="Años mínimos de experiencia" t={t}>
          <input
            type="number" min={0} value={form.anios_experiencia}
            onChange={e => setForm(prev => ({ ...prev, anios_experiencia: Number(e.target.value) }))}
            style={inp}
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Ciudad" required t={t}>
          <input
            value={form.ciudad}
            onChange={e => setForm(prev => ({ ...prev, ciudad: e.target.value }))}
            style={inp} placeholder="Lima"
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
        <Field label="Ubicación exacta" t={t}>
          <input
            value={form.ubicacion}
            onChange={e => setForm(prev => ({ ...prev, ubicacion: e.target.value }))}
            style={inp} placeholder="Ej: San Isidro, Torre Parque Mar"
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </Field>
      </div>

      <Field label="Horario" t={t}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { value: 'tiempo_completo', label: 'Tiempo completo' },
            { value: 'medio_tiempo',    label: 'Medio tiempo'   },
            { value: 'flexible',        label: 'Flexible'       },
            { value: 'turnos',          label: 'Por turnos'     },
          ].map(op => (
            <OptionChip key={op.value} value={op.value} current={form.horario_tipo} label={op.label} onChange={v => setForm(prev => ({ ...prev, horario_tipo: v }))} t={t} />
          ))}
        </div>
      </Field>

      {/* Salario — solo si mostrar_salario */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox" checked={form.mostrar_salario}
          onChange={e => setForm(prev => ({ ...prev, mostrar_salario: e.target.checked }))}
          style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer' }}
        />
        <span style={{ fontSize: 13.5, color: t.text }}>Mostrar rango salarial al candidato</span>
      </label>

      {form.mostrar_salario && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 14, animation: 'fadeIn 0.2s ease' }}>
          <Field label="Salario mínimo" t={t}>
            <input
              type="number" value={form.salario_minimo}
              onChange={e => setForm(prev => ({ ...prev, salario_minimo: e.target.value }))}
              style={inp} placeholder="2000"
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </Field>
          <Field label="Salario máximo" t={t}>
            <input
              type="number" value={form.salario_maximo}
              onChange={e => setForm(prev => ({ ...prev, salario_maximo: e.target.value }))}
              style={inp} placeholder="4000"
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </Field>
          <Field label="Moneda" t={t}>
            <select
              value={form.moneda}
              onChange={e => setForm(prev => ({ ...prev, moneda: e.target.value }))}
              style={{ ...inp, cursor: 'pointer' }}
            >
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}

function Paso4({ form, setForm, inp, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Aviso contextual */}
      <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', gap: 12 }}>
        <i className="ti ti-robot" style={{ fontSize: 20, color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: t.text, marginBottom: 4 }}>¿Para qué sirve esto?</div>
          <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.65 }}>
            La IA analiza cada CV automáticamente. Estos parámetros definen el filtro mínimo — los candidatos que no los superen son descartados antes de llegar a tu bandeja.
          </div>
        </div>
      </div>

      {/* Score mínimo de CV */}
      <Field label="Score mínimo de CV" t={t} hint="Sobre 100. Candidatos con score menor son rechazados automáticamente.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range" min={0} max={100} step={5} value={form.score_cv_minimo}
            onChange={e => setForm(prev => ({ ...prev, score_cv_minimo: Number(e.target.value) }))}
            style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          <div style={{ width: 52, textAlign: 'center', padding: '6px 10px', borderRadius: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 15, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
            {form.score_cv_minimo}
          </div>
        </div>
      </Field>

      {/* Nota mínima examen */}
      <Field label="Nota mínima del examen" t={t} hint="Sobre 20. Nota mínima para avanzar a entrevista.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range" min={0} max={20} step={1} value={form.nota_minima_examen}
            onChange={e => setForm(prev => ({ ...prev, nota_minima_examen: Number(e.target.value) }))}
            style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          <div style={{ width: 52, textAlign: 'center', padding: '6px 10px', borderRadius: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 15, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
            {form.nota_minima_examen}
          </div>
        </div>
      </Field>

      {/* Top finalistas */}
      <Field label="Candidatos finalistas" t={t} hint="Los N mejores candidatos que avanzan a entrevista presencial.">
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 5, 8, 10].map(n => (
            <OptionChip
              key={n} value={n} current={form.top_candidatos_finalistas}
              label={`Top ${n}`}
              onChange={v => setForm(prev => ({ ...prev, top_candidatos_finalistas: v }))}
              t={t}
            />
          ))}
        </div>
      </Field>

      {/* Resumen del paso 4 */}
      <div style={{ padding: '16px 18px', borderRadius: 12, background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: t.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Resumen del filtro</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: 'ti-file-cv',    label: 'CV con score menor a',   value: `${form.score_cv_minimo}/100`, color: '#60a5fa' },
            { icon: 'ti-checklist', label: 'Examen menor a',           value: `${form.nota_minima_examen}/20`, color: '#fbbf24' },
            { icon: 'ti-trophy',    label: 'Finalistas seleccionados', value: `Top ${form.top_candidatos_finalistas}`, color: '#34d399' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: t.textMuted, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 14, color }} /> {label}
              </span>
              <span style={{ fontWeight: 700, color: t.text }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function VacanteForm() {
  const { t } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]         = useState(INITIAL);
  const [areas, setAreas]       = useState([]);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [step, setStep]         = useState(1);
  const [completed, setCompleted] = useState(new Set());
  const [direction, setDirection] = useState('forward'); // para animación

  // Estilos base de inputs (stable reference)
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 9, padding: '10px 13px',
    fontSize: 13.5, color: t.text,
    outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit',
    colorScheme: 'dark',
  };

  // El catálogo de áreas activas se cachea (se repite cada vez que se abre
  // este formulario); la vacante a editar se sigue pidiendo fresca cada vez.
  const { data: areasCache } = useQuery({
    queryKey: qk.areas.activas,
    queryFn: async () => {
      const { data } = await api.get('/api/areas/activas/');
      return data;
    },
  });

  useEffect(() => {
    const fetchVacante = isEdit
      ? api.get(`/api/vacantes/${id}/`).then(r => r.data).catch(() => null)
      : Promise.resolve(null);

    fetchVacante.then((vacanteData) => {
      setAreas(areasCache || []);
      if (vacanteData) {
        // Fix: campos con "" reemplazados por default de INITIAL
        const merged = { ...INITIAL, ...vacanteData };
        Object.keys(INITIAL).forEach(key => {
          if (merged[key] === '' && typeof INITIAL[key] === 'string' && INITIAL[key] !== '') {
            merged[key] = INITIAL[key];
          }
        });
        setForm({
          ...merged,
          area: vacanteData.area?.id || vacanteData.area || '',
          salario_minimo: vacanteData.salario_minimo ?? '',
          salario_maximo: vacanteData.salario_maximo ?? '',
          fecha_limite: vacanteData.fecha_limite || '',
        });
      }
      setLoading(false);
    });
  }, [id, isEdit, areasCache]);

  // Validación por paso — js-early-exit
  function validateStep(stepNum) {
    const required = REQUIRED_BY_STEP[stepNum] || [];
    for (const field of required) {
      if (!form[field] || form[field] === '') return false;
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) {
      setError('Completa los campos obligatorios antes de continuar.');
      return;
    }
    setError(null);
    setDirection('forward');
    setCompleted(prev => new Set([...prev, step]));
    setStep(s => Math.min(STEPS.length, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setError(null);
    setDirection('back');
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // useCallback para estabilidad de referencia — rerender-memo
  const handleSubmit = useCallback(async () => {
    if (!validateStep(step)) {
      setError('Completa los campos obligatorios.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      salario_minimo: form.salario_minimo === '' ? null : form.salario_minimo,
      salario_maximo: form.salario_maximo === '' ? null : form.salario_maximo,
      fecha_limite:   form.fecha_limite === '' ? null : form.fecha_limite,
      anios_experiencia: Number(form.anios_experiencia),
      cantidad_posiciones: Number(form.cantidad_posiciones),
    };
    try {
      if (isEdit) await api.put(`/api/vacantes/${id}/`, payload);
      else        await api.post('/api/vacantes/', payload);
      navigate('/vacantes');
    } catch (err) {
      const d = err.response?.data;
      setError(d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : 'Error al guardar. Revisa los campos.'
      );
    } finally {
      setSaving(false);
    }
  }, [form, isEdit, id, step, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const stepProps = { form, setForm, areas, inp, t };
  const currentStepInfo = STEPS[step - 1];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', color: t.text }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes slideInBack { from { opacity: 0; transform: translateX(-24px) } to { opacity: 1; transform: translateX(0) } }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 13, color: t.textMuted }}>
        <button onClick={() => navigate('/vacantes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = t.text}
          onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} /> Vacantes
        </button>
        <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
        <span style={{ color: t.text }}>{isEdit ? 'Editar vacante' : 'Nueva vacante'}</span>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={STEPS} currentStep={step} completedSteps={completed} t={t} />

      {/* Card del paso actual */}
      <div style={{
        background: t.card, border: `1px solid ${t.cardBorder}`,
        borderRadius: 16, padding: '28px 32px',
        animation: `${direction === 'forward' ? 'slideIn' : 'slideInBack'} 0.25s cubic-bezier(0.23,1,0.32,1)`,
      }}>
        {/* Header del paso */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${t.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${currentStepInfo.icon}`} style={{ fontSize: 17, color: '#7c3aed' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{currentStepInfo.label}</div>
              <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 1 }}>{currentStepInfo.desc}</div>
            </div>
          </div>
        </div>

        {/* Error global */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 15px', marginBottom: 20, color: '#f87171', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}

        {/* Contenido del paso */}
        {step === 1 && <Paso1 {...stepProps} />}
        {step === 2 && <Paso2 {...stepProps} />}
        {step === 3 && <Paso3 {...stepProps} />}
        {step === 4 && <Paso4 {...stepProps} />}

        {/* Navegación */}
        <NavButtons
          step={step}
          totalSteps={STEPS.length}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          saving={saving}
          t={t}
        />
      </div>
    </div>
  );
}