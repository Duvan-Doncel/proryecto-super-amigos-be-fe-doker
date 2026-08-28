/**
 * Archivo: modules/pets/pets.schema.ts
 * Descripción: Schemas de validación zod para el registro de mascotas (RF-012).
 * ¿Para qué? Garantizar que solo datos bien formados lleguen al service.
 * ¿Impacto? Sin esto, se podrían crear mascotas sin nombre o con un clientId malformado.
 */

import { z } from 'zod';

// ¿Qué? Especies aceptadas por el negocio — un conjunto cerrado, no texto libre (RN-126).
// ¿Para qué? Evitar variantes inconsistentes ("Perro", "perro", "canino") que después
//   dificultarían filtrar o reportar por especie.
export const PET_SPECIES = ['canina', 'felina', 'lagomorfo', 'porcina'] as const;

// ¿Qué? Valida los datos para que el staff registre una mascota a nombre de un cliente.
export const createPetSchema = z.object({
  clientId: z.string().uuid('El clientId debe ser un UUID válido.'),
  name: z.string().min(1, 'El nombre de la mascota es requerido.').max(100).trim(),
  species: z.enum(PET_SPECIES, {
    errorMap: () => ({ message: `La especie debe ser una de: ${PET_SPECIES.join(', ')}.` }),
  }),
  breed: z.string().max(100).trim().optional(),
  gender: z.string().max(20).trim().optional(),
  age: z.coerce.number().int().min(0).max(100).optional(),
  weight: z.coerce.number().positive('El peso debe ser mayor a 0.').max(999.99).optional(),
  color: z.string().max(50).trim().optional(),
  // ¿Qué? Si el staff no escribe nada, se guarda "No aplica" en vez de dejarlo vacío.
  pathology: z.string().max(300).trim().optional().default('No aplica'),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
