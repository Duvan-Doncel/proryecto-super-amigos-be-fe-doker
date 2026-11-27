/**
 * Archivo: tests/clients-deactivation.test.ts
 * Descripción: Tests de integración de la baja y reactivación de clientes por el staff.
 * ¿Para qué? Asegurar que dar de baja a un cliente lo saca de la lista activa y le quita
 *   el acceso, SIN borrar su historial; y que sus citas futuras y pedidos pendientes se
 *   cancelan devolviendo el stock reservado.
 * ¿Impacto? Corre contra la BD de tests aislada (.env.test) — nunca la de desarrollo.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { db } from '../db/index.js';
import { TEST_USER, createVerifiedTestUser, loginTestStaff, loginTestUser, createVerifiedStaffUser } from './helpers.js';

function isoDate(daysFromToday: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday));
}

// ¿Qué? Cliente con una mascota, una cita pasada completada, una cita futura pendiente y un
//   pedido pendiente que reservó 2 unidades de un producto.
async function seedClientWithHistory() {
  const client = await createVerifiedTestUser();
  const pet = await db.pet.create({ data: { clientId: client.id, name: 'Milo', species: 'canina' } });
  const service = await db.service.create({ data: { name: 'Baño', price: 50000, durationMinutes: 60 } });
  const past = await db.appointment.create({
    data: { clientId: client.id, petId: pet.id, serviceId: service.id, date: isoDate(-10), time: '10:00', status: 'completed' },
  });
  const future = await db.appointment.create({
    data: { clientId: client.id, petId: pet.id, serviceId: service.id, date: isoDate(5), time: '11:00', status: 'pending' },
  });
  const product = await db.product.create({ data: { name: 'Snack', price: 10000, stock: 3 } });
  const order = await db.order.create({
    data: {
      clientId: client.id,
      total: 20000,
      items: { create: [{ productId: product.id, quantity: 2, unitPrice: 10000 }] },
    },
  });
  return { client, pet, past, future, product, order };
}

describe('POST /api/v1/staff/clients/:id/deactivate', () => {
  it('da de baja al cliente, conserva su historial y cancela lo pendiente', async () => {
    const { client, pet, past, future, product, order } = await seedClientWithHistory();
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Se mudó de ciudad' });

    expect(res.status).toBe(200);
    expect(res.body.data.deactivatedAt).toBeTruthy();
    expect(res.body.data.deactivationReason).toBe('Se mudó de ciudad');
    expect(res.body.data.cancelledAppointments).toBe(1);
    expect(res.body.data.cancelledOrders).toBe(1);

    // Historial intacto: el usuario, su mascota y la cita pasada siguen en la BD.
    expect(await db.user.findUnique({ where: { id: client.id } })).not.toBeNull();
    expect(await db.pet.findUnique({ where: { id: pet.id } })).not.toBeNull();
    expect((await db.appointment.findUnique({ where: { id: past.id } }))?.status).toBe('completed');

    // Lo pendiente se canceló y el stock reservado volvió.
    expect((await db.appointment.findUnique({ where: { id: future.id } }))?.status).toBe('cancelled');
    expect((await db.order.findUnique({ where: { id: order.id } }))?.status).toBe('cancelled');
    expect((await db.product.findUnique({ where: { id: product.id } }))?.stock).toBe(5);
  });

  it('saca al cliente de la lista activa y lo muestra en ?status=inactive', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();
    await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    const active = await request(app).get('/api/v1/staff/clients').set('Authorization', `Bearer ${accessToken}`);
    const inactive = await request(app)
      .get('/api/v1/staff/clients?status=inactive')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(active.body.data.some((c: { id: string }) => c.id === client.id)).toBe(false);
    expect(inactive.body.data.some((c: { id: string }) => c.id === client.id)).toBe(true);
  });

  it('impide que el cliente dado de baja inicie sesión (403)', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();
    await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(login.status).toBe(403);
    expect(login.body.error.message).toMatch(/dada de baja/);
  });

  it('no deja renovar la sesión de un cliente dado de baja (401)', async () => {
    const { refreshToken } = await loginTestUser();
    const client = await db.user.findUniqueOrThrow({ where: { email: TEST_USER.email } });
    const { accessToken } = await loginTestStaff();
    await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(401);
  });

  it('responde 409 si el cliente ya estaba dado de baja', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();
    const url = `/api/v1/staff/clients/${client.id}/deactivate`;
    await request(app).post(url).set('Authorization', `Bearer ${accessToken}`).send({});

    const res = await request(app).post(url).set('Authorization', `Bearer ${accessToken}`).send({});

    expect(res.status).toBe(409);
  });

  it('responde 404 para una cuenta de staff o un id inválido', async () => {
    const { accessToken } = await loginTestStaff();
    const otherStaff = await createVerifiedStaffUser({ email: 'otro.staff@groomingspa.com' });

    const staffRes = await request(app)
      .post(`/api/v1/staff/clients/${otherStaff.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    const badIdRes = await request(app)
      .post('/api/v1/staff/clients/no-es-un-uuid/deactivate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(staffRes.status).toBe(404);
    expect(badIdRes.status).toBe(404);
  });

  it('responde 403 si lo intenta un cliente', async () => {
    const { accessToken } = await loginTestUser();
    const client = await db.user.findUniqueOrThrow({ where: { email: TEST_USER.email } });

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/staff/clients/:id/reactivate', () => {
  it('devuelve el acceso a un cliente dado de baja', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();
    await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Error del staff' });

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/reactivate`)
      .set('Authorization', `Bearer ${accessToken}`);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.data.deactivatedAt).toBeNull();
    expect(login.status).toBe(200);
  });

  it('responde 409 si el cliente ya está activo', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/reactivate`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(409);
  });
});

describe('Límites del motivo de la baja', () => {
  it('rechaza un motivo con etiquetas HTML (422) y no da de baja', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: '<script>alert(1)</script>' });

    expect(res.status).toBe(422);
    expect((await db.user.findUnique({ where: { id: client.id } }))?.deactivatedAt).toBeNull();
  });

  it('rechaza un motivo de más de 300 caracteres (422)', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'a'.repeat(301) });

    expect(res.status).toBe(422);
  });

  it('colapsa los espacios repetidos del motivo', async () => {
    const client = await createVerifiedTestUser();
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .post(`/api/v1/staff/clients/${client.id}/deactivate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: '  Se   mudó\n\nde ciudad  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.deactivationReason).toBe('Se mudó de ciudad');
  });
});
