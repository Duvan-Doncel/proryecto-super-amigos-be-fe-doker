/**
 * Archivo: modules/products/products.schema.ts
 * Descripción: Schemas de validación zod para el catálogo de productos (RF-015).
 */

import { z } from 'zod';
import { LIMITS, moneyField, pageField } from '../../utils/limits.js';

export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre del producto es requerido.').max(150).trim(),
  description: z.string().max(1000).trim().optional(),
  price: moneyField(),
  stock: z.coerce
    .number()
    .int()
    .min(0, 'El stock no puede ser negativo.')
    .max(LIMITS.maxStock, `El stock no puede superar ${LIMITS.maxStock}.`)
    .default(0),
  category: z.string().max(50).trim().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  price: moneyField().optional(),
  stock: z.coerce.number().int().min(0).max(LIMITS.maxStock).optional(),
  category: z.string().max(50).trim().optional(),
  active: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ¿Qué? Query params de listado: paginación + filtros que ya existían como columnas
//   (category) o que buscan sobre una ya existente (search → name).
// ¿Para qué? Coerce porque llegan como string desde la query string ("?page=2").
export const listProductsQuerySchema = z.object({
  page: pageField(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
  // ¿Qué? Solo la usa /products/staff (incluir inactivos) — zod descarta claves no declaradas
  //   del query, así que debe listarse aquí aunque el listado público la ignore.
  active: z.enum(['true', 'false']).optional(),
  // ¿Qué? Filtro avanzado del panel de staff: solo productos con stock bajo.
  lowStock: z.enum(['true']).optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
