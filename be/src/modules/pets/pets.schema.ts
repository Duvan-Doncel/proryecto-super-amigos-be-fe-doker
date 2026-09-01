/**
 * Archivo: modules/pets/pets.schema.ts
 * Descripción: Schemas de validación zod para el registro y edición de mascotas (RF-012).
 * ¿Para qué? Garantizar que solo datos bien formados lleguen al service.
 * ¿Impacto? Sin esto, se podrían crear mascotas sin nombre o con un clientId malformado.
 */

import { z } from 'zod';
import { COAT_TYPES, PET_BEHAVIORS, SKIN_CONDITION_TYPES } from '../pricing/pricing.schema.js';

// ¿Qué? Especies aceptadas por el negocio — un conjunto cerrado, no texto libre (RN-126).
// ¿Para qué? Evitar variantes inconsistentes ("Perro", "perro", "canino") que después
//   dificultarían filtrar o reportar por especie.
export const PET_SPECIES = ['canina', 'felina'] as const;

// ¿Qué? Tramos de tamaño y largos de pelo que puede fijar el staff (RF-012, factores de precio RF-014).
export const PET_SIZES = ['pequeno', 'mediano', 'grande', 'gigante'] as const;
export const PET_COAT_TYPES = COAT_TYPES;

// ¿Qué? Etiquetas de condición de piel que el staff marca en la ficha.
// ¿Para qué? Alimentan el motor de precios y la regla de bloqueo de citas (RF-009).
const skinConditionInput = z.object({
  type: z.enum(SKIN_CONDITION_TYPES),
  note: z.string().max(300).trim().optional(),
});

// ¿Qué? Campos comunes al crear y editar una mascota.
const petFields = {
  name: z.string().min(1, 'El nombre de la mascota es requerido.').max(100).trim(),
  species: z.enum(PET_SPECIES, {
    errorMap: () => ({ message: `La especie debe ser una de: ${PET_SPECIES.join(', ')}.` }),
  }),
  breed: z.string().max(100).trim().optional(),
  gender: z.string().max(20).trim().optional(),
  age: z.coerce.number().int().min(0).max(100).optional(),
  weight: z.coerce.number().positive('El peso debe ser mayor a 0.').max(999.99).optional(),
  color: z.string().max(50).trim().optional(),
  // ¿Qué? Si no se envía, el service lo deduce del peso (o queda null).
  size: z.enum(PET_SIZES).optional(),
  coatType: z.enum(PET_COAT_TYPES).optional(),
  behavior: z.enum(PET_BEHAVIORS).optional(),
  skinConditions: z.array(skinConditionInput).max(SKIN_CONDITION_TYPES.length).optional(),
  // ¿Qué? Si el staff no escribe nada, se guarda "No aplica" en vez de dejarlo vacío.
  pathology: z.string().max(300).trim().optional().default('No aplica'),
};

// ¿Qué? Valida los datos para que el staff registre una mascota a nombre de un cliente.
export const createPetSchema = z.object({
  clientId: z.string().uuid('El clientId debe ser un UUID válido.'),
  ...petFields,
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

// ¿Qué? Edición de una mascota (RF-012) — todos los campos opcionales, se actualiza lo que llega.
// ¿Para qué? El staff ajusta talla, pelo o condiciones de piel a medida que conoce al animal.
export const updatePetSchema = z.object({
  name: petFields.name.optional(),
  species: z
    .enum(PET_SPECIES, {
      errorMap: () => ({ message: `La especie debe ser una de: ${PET_SPECIES.join(', ')}.` }),
    })
    .optional(),
  breed: petFields.breed,
  gender: petFields.gender,
  age: petFields.age,
  weight: petFields.weight,
  color: petFields.color,
  size: petFields.size,
  coatType: petFields.coatType,
  behavior: petFields.behavior,
  skinConditions: petFields.skinConditions,
  pathology: z.string().max(300).trim().optional(),
});

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
