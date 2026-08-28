/**
 * Archivo: types/pets.ts
 * Descripción: Tipos TypeScript para mascotas (RF-012, RF-013).
 */

// ¿Qué? Especies aceptadas por el negocio — debe coincidir con el enum `PetSpecies` del backend.
export type PetSpecies = 'canina' | 'felina' | 'lagomorfo' | 'porcina';

export interface Pet {
  id: string;
  clientId: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  gender: string | null;
  age: number | null;
  weight: number | null;
  color: string | null;
  pathology: string;
  createdAt: string;
}

export interface CreatePetRequest {
  clientId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  gender?: string;
  age?: number;
  weight?: number;
  color?: string;
  pathology?: string;
}
