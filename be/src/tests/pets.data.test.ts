/**
 * Archivo: tests/pets.data.test.ts
 * Descripción: Tests unitarios de la capa BD (semana 2): validación del modelo de mascota
 *   y conversión entidad → DTO.
 * ¿Para qué? Verificar los valores límite de lo que se guarda y de lo que devuelve la API,
 *   sin pasar por HTTP ni por la BD.
 * Autor: Álvaro Espejo
 */

import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { createMyPetSchema } from '../modules/pets/pets.schema.js';
import { toPetResponse, type PetWithConditions } from '../modules/pets/pets.mapper.js';

// ¿Qué? Datos mínimos válidos; cada test cambia solo el campo que prueba.
const validPet = { name: 'Firulais', species: 'canina' };

describe('createMyPetSchema: peso (> 0 y ≤ 999.99, columna Decimal(5,2))', () => {
  it('rechaza una mascota con peso 0 (límite inferior)', () => {
    // Arrange
    const data = { ...validPet, weight: 0 };

    // Act
    const result = createMyPetSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each([
    [0.01, true], // justo encima del límite inferior
    [999.99, true], // límite superior: lo máximo que cabe en Decimal(5,2)
    [1000, false], // justo encima del límite superior
    [-5, false], // partición inválida: negativo
  ])('el peso %s → válido: %s', (weight, expected) => {
    expect(createMyPetSchema.safeParse({ ...validPet, weight }).success).toBe(expected);
  });
});

describe('createMyPetSchema: edad (entero entre 0 y 100)', () => {
  it.each([
    [-1, false],
    [0, true], // límite inferior: cachorro de menos de un año
    [100, true], // límite superior
    [101, false],
    [2.5, false], // no entero
  ])('la edad %s → válida: %s', (age, expected) => {
    expect(createMyPetSchema.safeParse({ ...validPet, age }).success).toBe(expected);
  });
});

describe('createMyPetSchema: nombre, especie y valores por defecto', () => {
  it('rechaza un nombre que solo tiene espacios', () => {
    const result = createMyPetSchema.safeParse({ ...validPet, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('guarda el nombre sin espacios sobrantes', () => {
    const pet = createMyPetSchema.parse({ ...validPet, name: '  Luna  ' });
    expect(pet.name).toBe('Luna');
  });

  it('rechaza una especie fuera de la lista cerrada', () => {
    expect(createMyPetSchema.safeParse({ ...validPet, species: 'conejo' }).success).toBe(false);
  });

  it('guarda "No aplica" cuando no se envía patología', () => {
    expect(createMyPetSchema.parse(validPet).pathology).toBe('No aplica');
  });
});

describe('toPetResponse (entidad → DTO)', () => {
  const createdAt = new Date('2026-10-20T12:00:00.000Z');
  const row: PetWithConditions = {
    id: 'p1',
    clientId: 'c1',
    name: 'Firulais',
    species: 'canina',
    breed: null,
    gender: null,
    age: 3,
    weight: new Prisma.Decimal('12.50'),
    color: null,
    size: 'mediano',
    coatType: 'corto',
    behavior: null,
    pathology: 'No aplica',
    photoUrl: null,
    createdAt,
    skinConditions: [
      { id: 's2', petId: 'p1', type: 'pulgas', note: null, createdAt },
      { id: 's1', petId: 'p1', type: 'garrapatas', note: 'oreja izquierda', createdAt },
    ],
  };

  it('convierte el peso Decimal de la BD en número', () => {
    // Act
    const dto = toPetResponse(row);

    // Assert
    expect(dto.weight).toBe(12.5);
  });

  it('deja el peso en null cuando la mascota no tiene peso registrado', () => {
    expect(toPetResponse({ ...row, weight: null }).weight).toBeNull();
  });

  it('devuelve las condiciones de piel ordenadas por tipo y sin datos internos', () => {
    expect(toPetResponse(row).skinConditions).toEqual([
      { type: 'garrapatas', note: 'oreja izquierda' },
      { type: 'pulgas', note: null },
    ]);
  });
});