/**
 * Archivo: tests/appointments.rules.test.ts
 * Descripción: Tests unitarios de las reglas de agendamiento (RN-092, RN-093 y tope diario).
 * ¿Para qué? Verificar los valores límite de cada regla sin pasar por HTTP: la frontera
 *   del horario (9:00 / 18:00), la frontera de "a partir de mañana" y el cupo número 10.
 * ¿Impacto? "Hoy" se fija por parámetro, así que el resultado no cambia según el día en que
 *   se corra el suite (FIRST: Repeatable).
 */

import { describe, it, expect } from 'vitest';
import {
  hasDailyCapacity,
  isDateAllowed,
  isWithinBusinessHours,
  minimumAllowedDate,
} from '../modules/appointments/appointments.rules.js';

// ¿Qué? "Hoy" fijo para todos los tests: 24 de octubre de 2026 al mediodía (UTC).
const TODAY = new Date('2026-10-24T12:00:00.000Z');

describe('RN-093: horario de atención (9:00 a 18:00)', () => {
  it.each([
    ['08:59', false], // un minuto antes de abrir
    ['09:00', true], // justo al abrir (límite inferior incluido)
    ['13:30', true], // partición válida
    ['18:00', true], // justo al cerrar (límite superior incluido)
    ['18:01', false], // un minuto después de cerrar
  ])('la hora %s → permitida: %s', (time, expected) => {
    expect(isWithinBusinessHours(time)).toBe(expected);
  });
});

describe('RN-092: la cita debe ser a partir de mañana', () => {
  it('calcula mañana a partir del "hoy" recibido', () => {
    expect(minimumAllowedDate(TODAY)).toBe('2026-10-25');
  });

  it('cruza correctamente el cambio de mes', () => {
    expect(minimumAllowedDate(new Date('2026-10-31T12:00:00.000Z'))).toBe('2026-11-01');
  });

  it.each([
    ['2026-10-23', false], // ayer
    ['2026-10-24', false], // hoy (justo debajo del límite)
    ['2026-10-25', true], // mañana (límite incluido)
    ['2026-12-01', true], // partición futura
  ])('la fecha %s → permitida: %s', (date, expected) => {
    expect(isDateAllowed(date, TODAY)).toBe(expected);
  });
});

describe('Tope diario de 10 citas', () => {
  it.each([
    [0, true], // día vacío
    [9, true], // queda el último cupo
    [10, false], // día lleno (límite exacto)
    [11, false], // por encima del tope
  ])('con %i citas agendadas → queda cupo: %s', (booked, expected) => {
    expect(hasDailyCapacity(booked)).toBe(expected);
  });
});