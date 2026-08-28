/**
 * Archivo: modules/sales/sales.controller.ts
 * Descripción: Handlers HTTP para ventas de mostrador (RF-023) y el reporte de ventas (RF-022).
 */

import type { Request, Response, NextFunction } from 'express';
import * as salesService from './sales.service.js';
import { salesReportQuerySchema, type CreateSaleInput } from './sales.schema.js';
import { ValidationError } from '../../middlewares/error.middleware.js';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sale = await salesService.createSale(req.user!.id, req.body as CreateSaleInput);
    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
}

export async function report(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = salesReportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(' '));
    }
    const data = await salesService.getSalesReport(parsed.data);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
