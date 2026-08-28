/**
 * Archivo: modules/orders/orders.schema.ts
 * Descripción: Schemas de validación zod para el carrito y los pedidos de productos (RF-016).
 */

import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('El productId debe ser un UUID válido.'),
        quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0.'),
      }),
    )
    .min(1, 'El pedido debe tener al menos un producto.'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['completed', 'cancelled'], {
    errorMap: () => ({ message: "El estado debe ser 'completed' o 'cancelled'." }),
  }),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
