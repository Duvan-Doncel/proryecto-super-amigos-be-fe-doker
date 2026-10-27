/**
 * Archivo: tests/api/appointments.api.test.ts
 * Descripción: Tests de API (supertest) del recurso principal: las citas de grooming.
 * ¿Para qué? Fijar el contrato HTTP de /api/v1/appointments — código de estado, cuerpo
 *   y Content-Type — en el caso feliz, validación e inexistente (semana 4, capa API).
 * ¿Impacto? La BD se simula con vi.mock: estos tests no necesitan Docker ni Postgres.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ¿Qué? Doble de Prisma — solo los métodos que usan los endpoints probados.
// ¿Para qué? Aislar la BD: el router, los middlewares y el service son reales.
vi.mock('../../db/index.js', () => ({
  db: {
    appointment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import app from '../../app.js';
import { db } from '../../db/index.js';
import { generateAccessToken } from '../../utils/security.js';

const dbMock = vi.mocked(db, true);

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const APPOINTMENT_ID = '22222222-2222-4222-8222-222222222222';

const clientToken = generateAccessToken(CLIENT_ID, 'cliente@groomingspa.com', 'client');
const staffToken = generateAccessToken('33333333-3333-4333-8333-333333333333', 'staff@groomingspa.com', 'staff');

// ¿Qué? Una cita tal como la devolvería Prisma.
function fakeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: APPOINTMENT_ID,
    clientId: CLIENT_ID,
    petId: '44444444-4444-4444-8444-444444444444',
    serviceId: '55555555-5555-4555-8555-555555555555',
    date: new Date('2026-11-03T00:00:00.000Z'),
    time: '10:00',
    status: 'pending',
    notes: null,
    totalPrice: 45000,
    priceBreakdown: null,
    createdAt: new Date('2026-10-27T12:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/v1/appointments/me', () => {
  it('should respond 200 with JSON list of the client appointments', async () => {
    dbMock.appointment.findMany.mockResolvedValue([fakeAppointment()] as never);

    const res = await request(app)
      .get('/api/v1/appointments/me')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: APPOINTMENT_ID,
      date: '2026-11-03',
      time: '10:00',
      status: 'pending',
      totalPrice: 45000,
    });
    // ¿Para qué? El service solo debe buscar las citas del cliente del token.
    expect(dbMock.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: CLIENT_ID } }),
    );
  });
});

describe('PUT /api/v1/appointments/:id', () => {
  it('should respond 200 with the updated appointment when staff confirms it', async () => {
    dbMock.appointment.findUnique.mockResolvedValue(fakeAppointment() as never);
    dbMock.appointment.update.mockResolvedValue(fakeAppointment({ status: 'confirmed' }) as never);

    const res = await request(app)
      .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { id: APPOINTMENT_ID, status: 'confirmed' } });
  });

  it('should respond 404 with NOT_FOUND when the appointment does not exist', async () => {
    dbMock.appointment.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Cita no encontrada.' },
    });
    expect(dbMock.appointment.update).not.toHaveBeenCalled();
  });

  it('should respond 422 with VALIDATION_ERROR when status is not allowed', async () => {
    const res = await request(app)
      .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'perdida' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    // ¿Para qué? Con datos inválidos ni siquiera se consulta la BD.
    expect(dbMock.appointment.findUnique).not.toHaveBeenCalled();
  });

  it('should respond 400 when the appointment is already in a final state', async () => {
    dbMock.appointment.findUnique.mockResolvedValue(fakeAppointment({ status: 'completed' }) as never);

    const res = await request(app)
      .put(`/api/v1/appointments/${APPOINTMENT_ID}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(dbMock.appointment.update).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/appointments', () => {
  it('should respond 422 when petId is not a valid UUID', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ petId: 'no-es-uuid', serviceId: '55555555-5555-4555-8555-555555555555', date: '2026-11-03', time: '10:00' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('petId');
  });
});