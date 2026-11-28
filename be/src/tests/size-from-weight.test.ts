/**
 * Archivo: tests/size-from-weight.test.ts
 * Descripción: Tests unitarios de deriveSizeFromWeight (tamaño de la mascota según su peso).
 * ¿Para qué? El tamaño define el recargo del motor de precios; un error en el borde de un
 *   tramo cobra de más o de menos a la clienta.
 * ¿Impacto? Usa los tramos que setup.ts deja en la BD de tests antes de cada test:
 *   perro ≤10 pequeño, ≤25 mediano, ≤45 grande, más de 45 gigante;
 *   gato ≤3.5 pequeño, ≤5 mediano, ≤7 grande, más de 7 gigante.
 */

import { describe, it, expect } from 'vitest';
import { deriveSizeFromWeight } from '../modules/pricing/pricing.service.js';

describe('deriveSizeFromWeight', () => {
  it('should return null when the pet has no weight', async () => {
    // Arrange
    const weight = null;

    // Act
    const size = await deriveSizeFromWeight(weight, 'canina');

    // Assert
    expect(size).toBeNull();
  });

  it('should keep a 10 kg dog in "pequeno" (boundary)', async () => {
    // Arrange
    const weight = 10;

    // Act
    const size = await deriveSizeFromWeight(weight, 'canina');

    // Assert
    expect(size).toBe('pequeno');
  });

  it.each([
    [9.9, 'pequeno'], // justo debajo del borde de 10
    [10.1, 'mediano'], // justo encima del borde de 10
    [25, 'mediano'], // borde de 25
    [45, 'grande'], // borde de 45
    [45.1, 'gigante'], // encima del último tope: tramo sin límite
  ] as const)('should classify a dog of %s kg as %s', async (weight, expected) => {
    expect(await deriveSizeFromWeight(weight, 'canina')).toBe(expected);
  });

  it.each([
    [3.5, 'pequeno'], // borde de 3.5
    [3.6, 'mediano'],
    [6, 'grande'], // el mismo peso en un perro sería "pequeno"
    [7.1, 'gigante'],
  ] as const)('should classify a cat of %s kg as %s', async (weight, expected) => {
    expect(await deriveSizeFromWeight(weight, 'felina')).toBe(expected);
  });
});
