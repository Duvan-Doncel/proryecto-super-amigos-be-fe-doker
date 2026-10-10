/**
 * Archivo: tests/pets.test.ts
 * Descripción: Tests de integración de la gestión de mascotas por el propio cliente
 *   (POST/PUT/DELETE /api/v1/pets/me…) y de la subida de foto (RF-012).
 * ¿Impacto? Corre contra la BD de tests aislada (.env.test) — nunca la de desarrollo.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { loginTestUser, loginTestStaff, createVerifiedTestUser, TEST_USER } from './helpers.js';

const PET_PAYLOAD = { name: 'Firulais', species: 'canina', breed: 'Criollo' };

// ¿Qué? Registra y loguea un segundo cliente con email/documento propios — `loginTestUser`
//   solo sirve para el usuario por defecto (TEST_USER), así que los tests de "otro cliente"
//   crean el suyo directamente y usan la misma contraseña por defecto.
async function loginSecondClient(email: string, documentId: string): Promise<{ accessToken: string }> {
  await createVerifiedTestUser({ email, documentId });
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: TEST_USER.password });
  return res.body.data;
}

describe('POST /api/v1/pets/me', () => {
  it('el cliente registra su propia mascota (clientId sale del token)', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PET_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Firulais');
    expect(res.body.data.photoUrl).toBeNull();
  });

  it('ignora cualquier clientId enviado en el body', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...PET_PAYLOAD, clientId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(201);
    expect(res.body.data.clientId).not.toBe('00000000-0000-0000-0000-000000000000');
  });

  it('responde 403 para staff', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PET_PAYLOAD);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/v1/pets/me/:id y DELETE /api/v1/pets/me/:id', () => {
  it('el cliente edita una mascota propia', async () => {
    const { accessToken } = await loginTestUser();
    const created = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PET_PAYLOAD);

    const res = await request(app)
      .put(`/api/v1/pets/me/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ weight: 12.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.weight).toBe(12.5);
  });

  it('rechaza con 403 editar la mascota de OTRO cliente', async () => {
    const owner = await loginTestUser();
    const created = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(PET_PAYLOAD);

    const intruder = await loginSecondClient('intruso@groomingspa.com', '3000000001');

    const res = await request(app)
      .put(`/api/v1/pets/me/${created.body.data.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({ weight: 5 });

    expect(res.status).toBe(403);
  });

  it('el cliente elimina una mascota propia', async () => {
    const { accessToken } = await loginTestUser();
    const created = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PET_PAYLOAD);

    const res = await request(app)
      .delete(`/api/v1/pets/me/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const list = await request(app)
      .get('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.find((p: { id: string }) => p.id === created.body.data.id)).toBeUndefined();
  });
});

describe('POST /api/v1/pets/:id/photo', () => {
  it('el dueño sube una foto y queda disponible en photoUrl', async () => {
    const { accessToken } = await loginTestUser();
    const created = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PET_PAYLOAD);

    const res = await request(app)
      .post(`/api/v1/pets/${created.body.data.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), { filename: 'firulais.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.data.photoUrl).toMatch(/^\/uploads\/pets\/.+\.jpg$/);
  });

  it('rechaza subir foto a la mascota de OTRO cliente con 403', async () => {
    const owner = await loginTestUser();
    const created = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(PET_PAYLOAD);

    const intruder = await loginSecondClient('intruso2@groomingspa.com', '3000000002');

    const res = await request(app)
      .post(`/api/v1/pets/${created.body.data.id}/photo`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), { filename: 'x.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(403);
  });

  it('rechaza un archivo que no sea imagen', async () => {
    const { accessToken } = await loginTestUser();
    const created = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(PET_PAYLOAD);

    const res = await request(app)
      .post(`/api/v1/pets/${created.body.data.id}/photo`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('photo', Buffer.from('no soy una imagen'), { filename: 'x.txt', contentType: 'text/plain' });

    expect(res.status).toBe(422);
  });
});
