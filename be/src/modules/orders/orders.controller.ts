/**
 * Archivo: modules/orders/orders.controller.ts
 * Descripción: Handlers HTTP para el carrito y los pedidos de productos (RF-016, RF-019).
 */

import type { Request, Response, NextFunction } from 'express';
import * as ordersService from './orders.service.js';
import type { CreateOrderInput, UpdateOrderStatusInput } from './orders.schema.js';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await ordersService.createOrder(req.user!.id, req.body as CreateOrderInput);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await ordersService.listMyOrders(req.user!.id);
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function listPending(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await ordersService.listPendingOrders();
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await ordersService.updateOrderStatus(
      req.params.id as string,
      req.body as UpdateOrderStatusInput,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}
