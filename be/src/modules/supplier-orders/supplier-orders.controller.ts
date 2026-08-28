/**
 * Archivo: modules/supplier-orders/supplier-orders.controller.ts
 * Descripción: Handlers HTTP para los pedidos de reabastecimiento a proveedores (RF-021).
 */

import type { Request, Response, NextFunction } from 'express';
import * as supplierOrdersService from './supplier-orders.service.js';
import type { CreateSupplierOrderInput, ReceiveSupplierOrderInput } from './supplier-orders.schema.js';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await supplierOrdersService.listSupplierOrders();
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await supplierOrdersService.createSupplierOrder(req.body as CreateSupplierOrderInput);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Marca un pedido como recibido — incrementa el stock de sus productos.
export async function receive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { receivedDate } = req.body as ReceiveSupplierOrderInput;
    const order = await supplierOrdersService.receiveSupplierOrder(req.params.id as string, receivedDate);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}
