/**
 * Archivo: tests/api/pets.front.api.test.ts
 * Descripción: Tests de API (supertest) desde el ángulo Front: el contrato que consume la
 *   pantalla "Mis mascotas" (fe/src/pages/client/profile/ProfilePetsPage.tsx).
 * ¿Para qué? Verificar EXACTAMENTE los campos del JSON que usa el frontend (fe/src/types/pets.ts)
 *   y el formato de error que lee fe/src/api/axios.ts → { success: false, error: { code, message } }.
 * ¿Impacto? La BD se simula con vi.mock: estos tests no necesitan Docker ni Postgres.
 *   Si el backend cambia un campo, lo renombra o cambia su tipo, la pantalla se rompe y estos
 *   tests fallan antes de que llegue al usuario.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ¿Qué? Doble de Prisma con solo los métodos que usan los endpoints probados.
// ¿Para qué? Aislar la BD: el router, los middlewares, el service y el mapper son reales.
vi.mock('../../db/index.js', () => ({
  db: {
    user: { findUnique: vi.fn() },
    pet: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import app from '../../app.js';
import { db } from '../../db/index.js';
import { generateAccessToken } from '../../utils/security.js';

const dbMock = vi.mocked(db, true);

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const PET_ID = '22222222-2222-4222-8222-222222222222';

const clientToken = generateAccessToken(CLIENT_ID, 'cliente@groomingspa.com', 'client');
const staffToken = generateAccessToken(
  '33333333-3333-4333-8333-333333333333',
  'staff@groomingspa.com',
  'staff',
);

// ¿Qué? Los campos que la interfaz `Pet` de fe/src/types/pets.ts espera, en orden alfabético.
// ¿Para qué? Comparar contra Object.keys() de la respuesta: si sobra o falta un campo, falla.
const FRONT_PET_FIELDS = [
  'age',
  'behavior',
  'breed',
  'clientId',
  'coatType',
  'color',
  'createdAt',
  'gender',
  'id',
  'name',
  'pathology',
  'photoUrl',
  'size',
  'skinConditions',
  'species',
  'weight',
].sort();

// ¿Qué? Una mascota tal como la devolvería Prisma (con datos internos como petId en las condiciones).
function fakePetRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PET_ID,
    clientId: CLIENT_ID,
    name: 'Firulais',
    species: 'canina',
    breed: 'Criollo',
    gender: 'macho',
    age: 4,
    // ¿Qué? Prisma devuelve el peso como Decimal; aquí basta un objeto que se convierta a número.
    weight: { toString: () => '12.5', valueOf: () => 12.5 },
    color: 'café',
    size: 'mediano',
    coatType: 'corto',
    behavior: 'tranquilo',
    pathology: 'No aplica',
    photoUrl: null,
    createdAt: new Date('2026-10-20T15:00:00.000Z'),
    updatedAt: new Date('2026-10-21T15:00:00.000Z'),
    skinConditions: [{ id: 'sc-1', petId: PET_ID, type: 'pulgas', note: null }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/v1/pets/me (lista de "Mis mascotas")', () => {
  it('should respond 200 with JSON and exactly the pet fields the frontend uses', async () => {
    // Arrange
    dbMock.pet.findMany.mockResolvedValue([fakePetRow()] as never);

    // Act
    const res = await request(app)
      .get('/api/v1/pets/me')
      .set('Authorization', `Bearer ${clientToken}`);

    // Assert: código, Content-Type y forma del cuerpo que lee listMyPets() → res.data.data
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);

    const pet = res.body.data[0];
    // Ni más ni menos campos que la interfaz Pet (updatedAt no debe salir)
    expect(Object.keys(pet).sort()).toEqual(FRONT_PET_FIELDS);
    // Tipos que la pantalla usa: weight número, createdAt texto ISO, condiciones {type, note}
    expect(pet.weight).toBe(12.5);
    expect(typeof pet.createdAt).toBe('string');
    expect(pet.createdAt).toBe('2026-10-20T15:00:00.000Z');
    expect(pet.skinConditions).toEqual([{ type: 'pulgas', note: null }]);
  });

  it('should respond 200 with an empty array (not null) when the client has no pets', async () => {
    // Arrange
    dbMock.pet.findMany.mockResolvedValue([] as never);

    // Act
    const res = await request(app)
      .get('/api/v1/pets/me')
      .set('Authorization', `Bearer ${clientToken}`);

    // Assert: la pantalla filtra con pets.filter(...), así que data debe ser un arreglo
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });

  it('should respond 401 with the error format the frontend reads when there is no token', async () => {
    // Act
    const res = await request(app).get('/api/v1/pets/me');

    // Assert: axios.ts lee error.code y error.message; un 401 dispara el refresh del token
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'UNAUTHORIZED', message: expect.any(String) },
    });
    expect(dbMock.pet.findMany).not.toHaveBeenCalled();
  });

  it('should respond 403 with the error format when a staff user asks for "my pets"', async () => {
    // Act
    const res = await request(app)
      .get('/api/v1/pets/me')
      .set('Authorization', `Bearer ${staffToken}`);

    // Assert: autenticado (no es 401) pero sin permiso; la BD ni se consulta
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'FORBIDDEN', message: expect.any(String) },
    });
    expect(dbMock.pet.findMany).not.toHaveBeenCalled();
  });
});

describe('POST /api/v1/pets/me (formulario "Agregar mascota")', () => {
  it('should respond 201 with the created pet in the same shape the list uses', async () => {
    // Arrange
    dbMock.user.findUnique.mockResolvedValue({
      id: CLIENT_ID,
      role: 'client',
    } as never);
    dbMock.pet.create.mockResolvedValue(fakePetRow({ skinConditions: [] }) as never);

    // Act
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${clientToken}`)
      // size explícita: así el service no consulta la tabla de precios para deducirla del peso
      .send({
        name: 'Firulais',
        species: 'canina',
        weight: 12.5,
        size: 'mediano',
      });

    // Assert: createMyPet() devuelve res.data.data y la pantalla lo pinta igual que la lista
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body.data).sort()).toEqual(FRONT_PET_FIELDS);
    expect(res.body.data.skinConditions).toEqual([]);
  });

  it('should respond 422 with a readable message the form can show when the name is blank', async () => {
    // Act
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: '   ', species: 'canina' });

    // Assert: ProfilePetsPage muestra err.message tal cual dentro de <Alert>
    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('El nombre de la mascota es requerido.');
    // 🔎 Hallazgo: antes el mensaje era un JSON dentro de un texto ('[{"field":"name",...}]')
    //   y el usuario lo veía así en pantalla.
    expect(res.body.error.message).not.toMatch(/[[\]{}"]/);
    expect(dbMock.pet.create).not.toHaveBeenCalled();
  });
});
