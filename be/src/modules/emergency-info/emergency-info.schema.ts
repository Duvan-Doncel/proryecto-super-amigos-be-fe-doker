/**
 * Archivo: modules/emergency-info/emergency-info.schema.ts
 * Descripción: Schema de validación zod para la configuración de emergencia (RF-011).
 */

import { z } from 'zod';

export const updateEmergencyInfoSchema = z.object({
  searchQuery: z.string().min(3, 'El texto de búsqueda es requerido.').max(200).trim(),
  emergencyPhones: z
    .array(
      z.object({
        label: z.string().min(1, 'La etiqueta es requerida.').max(100).trim(),
        phone: z.string().min(3, 'El teléfono es requerido.').max(30).trim(),
      }),
    )
    .min(1, 'Debe haber al menos un número de emergencia.'),
});

export type UpdateEmergencyInfoInput = z.infer<typeof updateEmergencyInfoSchema>;
