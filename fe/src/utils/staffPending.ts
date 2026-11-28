/**
 * Archivo: utils/staffPending.ts
 * Descripción: Aviso interno de "cambió algo pendiente" para el panel de staff.
 * ¿Para qué? Que los números del menú lateral y la campanita se actualicen apenas el staff
 *   responde un síntoma o confirma una cita, sin esperar a recargar la página.
 * ¿Impacto? Es un evento del navegador: quien atiende algo lo dispara y quien muestra
 *   contadores lo escucha. No hace llamadas por sí mismo.
 */

const EVENT = 'staff:pendientes-cambiaron';

// ¿Qué? Avisa que un pendiente se resolvió o cambió.
export function notifyPendingChanged(): void {
  window.dispatchEvent(new Event(EVENT));
}

// ¿Qué? Ejecuta `callback` cada vez que alguien avisa. Devuelve la función para dejar de escuchar.
export function onPendingChanged(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
