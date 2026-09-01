/**
 * Archivo: modules/pricing/pricing.schema.ts
 * Descripción: Schemas de validación zod para editar el tarifario del grooming (RF-014).
 * ¿Para qué? El admin ajusta tramos de peso (por especie), recargos por condición de piel
 *   y comportamiento, y los modificadores de cada servicio — sin tocar código.
 */

import { z } from 'zod';

export const PET_SIZES = ['pequeno', 'mediano', 'grande', 'gigante'] as const;
export const COAT_TYPES = ['corto', 'largo'] as const;
export const PET_SPECIES_VALUES = ['canina', 'felina'] as const;
export const PET_BEHAVIORS = ['tranquilo', 'nervioso', 'agresivo'] as const;
export const SKIN_CONDITION_TYPES = [
  'pulgas',
  'garrapatas',
  'piel_irritada',
  'alergia',
  'piel_sensible',
  'nudos',
  'hongos',
  'sarna',
  'heridas',
  'infeccion',
] as const;

const money = z.coerce.number().min(0, 'El monto no puede ser negativo.').max(9_999_999);

// ¿Qué? Reemplaza TODOS los tramos de tamaño (4 por especie = 8) de una vez.
export const updateSizeTiersSchema = z.object({
  tiers: z
    .array(
      z.object({
        species: z.enum(PET_SPECIES_VALUES),
        size: z.enum(PET_SIZES),
        label: z.string().min(1).max(50).trim(),
        maxWeight: z.coerce.number().positive().max(999.99).nullable(),
      }),
    )
    .length(PET_SIZES.length * PET_SPECIES_VALUES.length),
});
export type UpdateSizeTiersInput = z.infer<typeof updateSizeTiersSchema>;

// ¿Qué? Reemplaza TODAS las reglas de condición de piel de una vez (upsert por `type`).
export const updateSkinRulesSchema = z.object({
  rules: z
    .array(
      z.object({
        type: z.enum(SKIN_CONDITION_TYPES),
        label: z.string().min(1).max(100).trim(),
        amount: money,
        blocksBooking: z.boolean(),
      }),
    )
    .length(SKIN_CONDITION_TYPES.length),
});
export type UpdateSkinRulesInput = z.infer<typeof updateSkinRulesSchema>;

// ¿Qué? Reemplaza las reglas de comportamiento (una por nivel).
export const updateBehaviorRulesSchema = z.object({
  rules: z
    .array(
      z.object({
        behavior: z.enum(PET_BEHAVIORS),
        label: z.string().min(1).max(100).trim(),
        amount: money,
        blocksBooking: z.boolean(),
      }),
    )
    .length(PET_BEHAVIORS.length),
});
export type UpdateBehaviorRulesInput = z.infer<typeof updateBehaviorRulesSchema>;

// ¿Qué? Fija los modificadores de tamaño y pelo de UN servicio, por especie (reemplaza los existentes).
export const updateServiceModifiersSchema = z.object({
  sizeModifiers: z
    .array(
      z.object({
        species: z.enum(PET_SPECIES_VALUES),
        size: z.enum(PET_SIZES),
        amount: money,
      }),
    )
    .max(PET_SIZES.length * PET_SPECIES_VALUES.length)
    .default([]),
  coatModifiers: z
    .array(
      z.object({
        species: z.enum(PET_SPECIES_VALUES),
        coatType: z.enum(COAT_TYPES),
        amount: money,
      }),
    )
    .max(COAT_TYPES.length * PET_SPECIES_VALUES.length)
    .default([]),
});
export type UpdateServiceModifiersInput = z.infer<typeof updateServiceModifiersSchema>;
