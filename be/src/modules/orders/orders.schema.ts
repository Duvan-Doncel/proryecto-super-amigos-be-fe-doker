/**
 * Archivo: modules/orders/orders.schema.ts
 * Descripción: Schemas de validación zod para el carrito y los pedidos de productos (RF-016).
 */

import { z } from 'zod';
import { LIMITS, quantityField } from '../../utils/limits.js';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('El productId debe ser un UUID válido.'),
        quantity: quantityField(),
      }),
    )
    .min(1, 'El pedido debe tener al menos un producto.')
    .max(LIMITS.maxItems, `El pedido no puede tener más de ${LIMITS.maxItems} productos.`),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['completed', 'cancelled'], {
    errorMap: () => ({ message: "El estado debe ser 'completed' o 'cancelled'." }),
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
