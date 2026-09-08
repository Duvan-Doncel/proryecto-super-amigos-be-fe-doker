/**
 * Archivo: tests/users.test.ts
 * Descripción: Tests de integración del perfil de usuario (RF-007) y del listado de
 *   clientes paginado del staff (RF-012).
 * ¿Impacto? Corre contra la BD de tests aislada (.env.test) — nunca la de desarrollo.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { loginTestUser, loginTestStaff, createVerifiedTestUser } from './helpers.js';

describe('GET /api/v1/users/me', () => {
  it('devuelve el perfil del usuario autenticado sin la contraseña', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('hashedPassword');
    expect(res.body.data.email).toBe('test@groomingspa.com');
  });

  it('responde 401 sin token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/users/me', () => {
  it('actualiza nombre, apellido y teléfono del propio usuario', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Nuevo', lastName: 'Nombre', phone: '3009998877' });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Nuevo');
    expect(res.body.data.lastName).toBe('Nombre');
    expect(res.body.data.phone).toBe('3009998877');
  });

  it('rechaza un teléfono inválido con 422', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ phone: 'abc' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rechaza un body vacío con 422', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('no permite cambiar el email por esta vía (lo ignora)', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Ana', email: 'hacker@evil.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@groomingspa.com');
  });
});

describe('GET /api/v1/staff/clients', () => {
  it('devuelve la lista paginada con meta y petCount', async () => {
    await createVerifiedTestUser({ email: 'cliente1@groomingspa.com', documentId: '2000000001' });
    await createVerifiedTestUser({ email: 'cliente2@groomingspa.com', documentId: '2000000002' });
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .get('/api/v1/staff/clients?page=1&limit=1')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    expect(res.body.data[0]).toHaveProperty('petCount');
  });

  it('filtra por texto con ?q=', async () => {
    await createVerifiedTestUser({
      email: 'zoraida@groomingspa.com',
      firstName: 'Zoraida',
      documentId: '2000000003',
    });
    const { accessToken } = await loginTestStaff();

    const res = await request(app)
      .get('/api/v1/staff/clients?q=zoraida')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((c: { firstName: string }) => /zoraida/i.test(c.firstName))).toBe(true);
  });

  it('responde 403 para un cliente (no-staff)', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .get('/api/v1/staff/clients')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });
});
