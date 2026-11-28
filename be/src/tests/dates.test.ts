/**
 * Archivo: tests/dates.test.ts
 * Descripción: Tests de la validación de fechas de entrada (utils/limits.ts → isoDate, dateRange).
 * ¿Para qué? Antes solo se validaba el formato AAAA-MM-DD:
 *   - "2026-13-45" hacía fallar la consulta con 500;
 *   - "2026-02-30" se aceptaba y JavaScript lo convertía en silencio al 2 de marzo;
 *   - un rango al revés devolvía vacío sin avisar y uno de miles de años recorría toda la tabla.
 * ¿Impacto? Unitarios para la función pura + integración contra la BD de tests aislada.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { isRealCalendarDate } from '../utils/limits.js';
import { loginTestStaff, loginTestUser } from './helpers.js';

describe('isRealCalendarDate', () => {
  it.each(['2026-01-31', '2028-02-29', '2026-12-31'])('acepta %s', (d) => {
    expect(isRealCalendarDate(d)).toBe(true);
  });

  it.each(['2026-13-01', '2026-02-30', '2026-02-29', '2026-04-31', '2026-00-10', '2026-1-1', 'hoy'])(
    'rechaza %s',
    (d) => {
      expect(isRealCalendarDate(d)).toBe(false);
    },
  );
});

describe('GET /api/v1/appointments/availability — fechas inválidas', () => {
  it.each([
    ['mes 13', 'from=2026-13-01&to=2026-13-20'],
    ['30 de febrero', 'from=2026-02-30&to=2026-03-10'],
    ['rango al revés', 'from=2026-12-31&to=2026-12-01'],
    ['rango gigante', 'from=2026-01-01&to=2026-12-31'],
    ['año fuera de rango', 'from=0001-01-01&to=0001-01-31'],
  ])('responde 422 con %s', async (_caso, query) => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .get(`/api/v1/appointments/availability?${query}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(422);
  });

  it('sigue aceptando un mes normal', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .get('/api/v1/appointments/availability?from=2026-12-01&to=2026-12-31')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});

describe('Otras fechas de entrada', () => {
  it('la agenda del staff responde 422 con una fecha imposible', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .get('/api/v1/staff/agenda?date=2026-02-30')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(422);
  });

  it('el reporte de ventas responde 422 con un rango al revés', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .get('/api/v1/staff/sales-report?from=2026-11-30&to=2026-11-01')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(422);
  });

  it('el reporte de ventas acepta un año completo', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .get('/api/v1/staff/sales-report?from=2026-01-01&to=2026-12-31')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });

  it('agendar una cita el 30 de febrero responde 422', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        petId: '00000000-0000-4000-8000-000000000000',
        serviceId: '00000000-0000-4000-8000-000000000000',
        date: '2027-02-30',
        time: '10:00',
      });

    expect(res.status).toBe(422);
  });
});
