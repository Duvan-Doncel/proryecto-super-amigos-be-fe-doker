/**
 * Archivo: types/pets.ts
 * Descripción: Tipos TypeScript para mascotas (RF-012, RF-013).
 */

// ¿Qué? Especies aceptadas por el negocio — debe coincidir con el enum `PetSpecies` del backend.
export type PetSpecies = 'canina' | 'felina';

// ¿Qué? Factores de precio del grooming que fija el staff en la ficha (RF-014).
export type PetSize = 'pequeno' | 'mediano' | 'grande' | 'gigante';
export type CoatType = 'corto' | 'largo';

// ¿Qué? Comportamiento de la mascota durante el grooming. 'agresivo' bloquea el agendamiento.
export type PetBehavior = 'tranquilo' | 'nervioso' | 'agresivo';

// ¿Qué? Etiquetas de condición de piel. Las 6 primeras suman recargo; las 4 últimas
//   bloquean el agendamiento de una cita y derivan al reporte de síntoma (RF-010).
export type SkinConditionType =
  | 'pulgas'
  | 'garrapatas'
  | 'piel_irritada'
  | 'alergia'
  | 'piel_sensible'
  | 'nudos'
  | 'hongos'
  | 'sarna'
  | 'heridas'
  | 'infeccion';

export interface PetSkinCondition {
  type: SkinConditionType;
  note: string | null;
}

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
  size: PetSize | null;
  coatType: CoatType | null;
  behavior: PetBehavior | null;
  skinConditions: PetSkinCondition[];
  pathology: string;
  photoUrl: string | null;
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
  size?: PetSize;
  coatType?: CoatType;
  behavior?: PetBehavior;
  skinConditions?: { type: SkinConditionType; note?: string }[];
  pathology?: string;
}

// ¿Qué? Edición de una mascota — todos los campos opcionales (RF-012).
export type UpdatePetRequest = Partial<Omit<CreatePetRequest, 'clientId'>>;

// ¿Qué? El cliente registra su PROPIA mascota — sin clientId, sale del token (RF-012).
export type CreateMyPetRequest = Omit<CreatePetRequest, 'clientId'>;
