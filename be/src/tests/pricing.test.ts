/**
 * Archivo: tests/pricing.test.ts
 * Descripción: Tests del motor de precios del grooming (RF-014) y del estimador (RF-009).
 * ¿Para qué? Verificar que precio base + tamaño + pelo + condiciones de piel + comportamiento
 *   se sumen bien (con recargos propios por especie), y que un factor que bloquea impida
 *   agendar y derive al reporte de síntoma.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { db } from '../db/index.js';
import { createVerifiedTestUser, loginTestStaff, TEST_USER } from './helpers.js';
import type { PetSpecies } from '@prisma/client';

async function createService(base: number) {
  return db.service.create({ data: { name: 'Baño completo', price: base, durationMinutes: 45 } });
}

async function createPet(clientId: string, attrs: Record<string, unknown> = {}) {
  return db.pet.create({
    data: { clientId, name: 'Firulais', species: 'canina', ...attrs },
  });
}

async function sizeMod(serviceId: string, species: PetSpecies, size: 'pequeno' | 'mediano' | 'grande' | 'gigante', amount: number) {
  return db.serviceSizeModifier.create({ data: { serviceId, species, size, amount } });
}
async function coatMod(serviceId: string, species: PetSpecies, coatType: 'corto' | 'largo', amount: number) {
  return db.serviceCoatModifier.create({ data: { serviceId, species, coatType, amount } });
}

async function clientToken(): Promise<string> {
  await createVerifiedTestUser();
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: TEST_USER.email, password: TEST_USER.password });
  return res.body.data.accessToken;
}

describe('Motor de precios — POST /api/v1/appointments/quote', () => {
  let token: string;
  let clientId: string;

  beforeEach(async () => {
    const user = await createVerifiedTestUser();
    clientId = user.id;
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    token = res.body.data.accessToken;
  });

  const quote = (petId: string, serviceId: string) =>
    request(app)
      .post('/api/v1/appointments/quote')
      .set('Authorization', `Bearer ${token}`)
      .send({ petId, serviceId });

  it('sin modificadores el total es el precio base', async () => {
    const service = await createService(40000);
    const pet = await createPet(clientId);

    const res = await quote(pet.id, service.id);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(40000);
    expect(res.body.data.lines).toHaveLength(0);
    expect(res.body.data.blocked).toBe(false);
  });

  it('suma tamaño + pelo largo + pulgas + comportamiento nervioso', async () => {
    const service = await createService(40000);
    await sizeMod(service.id, 'canina', 'grande', 22000);
    await coatMod(service.id, 'canina', 'largo', 10000);
    const pet = await createPet(clientId, {
      size: 'grande',
      coatType: 'largo',
      behavior: 'nervioso',
      skinConditions: { create: [{ type: 'pulgas' }] },
    });

    const res = await quote(pet.id, service.id);
    // 40000 + 22000 grande + 10000 pelo largo + 18000 pulgas + 15000 nervioso
    expect(res.body.data.total).toBe(105000);
    expect(res.body.data.lines).toHaveLength(4);
    expect(res.body.data.blocked).toBe(false);
  });

  it('usa el recargo de gato, no el de perro, para un gato', async () => {
    const service = await createService(30000);
    await sizeMod(service.id, 'canina', 'grande', 40000);
    await sizeMod(service.id, 'felina', 'grande', 12000);
    // Gato de 6 kg → "grande" según los tramos felinos sembrados (≤7).
    const pet = await createPet(clientId, { species: 'felina', name: 'Michi', weight: 6 });

    const res = await quote(pet.id, service.id);
    expect(res.body.data.total).toBe(42000); // usa el 12000 felino
  });

  it('marca blocked=true cuando el comportamiento es agresivo', async () => {
    const service = await createService(40000);
    const pet = await createPet(clientId, { behavior: 'agresivo' });

    const res = await quote(pet.id, service.id);
    expect(res.status).toBe(200);
    expect(res.body.data.blocked).toBe(true);
    expect(res.body.data.blockingConditions.join(' ')).toMatch(/agresivo/i);
  });

  it('marca blocked=true cuando la mascota tiene hongos', async () => {
    const service = await createService(40000);
    const pet = await createPet(clientId, { skinConditions: { create: [{ type: 'hongos' }] } });

    const res = await quote(pet.id, service.id);
    expect(res.body.data.blocked).toBe(true);
    expect(res.body.data.blockingConditions).toContain('Hongos');
  });
});

describe('Agendamiento con precio — POST /api/v1/appointments', () => {
  let token: string;
  let clientId: string;

  beforeEach(async () => {
    const user = await createVerifiedTestUser();
    clientId = user.id;
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    token = res.body.data.accessToken;
  });

  function tomorrow(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  it('congela totalPrice y priceBreakdown en la cita', async () => {
    const service = await createService(40000);
    await db.serviceSizeModifier.create({
      data: { serviceId: service.id, species: 'canina', size: 'grande', amount: 22000 },
    });
    const pet = await createPet(clientId, { size: 'grande' });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ petId: pet.id, serviceId: service.id, date: tomorrow(), time: '10:00' });

    expect(res.status).toBe(201);
    expect(res.body.data.totalPrice).toBe(62000);
    expect(res.body.data.priceBreakdown.total).toBe(62000);
  });

  it('rechaza con 409 PET_CONDITION_BLOCKS_BOOKING si la mascota tiene sarna', async () => {
    const service = await createService(40000);
    const pet = await createPet(clientId, { skinConditions: { create: [{ type: 'sarna' }] } });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({ petId: pet.id, serviceId: service.id, date: tomorrow(), time: '10:00' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PET_CONDITION_BLOCKS_BOOKING');
  });
});

describe('Tarifario — /api/v1/pricing', () => {
  it('GET /pricing/public trae 8 tramos (4 perro + 4 gato) sin autenticación', async () => {
    const res = await request(app).get('/api/v1/pricing/public');
    expect(res.status).toBe(200);
    expect(res.body.data.sizeTiers).toHaveLength(8);
    expect(res.body.data.blockingConditions).toContain('Hongos');
  });

  it('PUT /pricing/behavior-rules exige rol staff', async () => {
    const token = await clientToken();
    const res = await request(app)
      .put('/api/v1/pricing/behavior-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ rules: [] });
    expect(res.status).toBe(403);
  });

  it('un staff puede subir el recargo del comportamiento nervioso', async () => {
    const { accessToken } = await loginTestStaff();
    const config = await request(app)
      .get('/api/v1/pricing/config')
      .set('Authorization', `Bearer ${accessToken}`);

    const nextRules = config.body.data.behaviorRules.map((r: { behavior: string; amount: number }) =>
      r.behavior === 'nervioso' ? { ...r, amount: 20000 } : r,
    );

    const put = await request(app)
      .put('/api/v1/pricing/behavior-rules')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rules: nextRules });
    expect(put.status).toBe(200);

    const updated = put.body.data.behaviorRules.find((r: { behavior: string }) => r.behavior === 'nervioso');
    expect(updated.amount).toBe(20000);
  });
});
