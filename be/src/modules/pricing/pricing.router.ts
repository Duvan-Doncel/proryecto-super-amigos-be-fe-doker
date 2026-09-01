/**
 * Archivo: modules/pricing/pricing.router.ts
 * Descripción: Router de Express para el tarifario del grooming (RF-014).
 * ¿Para qué? GET público de solo lectura + configuración solo-staff.
 * ¿Impacto? El estimador de precio y el modificador por servicio viven en
 *   sus módulos naturales (appointments, services); aquí queda la config global.
 */

import { Router, type IRouter } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateBehaviorRulesSchema,
  updateSizeTiersSchema,
  updateSkinRulesSchema,
} from './pricing.schema.js';
import * as pricingController from './pricing.controller.js';

const router: IRouter = Router();

// GET /api/v1/pricing/public — tarifario abierto para "Cómo calculamos el precio" (sin auth)
router.get('/public', pricingController.getPublic);

// GET /api/v1/pricing/config — configuración completa (solo staff)
router.get('/config', authenticate, requireRole('staff'), pricingController.getConfig);

// PUT /api/v1/pricing/size-tiers — tramos de peso (solo staff)
router.put(
  '/size-tiers',
  authenticate,
  requireRole('staff'),
  validate(updateSizeTiersSchema),
  pricingController.putSizeTiers,
);

// PUT /api/v1/pricing/skin-rules — recargos / bloqueos por condición de piel (solo staff)
router.put(
  '/skin-rules',
  authenticate,
  requireRole('staff'),
  validate(updateSkinRulesSchema),
  pricingController.putSkinRules,
);

// PUT /api/v1/pricing/behavior-rules — recargos / bloqueos por comportamiento (solo staff)
router.put(
  '/behavior-rules',
  authenticate,
  requireRole('staff'),
  validate(updateBehaviorRulesSchema),
  pricingController.putBehaviorRules,
);

export default router;
