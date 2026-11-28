/**
 * Archivo: utils/ids.ts
 * Descripción: Validación de identificadores que llegan en la URL.
 * ¿Para qué? Los ids de la BD son columnas `uuid` de PostgreSQL. Si llega un texto que no
 *   tiene forma de UUID, PostgreSQL rechaza la consulta y el API respondía 500.
 * ¿Impacto? Hallazgo de la semana 6 (capa Front, Santiago): DELETE /pets/me/no-es-uuid
 *   respondía 500. Con esta regla responde 404 con el formato del contrato.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ¿Qué? true solo si el texto tiene la forma 8-4-4-4-12 en hexadecimal (36 caracteres).
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
