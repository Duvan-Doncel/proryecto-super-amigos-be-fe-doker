/**
 * Archivo: tests/limits.test.ts
 * Descripción: Tests de los topes de números y listas de entrada (utils/limits.ts).
 * ¿Para qué? Comprobar que un valor fuera de rango responde 422 con un mensaje claro, en vez
 *   de llegar a la BD (500 por desbordar una columna) o cargarla a propósito.
 * ¿Impacto? Corre contra la BD de tests aislada (.env.test) — nunca la de desarrollo.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { loginTestStaff, loginTestUser } from './helpers.js';
import { LIMITS } from '../utils/limits.js';

const FAKE_ID = '00000000-0000-4000-8000-000000000000';

describe('Topes de entrada (422)', () => {
  it('rechaza un precio de producto mayor al tope', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Shampoo', price: LIMITS.maxMoney + 1, stock: 1 });

    expect(res.status).toBe(422);
  });

  it('rechaza una duración de servicio mayor a 10 horas', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Baño', price: 50000, durationMinutes: LIMITS.maxDurationMinutes + 1 });

    expect(res.status).toBe(422);
  });

  it('rechaza un pedido con una cantidad mayor al tope', async () => {
    const { accessToken } = await loginTestUser();
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ items: [{ productId: FAKE_ID, quantity: LIMITS.maxQuantity + 1 }] });

    expect(res.status).toBe(422);
  });

  it('rechaza un pedido con más líneas que el tope', async () => {
    const { accessToken } = await loginTestUser();
    const items = Array.from({ length: LIMITS.maxItems + 1 }, () => ({ productId: FAKE_ID, quantity: 1 }));
    const res = await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${accessToken}`).send({ items });

    expect(res.status).toBe(422);
  });

  it('rechaza un número de página absurdo en el listado de clientes', async () => {
    const { accessToken } = await loginTestStaff();
    const res = await request(app)
      .get(`/api/v1/staff/clients?page=${LIMITS.maxPage + 1}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(422);
  });
});
