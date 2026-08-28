/**
 * Archivo: modules/suppliers/suppliers.controller.ts
 * Descripción: Handlers HTTP para la gestión de proveedores (RF-020). Todo el módulo es solo-staff.
 */

import type { Request, Response, NextFunction } from 'express';
import * as suppliersService from './suppliers.service.js';
import type { CreateSupplierInput, UpdateSupplierInput } from './suppliers.schema.js';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const suppliers = await suppliersService.listSuppliers();
    res.status(200).json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supplier = await suppliersService.createSupplier(req.body as CreateSupplierInput);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supplier = await suppliersService.updateSupplier(
      req.params.id as string,
      req.body as UpdateSupplierInput,
    );
    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await suppliersService.deleteSupplier(req.params.id as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
