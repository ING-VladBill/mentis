// ==========================================
// frontend-web/src/lib/queryKeys.js
// Claves de cache centralizadas. Usar SIEMPRE estas funciones (nunca un
// array a mano) para que cuando una página invalide "candidatos", TODAS
// las variantes (lista, filtros, detalle) se enteren correctamente.
// ==========================================

export const qk = {
  vacantes: {
    all:    ['vacantes'],
    list:   () => ['vacantes', 'list'],
    detail: (id) => ['vacantes', 'detail', String(id)],
    abiertas: ['vacantes', 'abiertas'],
  },
  candidatos: {
    all:    ['candidatos'],
    list:   (params) => ['candidatos', 'list', params || {}],
    detail: (id) => ['candidatos', 'detail', String(id)],
    notas:  (id) => ['candidatos', String(id), 'notas'],
    bancoTalento: (params) => ['candidatos', 'banco-talento', params || {}],
  },
  evaluaciones: {
    all:    ['evaluaciones'],
    list:   (params) => ['evaluaciones', 'examenes', params || {}],
    detail: (id) => ['evaluaciones', 'examen-detalle', String(id)],
  },
  entrevistas: {
    all:    ['entrevistas'],
    list:   () => ['entrevistas', 'list'],
    detail: (id) => ['entrevistas', 'detail', String(id)],
    porCandidato: (candidatoId) => ['entrevistas', 'candidato', String(candidatoId)],
    capturas: (id) => ['entrevistas', String(id), 'capturas'],
  },
  auditoria: {
    all:  ['auditoria'],
    list: (params) => ['auditoria', 'list', params || {}],
  },
  ranking: {
    all:  ['ranking'],
    list: (vacanteId) => ['ranking', vacanteId ? String(vacanteId) : 'todas'],
  },
  areas: {
    all: ['areas'],
    activas: ['areas', 'activas'],
  },
  usuarios: {
    all: ['usuarios'],
  },
  tags: {
    all: ['tags'],
  },
  notificaciones: {
    noLeidas: ['notificaciones', 'no-leidas'],
  },
};
