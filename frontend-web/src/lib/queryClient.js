// ==========================================
// frontend-web/src/lib/queryClient.js
// Configuración central del cache de datos del admin.
//
// Filosofía:
//  - staleTime alto (60s): los datos se consideran "frescos" por un minuto,
//    así que cambiar de sección y volver NO vuelve a pedir nada — se
//    muestra al instante desde el cache.
//  - Pasado ese minuto, la próxima vez que se use ese dato se refresca en
//    SEGUNDO PLANO (el usuario ve los datos viejos mientras llega lo nuevo,
//    sin pantallas de carga molestas) — esto es "stale-while-revalidate".
//  - Cuando el propio usuario crea/edita/borra algo, esa acción invalida
//    el cache correspondiente al instante (ver src/lib/queryKeys.js) —
//    así no hace falta "detectar cambios en la BD" con WebSockets: el único
//    que puede cambiar los datos desde este admin es el propio usuario, y
//    a ese caso lo cubrimos de forma exacta e inmediata.
// ==========================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 min: fresco, no vuelve a pedir
      gcTime: 10 * 60 * 1000,      // 10 min: tiempo que se guarda en memoria sin usarse
      refetchOnWindowFocus: true,  // al volver a la pestaña, revalida en segundo plano
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
