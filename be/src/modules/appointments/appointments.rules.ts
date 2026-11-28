/**
 * Archivo: modules/appointments/appointments.rules.ts
 * Descripción: Reglas de negocio puras del agendamiento de citas (RN-092, RN-093 y tope diario).
 * ¿Para qué? Separar las reglas de la BD para poder probarlas con tests unitarios rápidos.
 * ¿Impacto? La fecha de "hoy" llega por parámetro (FIRST: Repeatable).
 */

export const OPENING_MINUTES = 9 * 60; // 9:00 a.m.
export const CLOSING_MINUTES = 18 * 60; // 6:00 p.m.

// ¿Qué? Tope de citas que el local puede atender en un mismo día (las canceladas no cuentan).
export const DAILY_APPOINTMENT_CAPACITY = 10;

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ¿Qué? Fecha mínima permitida (mañana, a partir de `today`) en formato AAAA-MM-DD — RN-092.
export function minimumAllowedDate(today: Date): string {
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return toDateOnly(tomorrow);
}

// ¿Qué? RN-092: true si la fecha es mañana o posterior respecto a `today`.
export function isDateAllowed(date: string, today: Date): boolean {
  return date >= minimumAllowedDate(today);
}

// ¿Qué? Convierte "HH:mm" a minutos desde medianoche.
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h! * 60 + m!;
}

// ¿Qué? RN-093: true si la hora está dentro del horario de atención, ambos extremos incluidos.
export function isWithinBusinessHours(time: string): boolean {
  const minutes = toMinutes(time);
  return minutes >= OPENING_MINUTES && minutes <= CLOSING_MINUTES;
}

// ¿Qué? true si todavía queda cupo en un día con `booked` citas no canceladas.
export function hasDailyCapacity(booked: number): boolean {
  return booked < DAILY_APPOINTMENT_CAPACITY;
}