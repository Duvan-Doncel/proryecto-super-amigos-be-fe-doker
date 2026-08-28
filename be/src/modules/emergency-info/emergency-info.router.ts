/**
 * Archivo: modules/emergency-info/emergency-info.router.ts
 * Descripción: Router de Express para la información de emergencia (RF-011).
 */

import { Router, type IRouter } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateEmergencyInfoSchema } from './emergency-info.schema.js';
import * as emergencyInfoController from './emergency-info.controller.js';

const router: IRouter = Router();

// GET /api/v1/emergency-info — público, sin autenticación (RN-110)
router.get('/', emergencyInfoController.get);

// PUT /api/v1/emergency-info — solo staff (RN-111)
router.put(
  '/',
  authenticate,
  requireRole('staff'),
  validate(updateEmergencyInfoSchema),
  emergencyInfoController.update,
);

export default router;
