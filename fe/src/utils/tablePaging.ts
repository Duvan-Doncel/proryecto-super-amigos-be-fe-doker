/**
 * Archivo: utils/tablePaging.ts
 * Descripción: Helper compartido para la columna "#" de numeración de fila en las tablas.
 * ¿Para qué? Todas las tablas de la app (paginadas en cliente o en servidor) numeran sus
 *   filas de forma continua a través de las páginas, no reiniciando en 1 en cada página.
 */

export function rowNumber(page: number, pageSize: number, index: number): number {
  return (page - 1) * pageSize + index + 1;
}
