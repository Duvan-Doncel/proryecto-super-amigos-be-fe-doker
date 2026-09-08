/**
 * Archivo: modules/users/users.controller.ts
 * Descripción: Handler HTTP para el perfil de usuario (RF-007).
 * ¿Para qué? Capa delgada entre el router y el service — extrae user.id del token JWT.
 * ¿Impacto? El userId SIEMPRE viene de req.user (token), nunca de req.params o req.body.
 */

import type { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import type { UpdateProfileInput } from './users.schema.js';

// ¿Qué? Retorna el perfil del usuario actualmente autenticado.
// ¿Para qué? Permitir al frontend mostrar datos del usuario sin exponer otros perfiles.
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await usersService.getUserById(req.user!.id);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Actualiza el perfil del usuario autenticado (nombre, apellido, teléfono).
// ¿Para qué? RF-007 — el cliente mantiene sus datos de contacto al día sin pasar por el staff.
// ¿Impacto? El body ya viene validado por `validate(updateProfileSchema)`; el ID sale del token.
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await usersService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
