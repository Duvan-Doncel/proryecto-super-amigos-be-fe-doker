import { describe, expect, it } from 'vitest';
import { EMPTY_PET_FORM, petFormToPayload } from '../../components/pets/petForm';

describe('petFormToPayload', () => {
  it('should omit empty optional fields so the backend applies its defaults', () => {
    // Arrange
    const form = { ...EMPTY_PET_FORM, name: 'Rocky', species: 'DOG' as const };

    // Act
    const payload = petFormToPayload(form);

    // Assert
    expect(payload.breed).toBeUndefined();
    expect(payload.age).toBeUndefined();
    expect(payload.weight).toBeUndefined();
    expect(payload.size).toBeUndefined();
  });

  it('should convert age and weight from text to numbers', () => {
    const form = { ...EMPTY_PET_FORM, name: 'Rocky', age: '3', weight: '12.5' };

    const payload = petFormToPayload(form);

    expect(payload.age).toBe(3);
    expect(payload.weight).toBe(12.5);
  });

  it.each([
    ['', 'No aplica'],                 // vacío
    ['   ', 'No aplica'],              // valor límite: solo espacios
    ['  Dermatitis  ', 'Dermatitis'],  // texto con espacios alrededor
  ])('should turn pathology "%s" into "%s"', (pathology, expected) => {
    const form = { ...EMPTY_PET_FORM, name: 'Rocky', pathology };

    const payload = petFormToPayload(form);

    expect(payload.pathology).toBe(expected);
  });
});