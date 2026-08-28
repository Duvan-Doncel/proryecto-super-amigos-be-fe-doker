/**
 * Archivo: modules/pets/pets.controller.ts
 * Descripción: Handlers HTTP para el registro y consulta de mascotas.
 * ¿Para qué? Capa delgada entre el router y el service.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as petsService from './pets.service.js';
import type { CreatePetInput } from './pets.schema.js';
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
