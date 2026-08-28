/**
 * Archivo: modules/sales/sales.router.ts
 * Descripción: Router de Express para ventas de mostrador (RF-023) y reporte de ventas (RF-022).
 * ¿Para qué? Ambos endpoints viven bajo /api/v1/staff/*, tal como quedó documentado.
 */

import { Router, type IRouter } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createSaleSchema } from './sales.schema.js';
import * as salesController from './sales.controller.js';

const router: IRouter = Router();

router.use(authenticate, requireRole('staff'));

// POST /api/v1/sales — registra una venta hecha en persona (RF-023)
router.post('/', validate(createSaleSchema), salesController.create);

export default router;

// ¿Qué? Router separado para /api/v1/staff/sales-report (RF-022).
export const salesReportRouter: IRouter = Router();
salesReportRouter.get('/', authenticate, requireRole('staff'), salesController.report);
