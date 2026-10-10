/**
 * Archivo: modules/pets/pets.controller.ts
 * Descripción: Handlers HTTP para el registro y consulta de mascotas.
 * ¿Para qué? Capa delgada entre el router y el service.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as petsService from './pets.service.js';
import type { CreateMyPetInput, CreatePetInput, UpdatePetInput } from './pets.schema.js';
import { ValidationError } from '../../middlewares/error.middleware.js';

const clientIdQuerySchema = z.string().uuid();

// ¿Qué? Registra una mascota a nombre de un cliente (RF-012). Solo staff.
export async function createPet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pet = await petsService.createPet(req.body as CreatePetInput);
    res.status(201).json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Edita una mascota (RF-012). Solo staff.
export async function updatePet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pet = await petsService.updatePet(req.params.id as string, req.body as UpdatePetInput);
    res.status(200).json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Lista las mascotas del cliente autenticado (RF-013).
// ¿Para qué? El clientId siempre viene del token — nunca de un parámetro de ruta.
export async function listMyPets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pets = await petsService.listPetsByClient(req.user!.id);
    res.status(200).json({ success: true, data: pets });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Lista las mascotas de un cliente específico (RF-013) — solo staff.
export async function listPetsForClient(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = clientIdQuerySchema.safeParse(req.query.clientId);
    if (!parsed.success) {
      throw new ValidationError('El parámetro clientId es requerido y debe ser un UUID válido.');
    }
    const pets = await petsService.listPetsByClient(parsed.data);
    res.status(200).json({ success: true, data: pets });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? El cliente registra su propia mascota — el dueño sale del token, nunca del body.
export async function createMyPet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pet = await petsService.createPet({
      ...(req.body as CreateMyPetInput),
      clientId: req.user!.id,
    });
    res.status(201).json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? El cliente edita una mascota propia — se verifica dueño antes de tocarla.
export async function updateMyPet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const petId = req.params.id as string;
    await petsService.assertPetBelongsToClient(petId, req.user!.id);
    const pet = await petsService.updatePet(petId, req.body as UpdatePetInput);
    res.status(200).json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? El cliente elimina una mascota propia — se verifica dueño antes de borrarla.
export async function deleteMyPet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const petId = req.params.id as string;
    await petsService.assertPetBelongsToClient(petId, req.user!.id);
    await petsService.deletePet(petId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Sube o reemplaza la foto de una mascota. El staff puede subirla para cualquiera;
//   un cliente solo para una mascota propia (mismo chequeo que editar/eliminar).
export async function uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new ValidationError('Debes adjuntar una foto (campo "photo").');
    }
    const petId = req.params.id as string;
    if (req.user!.role === 'client') {
      await petsService.assertPetBelongsToClient(petId, req.user!.id);
    }
    const photoUrl = `/uploads/pets/${req.file.filename}`;
    const pet = await petsService.setPetPhoto(petId, photoUrl);
    res.status(200).json({ success: true, data: pet });
  } catch (err) {
    next(err);
  }
}
