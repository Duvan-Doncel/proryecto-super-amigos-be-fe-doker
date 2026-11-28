/**
 * Archivo: modules/supplier-orders/supplier-orders.schema.ts
 * Descripción: Schemas de validación zod para los pedidos de reabastecimiento (RF-021).
 */

import { z } from 'zod';
import { LIMITS, isoDate, moneyField, quantityField } from '../../utils/limits.js';


export const createSupplierOrderSchema = z.object({
  supplierId: z.string().uuid('El supplierId debe ser un UUID válido.'),
  expectedDate: isoDate().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('El productId debe ser un UUID válido.'),
        quantity: quantityField(),
        unitCost: moneyField('El costo unitario'),
      }),
    )
    .min(1, 'El pedido debe tener al menos un producto.')
    .max(LIMITS.maxItems, `El pedido no puede tener más de ${LIMITS.maxItems} productos.`),
});

export type CreateSupplierOrderInput = z.infer<typeof createSupplierOrderSchema>;

export const receiveSupplierOrderSchema = z.object({
  status: z.literal('received'),
  receivedDate: isoDate().optional(),
});

export type ReceiveSupplierOrderInput = z.infer<typeof receiveSupplierOrderSchema>;
