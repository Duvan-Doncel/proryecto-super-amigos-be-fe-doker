/**
 * Archivo: modules/products/products.schema.ts
 * Descripción: Schemas de validación zod para el catálogo de productos (RF-015).
 */

import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre del producto es requerido.').max(150).trim(),
  description: z.string().max(1000).trim().optional(),
  price: z.coerce.number().positive('El precio debe ser mayor a 0.'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo.').default(0),
  category: z.string().max(50).trim().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  category: z.string().max(50).trim().optional(),
  active: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
