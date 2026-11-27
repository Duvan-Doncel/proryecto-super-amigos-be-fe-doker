/**
 * Archivo: utils/limits.ts
 * Descripción: Topes de validación compartidos para números y listas que llegan del cliente.
 * ¿Para qué? Ningún número ni lista de entrada debe quedar sin máximo. Sin tope:
 *   - un precio enorme desborda la columna Decimal(10,2) y la API responde 500 en vez de 422;
 *   - una lista con miles de productos o `?page=999999999` cargan la BD a propósito (DoS);
 *   - una cantidad gigante deja el stock en valores absurdos.
 * ¿Impacto? Cambiar un tope aquí lo cambia en todos los schemas que lo usan. Los valores son
 *   holgados para el negocio real (un spa de barrio) y muy por debajo de los límites de la BD.
 */

import { z } from 'zod';

export const LIMITS = {
  // Decimal(10,2) admite hasta 99.999.999,99 — se deja margen.
  maxMoney: 9_999_999,
  maxQuantity: 999,
  maxStock: 99_999,
  // Un servicio de grooming no dura más de 10 horas.
  maxDurationMinutes: 600,
  maxDaysWithSymptom: 365,
  // Líneas de un pedido, venta o pedido a proveedor.
  maxItems: 50,
  maxPage: 10_000,
  maxEmergencyPhones: 20,
} as const;

// ¿Qué? Validadores numéricos reutilizables con su tope y mensaje en español.
export const moneyField = (label = 'El precio') =>
  z.coerce
    .number()
    .positive(`${label} debe ser mayor a 0.`)
    .max(LIMITS.maxMoney, `${label} no puede superar ${LIMITS.maxMoney.toLocaleString('es-CO')}.`);

export const quantityField = () =>
  z.coerce
    .number()
    .int()
    .positive('La cantidad debe ser mayor a 0.')
    .max(LIMITS.maxQuantity, `La cantidad no puede superar ${LIMITS.maxQuantity}.`);

export const pageField = () => z.coerce.number().int().min(1).max(LIMITS.maxPage).default(1);

// ¿Qué? Texto libre "seguro": sin caracteres de control ni etiquetas HTML (< >), con los
//   espacios repetidos colapsados.
// ¿Para qué? Defensa en profundidad para textos que el staff escribe y luego se muestran en
//   pantalla. React ya escapa el HTML y Prisma usa consultas parametrizadas (sin inyección SQL),
//   pero así el dato guardado queda limpio aunque mañana se muestre en otro lugar (un correo,
//   un PDF, un reporte exportado).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
export const safeText = (max: number) =>
  z
    .string()
    .max(max, `No puede superar ${max} caracteres.`)
    .refine((v) => !CONTROL_CHARS.test(v), 'Contiene caracteres no permitidos.')
    .refine((v) => !/[<>]/.test(v), 'No se permiten los signos < ni >.')
    .transform((v) => v.replace(/\s+/g, ' ').trim());

// ─────────────── Fechas ───────────────

// ¿Qué? Años aceptados en cualquier fecha de entrada.
// ¿Para qué? Evitar fechas absurdas (año 0001, 9999) que no tienen sentido para el negocio y
//   que, en un rango, obligan a recorrer toda la tabla.
export const DATE_LIMITS = { minYear: 2020, maxYear: 2100 } as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// ¿Qué? ¿La cadena AAAA-MM-DD es un día que existe en el calendario?
// ¿Para qué? El formato solo no basta: "2026-13-45" hacía fallar la consulta con 500 y
//   "2026-02-30" JavaScript lo convertía en silencio al 2 de marzo (una cita quedaba en otro
//   día). Se comprueba armando la fecha en UTC y verificando que año, mes y día no cambiaron.
export function isRealCalendarDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

// ¿Qué? Validador de una fecha AAAA-MM-DD real y dentro de los años permitidos.
// ¿Impacto? Devuelve UN solo mensaje, el del primer problema, en este orden: formato → año
//   fuera de rango → día inexistente. (El año va antes porque `Date.UTC` trata los años
//   0–99 como 1900–1999, y "0001-01-01" saldría como "no existe" en vez de "fuera de rango".)
export const isoDate = (label = 'La fecha') =>
  z.string().superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (!ISO_DATE.test(v)) return fail(`${label} debe tener el formato AAAA-MM-DD.`);
    const year = Number(v.slice(0, 4));
    if (year < DATE_LIMITS.minYear || year > DATE_LIMITS.maxYear) {
      return fail(`${label} debe estar entre ${DATE_LIMITS.minYear} y ${DATE_LIMITS.maxYear}.`);
    }
    if (!isRealCalendarDate(v)) return fail(`${label} no existe en el calendario.`);
  });

const bothReal = (r: { from: string; to: string }) => isRealCalendarDate(r.from) && isRealCalendarDate(r.to);

// ¿Qué? Días entre dos fechas AAAA-MM-DD ya validadas (to - from).
function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
}

// ¿Qué? Rango { from, to } con fechas reales, `from` ≤ `to` y como mucho `maxDays` días.
// ¿Para qué? Un rango al revés devolvía vacío sin avisar, y uno de miles de años recorría
//   toda la tabla.
export const dateRange = (maxDays: number) =>
  z
    .object({ from: isoDate('La fecha inicial'), to: isoDate('La fecha final') })
    // ¿Qué? Si alguna fecha ya es inválida, zod igual corre estos refine (el objeto queda
    //   "sucio", no abortado): se omiten para no sumar mensajes falsos sobre el rango.
    .refine((r) => !bothReal(r) || daysBetween(r.from, r.to) >= 0, {
      message: 'La fecha inicial no puede ser posterior a la final.',
      path: ['from'],
    })
    .refine((r) => !bothReal(r) || daysBetween(r.from, r.to) <= maxDays, {
      message: `El rango no puede superar ${maxDays} días.`,
      path: ['to'],
    });
