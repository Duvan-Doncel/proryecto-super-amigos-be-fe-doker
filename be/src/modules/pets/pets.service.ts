/**
 * Archivo: modules/pets/pets.service.ts
 * Descripción: Lógica de negocio para el registro y consulta de mascotas (RF-012, RF-013).
 * ¿Para qué? Las mascotas son el requisito previo para que un cliente pueda agendar una
 *   cita (RF-009) o reportar un síntoma (RF-010) — sin una mascota registrada, no puede.
 * ¿Impacto? Un error aquí bloquea todo el flujo del semáforo para un cliente.
 */

import { unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Pet, PetSkinCondition } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError, ForbiddenError } from '../../middlewares/error.middleware.js';
import { deriveSizeFromWeight } from '../pricing/pricing.service.js';
import type { CreatePetInput, UpdatePetInput } from './pets.schema.js';

type PetWithConditions = Pet & { skinConditions: PetSkinCondition[] };

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

function toPetResponse(pet: PetWithConditions): PetResponse {
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

// ¿Qué? Si el staff no fijó la talla a mano pero registró un peso, se sugiere desde los
//   tramos de LA ESPECIE (RF-014). Si mandó la talla explícita, esa gana.
async function resolveSize(
  explicitSize: string | undefined,
  weight: number | undefined,
  species: Pet['species'],
): Promise<Pet['size'] | undefined> {
  if (explicitSize) return explicitSize as Pet['size'];
  if (weight != null) return (await deriveSizeFromWeight(weight, species)) ?? undefined;
  return undefined;
}

// ¿Qué? Registra una mascota a nombre de un cliente existente (RF-012).
// ¿Para qué? Solo el staff puede hacerlo (verificado en el router con requireRole).
// ¿Impacto? Si el clientId no corresponde a un cliente real, se rechaza con 404.
export async function createPet(data: CreatePetInput): Promise<PetResponse> {
  const client = await db.user.findUnique({ where: { id: data.clientId } });

  if (!client || client.role !== 'client') {
    throw new NotFoundError('Cliente no encontrado.');
  }

  const size = await resolveSize(data.size, data.weight, data.species);

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
      size,
      coatType: data.coatType,
      behavior: data.behavior,
      pathology: data.pathology,
      skinConditions: data.skinConditions?.length
        ? { create: data.skinConditions.map((c) => ({ type: c.type, note: c.note })) }
        : undefined,
    },
    include: { skinConditions: true },
  });

  return toPetResponse(pet);
}

// ¿Qué? Edita una mascota (RF-012) — solo staff. Actualiza solo los campos enviados.
// ¿Para qué? El staff ajusta talla, pelo y condiciones de piel a medida que conoce al animal;
//   esos datos alimentan el precio del grooming (RF-014).
// ¿Impacto? Si se envía `skinConditions`, se reemplaza la lista completa. Si se cambia el peso
//   y no se manda `size`, la talla se recalcula.
export async function updatePet(id: string, data: UpdatePetInput): Promise<PetResponse> {
  const existing = await db.pet.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Mascota no encontrada.');

  // Recalcular talla si cambió el peso y no vino una talla explícita (con los tramos de la especie).
  let size: Pet['size'] | undefined;
  if (data.size !== undefined) {
    size = data.size as Pet['size'];
  } else if (data.weight !== undefined) {
    size = (await deriveSizeFromWeight(data.weight, data.species ?? existing.species)) ?? null;
  }

  const pet = await db.pet.update({
    where: { id },
    data: {
      name: data.name,
      species: data.species,
      breed: data.breed,
      gender: data.gender,
      age: data.age,
      weight: data.weight,
      color: data.color,
      ...(size !== undefined ? { size } : {}),
      coatType: data.coatType,
      behavior: data.behavior,
      pathology: data.pathology,
      ...(data.skinConditions !== undefined
        ? {
            skinConditions: {
              deleteMany: {},
              create: data.skinConditions.map((c) => ({ type: c.type, note: c.note })),
            },
          }
        : {}),
    },
    include: { skinConditions: true },
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
    include: { skinConditions: true },
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

// ¿Qué? Elimina una mascota. El borrado en cascada (definido en el schema) se lleva sus
//   citas, reportes de síntoma y condiciones de piel — es intencional: sin la mascota,
//   esos registros dejan de tener sentido para el cliente.
export async function deletePet(id: string): Promise<void> {
  const existing = await db.pet.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Mascota no encontrada.');

  if (existing.photoUrl) await deletePhotoFile(existing.photoUrl);
  await db.pet.delete({ where: { id } });
}

// ¿Qué? Guarda la ruta de la foto recién subida (ver middlewares/upload.middleware.ts) y
//   borra el archivo anterior si había uno, para no acumular huérfanos en disco.
export async function setPetPhoto(id: string, photoUrl: string): Promise<PetResponse> {
  const existing = await db.pet.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Mascota no encontrada.');

  if (existing.photoUrl) await deletePhotoFile(existing.photoUrl);

  const pet = await db.pet.update({
    where: { id },
    data: { photoUrl },
    include: { skinConditions: true },
  });

  return toPetResponse(pet);
}

// ¿Qué? Best-effort: si el archivo ya no existe o la ruta es inesperada, no interrumpe el flujo.
async function deletePhotoFile(photoUrl: string): Promise<void> {
  try {
    const filename = path.basename(photoUrl);
    await unlink(path.join(process.cwd(), 'uploads', 'pets', filename));
  } catch {
    /* archivo ya no existe o no se pudo borrar — no es crítico */
  }
}
