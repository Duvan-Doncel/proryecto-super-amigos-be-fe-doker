/**
 * Archivo: modules/pets/pets.service.ts
 * Descripción: Lógica de negocio para el registro y consulta de mascotas (RF-012, RF-013).
 * ¿Para qué? Las mascotas son el requisito previo para que un cliente pueda agendar una
 *   cita (RF-009) o reportar un síntoma (RF-010) — sin una mascota registrada, no puede.
 * ¿Impacto? Un error aquí bloquea todo el flujo del semáforo para un cliente.
 */

import type { Pet } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError, ForbiddenError } from '../../middlewares/error.middleware.js';
import type { CreatePetInput } from './pets.schema.js';

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
  pathology: string;
  createdAt: Date;
}

function toPetResponse(pet: Pet): PetResponse {
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
    pathology: pet.pathology,
    createdAt: pet.createdAt,
  };
}

// ¿Qué? Registra una mascota a nombre de un cliente existente (RF-012).
// ¿Para qué? Solo el staff puede hacerlo (verificado en el router con requireRole).
// ¿Impacto? Si el clientId no corresponde a un cliente real, se rechaza con 404.
export async function createPet(data: CreatePetInput): Promise<PetResponse> {
  const client = await db.user.findUnique({ where: { id: data.clientId } });

  if (!client || client.role !== 'client') {
    throw new NotFoundError('Cliente no encontrado.');
  }

  const pet = await db.pet.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      gender: data.gender,
      age: data.age,
      weight: data.weight,
      color: data.color,
      pathology: data.pathology,
    },
  });

  return toPetResponse(pet);
}

// ¿Qué? Lista las mascotas del cliente autenticado (RF-013).
// ¿Para qué? Alimentar el selector de mascotas del semáforo (RF-009, RF-010).
// ¿Impacto? Retorna un arreglo vacío (no error) si el cliente aún no tiene mascotas.
export async function listPetsByClient(clientId: string): Promise<PetResponse[]> {
  const pets = await db.pet.findMany({
    where: { clientId },
    orderBy: { createdAt: 'asc' },
  });

  return pets.map(toPetResponse);
}

// ¿Qué? Verifica que una mascota exista y pertenezca a un cliente específico.
// ¿Para qué? Reutilizado por los módulos de citas (RF-009) y síntomas (RF-010) para
//   cumplir la regla "un cliente no puede usar la mascota de otro" (RN-091, RN-101).
// ¿Impacto? Lanza NotFoundError si no existe, ForbiddenError si es de otro cliente —
//   así el caller no necesita reimplementar esta verificación.
export async function assertPetBelongsToClient(petId: string, clientId: string): Promise<Pet> {
  const pet = await db.pet.findUnique({ where: { id: petId } });

  if (!pet) throw new NotFoundError('Mascota no encontrada.');
  if (pet.clientId !== clientId) throw new ForbiddenError('Esta mascota no pertenece a tu cuenta.');

  return pet;
}
