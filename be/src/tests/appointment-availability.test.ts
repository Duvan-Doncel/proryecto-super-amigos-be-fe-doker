/**
 * Archivo: tests/appointment-availability.test.ts
 * Descripción: Tests del tope diario de citas de grooming y de la disponibilidad por día
 *   (RF-009) — el local solo puede atender un número limitado de baños por día; cancelar
 *   una cita libera el cupo.
 */

import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app.js';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { DUMMY_PASSWORD_HASH } from '../utils/security.js';
import { loginTestStaff } from './helpers.js';

const DAILY_CAPACITY = 10;

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

async function createService() {
  return db.service.create({ data: { name: 'Baño completo', price: 40000, durationMinutes: 45 } });
}

async function createPet(clientId: string) {
  return db.pet.create({ data: { clientId, name: 'Firulais', species: 'canina' } });
}

// ¿Qué? Contador propio del archivo — evita colisiones de documentId/email (únicos en BD)
//   entre los muchos clientes de prueba que crea cada test de capacidad.
let userSeq = 4000000000;

// ¿Qué? Crea el usuario directo en BD (hash fijo, sin costo de bcrypt) y firma el access
//   token a mano en vez de pasar por register+login — con 10+ clientes por test, el costo
//   real de bcrypt en esos endpoints agota el timeout por defecto de cada `it`.
async function clientToken(): Promise<{ token: string; clientId: string }> {
  const seq = userSeq++;
  const user = await db.user.create({
    data: {
      documentId: String(seq),
      firstName: 'Cliente',
      lastName: `Prueba${seq}`,
      email: `cliente${seq}@groomingspa.com`,
      hashedPassword: DUMMY_PASSWORD_HASH,
      role: 'client',
      isEmailVerified: true,
    },
  });
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: 'client', type: 'access' },
    config.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );
  return { token, clientId: user.id };
}

function bookAt(token: string, petId: string, serviceId: string, date: string, time: string) {
  return request(app)
    .post('/api/v1/appointments')
    .set('Authorization', `Bearer ${token}`)
    .send({ petId, serviceId, date, time });
}

describe('Tope diario de citas — POST /api/v1/appointments', () => {
  it('permite agendar hasta la capacidad diaria y rechaza la siguiente con 400', async () => {
    const service = await createService();
    const date = futureDate(5);

    for (let i = 0; i < DAILY_CAPACITY; i++) {
      const { token, clientId } = await clientToken();
      const pet = await createPet(clientId);
      const time = `${String(9 + i).padStart(2, '0')}:00`;
      const res = await bookAt(token, pet.id, service.id, date, time);
      expect(res.status).toBe(201);
    }

    const { token: extraToken, clientId: extraClientId } = await clientToken();
    const extraPet = await createPet(extraClientId);
    const res = await bookAt(extraToken, extraPet.id, service.id, date, '17:00');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/cupos/i);
  });

  it('no cuenta las citas canceladas contra el tope', async () => {
    const service = await createService();
    const date = futureDate(6);

    for (let i = 0; i < DAILY_CAPACITY; i++) {
      const { token, clientId } = await clientToken();
      const pet = await createPet(clientId);
      const time = `${String(9 + i).padStart(2, '0')}:00`;
      const created = await bookAt(token, pet.id, service.id, date, time);
      expect(created.status).toBe(201);

      if (i === 0) {
        const { accessToken: staffToken } = await loginTestStaff();
        const cancelRes = await request(app)
          .put(`/api/v1/appointments/${created.body.data.id}`)
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ status: 'cancelled' });
        expect(cancelRes.status).toBe(200);
      }
    }

    const { token: freeToken, clientId: freeClientId } = await clientToken();
    const freePet = await createPet(freeClientId);
    const res = await bookAt(freeToken, freePet.id, service.id, date, '17:30');

    expect(res.status).toBe(201);
  });
});

describe('GET /api/v1/appointments/availability', () => {
  it('devuelve la capacidad y los cupos ocupados por día, sin contar canceladas', async () => {
    const service = await createService();
    const busyDate = futureDate(10);
    const emptyDate = futureDate(11);

    const { token, clientId } = await clientToken();
    const pet1 = await createPet(clientId);
    const pet2 = await createPet(clientId);
    const cancelledPet = await createPet(clientId);

    await bookAt(token, pet1.id, service.id, busyDate, '09:00');
    await bookAt(token, pet2.id, service.id, busyDate, '10:00');
    const toCancel = await bookAt(token, cancelledPet.id, service.id, busyDate, '11:00');
    const { accessToken: staffToken } = await loginTestStaff();
    await request(app)
      .put(`/api/v1/appointments/${toCancel.body.data.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'cancelled' });

    const res = await request(app)
      .get('/api/v1/appointments/availability')
      .query({ from: futureDate(1), to: futureDate(12) })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.capacity).toBe(DAILY_CAPACITY);
    const busy = res.body.data.days.find((d: { date: string }) => d.date === busyDate);
    expect(busy?.booked).toBe(2);
    expect(res.body.data.days.find((d: { date: string }) => d.date === emptyDate)).toBeUndefined();
  });

  it('responde 403 para staff (el endpoint es solo de cliente)', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .get('/api/v1/appointments/availability')
      .query({ from: futureDate(1), to: futureDate(5) })
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});
