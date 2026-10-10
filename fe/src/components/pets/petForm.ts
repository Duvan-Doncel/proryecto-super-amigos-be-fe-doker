/**
 * Archivo: components/pets/petForm.ts
 * Descripción: Estado de formulario, valores por defecto y conversión hacia/desde `Pet`,
 *   compartidos por cualquier pantalla que registre o edite una mascota (RF-012).
 */

import type { CoatType, Pet, PetBehavior, PetSize, PetSpecies, SkinConditionType } from '@/types/pets';

export interface PetFormData {
  name: string;
  species: PetSpecies | '';
  breed: string;
  gender: string;
  age: string;
  weight: string;
  color: string;
  size: PetSize | '';
  coatType: CoatType | '';
  behavior: PetBehavior | '';
  skinConditions: SkinConditionType[];
  pathology: string;
}

export const EMPTY_PET_FORM: PetFormData = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  age: '',
  weight: '',
  color: '',
  size: '',
  coatType: '',
  behavior: '',
  skinConditions: [],
  pathology: 'No aplica',
};

export function petToForm(pet: Pet): PetFormData {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? '',
    gender: pet.gender ?? '',
    age: pet.age != null ? String(pet.age) : '',
    weight: pet.weight != null ? String(pet.weight) : '',
    color: pet.color ?? '',
    size: pet.size ?? '',
    coatType: pet.coatType ?? '',
    behavior: pet.behavior ?? '',
    skinConditions: pet.skinConditions.map((c) => c.type),
    pathology: pet.pathology,
  };
}

// ¿Qué? Convierte el estado del formulario al shape que espera la API — strings vacíos se
//   omiten (undefined) para que el backend aplique sus propios valores por defecto.
export function petFormToPayload(formData: PetFormData) {
  return {
    name: formData.name,
    species: formData.species as PetSpecies,
    breed: formData.breed || undefined,
    gender: formData.gender || undefined,
    age: formData.age ? Number(formData.age) : undefined,
    weight: formData.weight ? Number(formData.weight) : undefined,
    color: formData.color || undefined,
    size: formData.size || undefined,
    coatType: formData.coatType || undefined,
    behavior: formData.behavior || undefined,
    skinConditions: formData.skinConditions.map((type) => ({ type })),
    pathology: formData.pathology.trim() || 'No aplica',
  };
}
