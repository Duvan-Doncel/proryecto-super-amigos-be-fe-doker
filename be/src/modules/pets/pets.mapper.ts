/**
 * Archivo: modules/pets/pets.mapper.ts
 * Descripción: Conversión de la entidad Pet (fila de Prisma) al DTO que devuelve la API.
 * ¿Para qué? Tener la conversión en una función pura, sin BD, para probarla con tests unitarios.
 * ¿Impacto? Todo lo que la API responde sobre mascotas pasa por aquí: un error cambia
 *   lo que ve el cliente y el staff.
 */

import type { Pet, PetSkinCondition } from '@prisma/client';

export type PetWithConditions = Pet & { skinConditions: PetSkinCondition[] };

export interface PetResponse {
  id: string;
  clientId: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  age: number | null;
  weight: number | null;
  color: string | null;
  size: string | null;
  coatType: string | null;
  behavior: string | null;
  skinConditions: { type: string; note: string | null }[];
  pathology: string;
  photoUrl: string | null;
  createdAt: Date;
}

// ¿Qué? Entidad → DTO: el peso Decimal pasa a número y las condiciones de piel se
//   devuelven solo con tipo y nota, ordenadas alfabéticamente por tipo.
export function toPetResponse(pet: PetWithConditions): PetResponse {
  return {
    id: pet.id,
    clientId: pet.clientId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    age: pet.age,
    weight: pet.weight ? Number(pet.weight) : null,
    color: pet.color,
    size: pet.size,
    coatType: pet.coatType,
    behavior: pet.behavior,
       skinConditions: pet.skinConditions
      .map((c) => ({ type: c.type, note: c.note }))
      .sort((a, b) => a.type.localeCompare(b.type)),
    pathology: pet.pathology,
    photoUrl: pet.photoUrl,
    createdAt: pet.createdAt,
  };
}