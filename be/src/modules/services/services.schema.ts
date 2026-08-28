/**
 * Archivo: modules/services/services.schema.ts
 * Descripción: Schemas de validación zod para el catálogo de servicios (RF-014).
 * ¿Para qué? Los precios se revisan cada año — validar bien evita datos corruptos en el catálogo.
 */

import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'El nombre del servicio es requerido.').max(150).trim(),
  description: z.string().max(1000).trim().optional(),
  price: z.coerce.number().positive('El precio debe ser mayor a 0.'),
  durationMinutes: z.coerce.number().int().positive('La duración debe ser mayor a 0.'),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

// ¿Qué? Todos los campos son opcionales al editar — se actualiza solo lo que se envía.
export const updateServiceSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  price: z.coerce.number().positive().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
