/**
 * Archivo: modules/staff/staff.router.ts
 * Descripción: Router de Express para la gestión de cuentas de staff (RF-008).
 * ¿Para qué? Exponer POST /api/v1/staff, protegido para que solo otro staff pueda usarlo.
 * ¿Impacto? Sin `requireRole('staff')`, un cliente autenticado podría crear cuentas de staff.
 */

import { Router, type IRouter } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { validate, validateQuery } from '../../middlewares/validate.middleware.js';
import { createStaffSchema } from '../auth/auth.schema.js';
import { listClientsQuerySchema } from '../users/users.schema.js';
import * as staffController from './staff.controller.js';

const router: IRouter = Router();

// POST /api/v1/staff — Crea una cuenta de staff (RF-008)
// Requiere estar autenticado y ya tener role: 'staff' — no hay registro público de staff.
router.post(
  '/',
  authenticate,
  requireRole('staff'),
  validate(createStaffSchema),
  staffController.createStaff,
);

// GET /api/v1/staff/clients?q=&page=&limit= — Lista/busca clientes, paginado (RF-012)
router.get(
  '/clients',
  authenticate,
  requireRole('staff'),
  validateQuery(listClientsQuerySchema),
  staffController.searchClients,
);

export default router;
