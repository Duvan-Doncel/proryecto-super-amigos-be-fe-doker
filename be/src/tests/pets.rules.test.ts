/**
 * Archivo: tests/pets.rules.test.ts
 * Descripción: Test unitario de la regla de condiciones de piel repetidas (semana 6, capa API).
 * ¿Para qué? La regla nació de un 500 que solo se veía contra la BD real (UNIQUE(pet_id, type)).
 *   Aquí se prueba en su valor límite, sin BD: el test de integración queda como red.
 */

import { describe, it, expect } from 'vitest';
import { assertUniqueSkinConditions } from '../modules/pets/pets.service.js';

describe('assertUniqueSkinConditions', () => {
  it.each([
    ['sin lista', undefined],
    ['lista vacía', []],
    ['un solo tipo', [{ type: 'pulgas' }]],
    ['dos tipos distintos (límite: el máximo sin repetir)', [{ type: 'pulgas' }, { type: 'nudos' }]],
  ])('acepta %s', (_caso, conditions) => {
    // Act + Assert
    expect(() => assertUniqueSkinConditions(conditions)).not.toThrow();
  });

  it('rechaza con 422 el mismo tipo repetido (límite: dos iguales)', () => {
    // Arrange
    const conditions = [{ type: 'pulgas' }, { type: 'pulgas' }];

    // Act + Assert
    expect(() => assertUniqueSkinConditions(conditions)).toThrow(
      expect.objectContaining({ statusCode: 422, code: 'VALIDATION_ERROR' }),
    );
  });
});