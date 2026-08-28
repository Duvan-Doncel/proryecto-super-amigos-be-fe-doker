/**
 * Archivo: modules/services/services.router.ts
 * Descripción: Router de Express para el catálogo de servicios (RF-014).
 * ¿Para qué? GET público (solo activos) + CRUD completo solo-staff.
 */

import { Router, type IRouter } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createServiceSchema, updateServiceSchema } from './services.schema.js';
import * as servicesController from './services.controller.js';

const router: IRouter = Router();

// GET /api/v1/services — catálogo público (siempre solo activos)
router.get('/', servicesController.listPublic);

// GET /api/v1/services/staff — catálogo completo para staff (incluye inactivos)
router.get('/staff', authenticate, requireRole('staff'), servicesController.listForStaff);

// POST /api/v1/services — crea un servicio (solo staff)
router.post(
  '/',
  authenticate,
  requireRole('staff'),
  validate(createServiceSchema),
  servicesController.create,
);

// PUT /api/v1/services/:id — edita un servicio, incluido el precio (solo staff)
router.put(
  '/:id',
  authenticate,
  requireRole('staff'),
  validate(updateServiceSchema),
  servicesController.update,
);

// DELETE /api/v1/services/:id — elimina o desactiva un servicio (solo staff)
router.delete('/:id', authenticate, requireRole('staff'), servicesController.remove);

export default router;
