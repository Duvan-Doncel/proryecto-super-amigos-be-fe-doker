/**
 * Archivo: tests/pets.integration.api.test.ts
 * Descripción: Semana 6 · capa API (Álvaro): los endpoints de "Mis mascotas" contra la BD REAL
 *   de pruebas (PostgreSQL), sin dobles.
 * ¿Para qué? Ver lo que los tests con Prisma simulado (semana 4) no pueden ver: que la fila
 *   quede guardada de verdad, los valores por defecto de la tabla, el borrado en cascada y
 *   qué responde el API cuando se viola una restricción de la tabla.
 * ¿Impacto? La conexión llega por DATABASE_URL (.env.test), nunca escrita aquí. La limpieza es
 *   por truncado: setup.ts borra las tablas antes de CADA test, así que cada test crea sus
 *   propios datos (usuarios y mascotas) y no depende de otro ni del orden.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { db } from '../db/index.js';
import { generateAccessToken } from '../utils/security.js';

// ¿Qué? Crea un cliente en la BD y devuelve su token.
// ¿Para qué? Cada test fabrica su propio dueño: nada de ids fijos ni datos de otro test.
async function createClient(email: string) {
  const user = await db.user.create({
    data: {
      email,
      hashedPassword: 'no-se-usa-en-este-test',
      firstName: 'Cliente',
      lastName: 'Prueba',
      role: 'client',
      isEmailVerified: true,
    },
  });
  return { user, token: generateAccessToken(user.id, user.email, 'client') };
}

describe.skipIf(!process.env.DATABASE_URL)('Mis mascotas contra la BD real (semana 6, capa API)', () => {
  it('POST /pets/me guarda la mascota EN LA BD a nombre del dueño del token', async () => {
    // Arrange
    const { user, token } = await createClient('duena.s6@superamigos.test');

    // Act
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Luna',
        species: 'felina',
        size: 'pequeno',
        weight: 4.25,
        skinConditions: [{ type: 'pulgas' }],
      });

    // Assert: la respuesta...
    expect(res.status).toBe(201);
    // ...y sobre todo LA BD: la fila existe con los valores que guarda PostgreSQL
    const row = await db.pet.findUnique({
      where: { id: res.body.data.id },
      include: { skinConditions: true },
    });
    expect(row).not.toBeNull();
    expect(row!.clientId).toBe(user.id); // el dueño sale del token
    expect(row!.pathology).toBe('No aplica'); // DEFAULT de la tabla
    expect(Number(row!.weight)).toBe(4.25); // DECIMAL(5,2) guarda los 2 decimales
    expect(row!.skinConditions.map((c) => c.type)).toEqual(['pulgas']);
  });

  it('PUT /pets/me/:id de una mascota AJENA responde 403 y la fila no cambia en la BD', async () => {
    // Arrange: la dueña registra su mascota; otro cliente intenta editarla
    const owner = await createClient('duena2.s6@superamigos.test');
    const intruder = await createClient('intruso.s6@superamigos.test');
    const pet = await db.pet.create({
      data: { clientId: owner.user.id, name: 'Toby', species: 'canina' },
    });

    // Act
    const res = await request(app)
      .put(`/api/v1/pets/me/${pet.id}`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .send({ name: 'Robado' });

    // Assert
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    const row = await db.pet.findUnique({ where: { id: pet.id } });
    expect(row!.name).toBe('Toby');
  });

  it('DELETE /pets/me/:id borra la mascota y sus condiciones de piel (ON DELETE CASCADE)', async () => {
    // Arrange
    const { user, token } = await createClient('duena3.s6@superamigos.test');
    const pet = await db.pet.create({
      data: {
        clientId: user.id,
        name: 'Max',
        species: 'canina',
        skinConditions: { create: [{ type: 'nudos' }, { type: 'alergia' }] },
      },
    });

    // Act
    const res = await request(app)
      .delete(`/api/v1/pets/me/${pet.id}`)
      .set('Authorization', `Bearer ${token}`);

    // Assert: se borró la mascota y PostgreSQL borró sus filas hijas
    expect(res.status).toBeLessThan(300);
    expect(await db.pet.findUnique({ where: { id: pet.id } })).toBeNull();
    expect(await db.petSkinCondition.count({ where: { petId: pet.id } })).toBe(0);
  });

  it('POST /pets/me con la misma condición de piel repetida responde 422 (no 500) y no guarda nada', async () => {
    // Arrange
    const { user, token } = await createClient('duena4.s6@superamigos.test');

    // Act: la tabla pet_skin_conditions tiene UNIQUE(pet_id, type)
    const res = await request(app)
      .post('/api/v1/pets/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Kira',
        species: 'canina',
        skinConditions: [{ type: 'pulgas' }, { type: 'pulgas' }],
      });

    // Assert
    // 🔎 Hallazgo: respondía 500 INTERNAL_ERROR porque PostgreSQL rechazaba el duplicado.
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await db.pet.count({ where: { clientId: user.id } })).toBe(0);
  });
});