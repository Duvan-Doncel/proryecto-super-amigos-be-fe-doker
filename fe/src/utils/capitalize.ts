/**
 * Archivo: utils/capitalize.ts
 * Descripción: Pone en mayúscula la primera letra de lo que se escribe en una caja de texto.
 * ¿Para qué? Que nombres, razas, direcciones y notas queden bien escritos ("Luna", no
 *   "luna") sin depender de que el usuario se acuerde.
 * ¿Impacto? Solo cambia la primera letra; el resto queda como el usuario lo escribió.
 */

// ¿Qué? Campos donde una mayúscula estorba: correos, contraseñas, códigos y búsquedas.
const NO_CAPITALIZE = /(email|correo|password|search|query|buscar|code|codigo|token|url|user)/i;

// ¿Qué? Decide si un campo de texto debe empezar en mayúscula, según su id, name y autoComplete.
export function shouldCapitalize(type: string | undefined, ...hints: Array<string | undefined>): boolean {
  if (type !== undefined && type !== 'text') return false;
  return !hints.some((h) => h && NO_CAPITALIZE.test(h));
}

// ¿Qué? Cambia la primera letra del campo a mayúscula, sin mover el cursor.
// ¿Para qué? Se llama antes del onChange del formulario, que así ya recibe el valor corregido.
export function capitalizeFirstLetter(el: HTMLInputElement | HTMLTextAreaElement): void {
  const value = el.value;
  const first = value.charAt(0);
  const upper = first.toLocaleUpperCase('es-CO');
  if (first === upper) return;
  const { selectionStart, selectionEnd } = el;
  el.value = upper + value.slice(1);
  if (selectionStart !== null && selectionEnd !== null) el.setSelectionRange(selectionStart, selectionEnd);
}
