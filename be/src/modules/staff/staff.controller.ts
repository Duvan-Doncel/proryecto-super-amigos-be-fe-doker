/**
 * Archivo: modules/staff/staff.controller.ts
 * Descripción: Handler HTTP para la creación de cuentas de staff (RF-008).
 * ¿Para qué? Capa delgada que delega en authService — reutiliza toda la lógica
 *   de creación de usuario y verificación de email ya escrita para el registro de clientes.
 */

import type { Request, Response, NextFunction } from 'express';
import * as authService from '../auth/auth.service.js';
import * as usersService from '../users/users.service.js';
import type { CreateStaffInput } from '../auth/auth.schema.js';
import type { DeactivateClientInput, ListClientsQuery } from '../users/users.schema.js';

// ¿Qué? Crea una nueva cuenta de staff.
// ¿Para qué? Solo alcanzable por un staff ya autenticado (ver staff.router.ts).
export async function createStaff(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const staff = await authService.createStaffUser(req.body as CreateStaffInput);
    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Lista clientes, paginada y con búsqueda opcional (`?q=`, `?page=`, `?limit=`).
// ¿Para qué? La pantalla "Clientes" del panel recorre todos los clientes; el buscador de
//   mascotas y el de ventas usan el mismo endpoint pasando `q`.
// ¿Impacto? El query ya viene validado por `validateQuery(listClientsQuerySchema)` — page
//   y limit llegan como number con defaults aplicados.
export async function searchClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, hasPets, status, page, limit } = req.validatedQuery as ListClientsQuery;
    const { data, ...meta } = await usersService.listClients({ search: q, hasPets, status, page, limit });
    res.status(200).json({ success: true, data, meta });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Da de baja a un cliente (POST /staff/clients/:id/deactivate) con motivo opcional.
export async function deactivateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body as DeactivateClientInput;
    const result = await usersService.deactivateClient(req.user!.id, req.params.id as string, reason);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Reactiva a un cliente dado de baja (POST /staff/clients/:id/reactivate).
export async function reactivateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.reactivateClient(req.user!.id, req.params.id as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
