/**
 * Archivo: modules/supplier-orders/supplier-orders.schema.ts
 * Descripción: Schemas de validación zod para los pedidos de reabastecimiento (RF-021).
 */

import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createSupplierOrderSchema = z.object({
  supplierId: z.string().uuid('El supplierId debe ser un UUID válido.'),
  expectedDate: z.string().regex(DATE_REGEX, 'La fecha debe tener el formato AAAA-MM-DD.').optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('El productId debe ser un UUID válido.'),
        quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0.'),
        unitCost: z.coerce.number().positive('El costo unitario debe ser mayor a 0.'),
      }),
    )
    .min(1, 'El pedido debe tener al menos un producto.'),
});

export type CreateSupplierOrderInput = z.infer<typeof createSupplierOrderSchema>;

export const receiveSupplierOrderSchema = z.object({
  status: z.literal('received'),
  receivedDate: z.string().regex(DATE_REGEX, 'La fecha debe tener el formato AAAA-MM-DD.').optional(),
});

export type ReceiveSupplierOrderInput = z.infer<typeof receiveSupplierOrderSchema>;
