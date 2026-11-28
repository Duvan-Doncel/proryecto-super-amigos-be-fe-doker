/**
 * Archivo: modules/sales/sales.schema.ts
 * Descripción: Schemas de validación zod para las ventas de mostrador (RF-023) y
 *   el reporte de ventas (RF-022).
 */

import { z } from 'zod';
import { LIMITS, dateRange, quantityField } from '../../utils/limits.js';

export const createSaleSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid('El productId debe ser un UUID válido.'),
          quantity: quantityField(),
        }),
      )
      .min(1, 'La venta debe tener al menos un producto.')
      .max(LIMITS.maxItems, `La venta no puede tener más de ${LIMITS.maxItems} productos.`),
    clientId: z.string().uuid().optional(),
    clientName: z.string().max(150).trim().optional(),
  })
  .refine((data) => !(data.clientId && data.clientName), {
    message: 'Indica clientId o clientName, no ambos.',
    path: ['clientName'],
  });

export type CreateSaleInput = z.infer<typeof createSaleSchema>;


// ¿Impacto? Máx. 366 días: un reporte de hasta un año.
export const salesReportQuerySchema = dateRange(366);

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
