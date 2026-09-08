/**
 * Archivo: modules/users/users.schema.ts
 * Descripción: Schemas de validación zod para el perfil de usuario (RF-007).
 * ¿Para qué? Validar en el servidor la edición del propio perfil y los query params del
 *   listado de clientes del staff — mismas reglas que el registro para nombre y teléfono.
 */

import { z } from 'zod';

// ¿Qué? Mismas reglas que auth.schema (letras / dígitos) — repetidas aquí para no crear
//   una dependencia entre módulos por una constante.
const NAME_REGEX = /^\p{L}+(?:[ '-]\p{L}+)*$/u;
const PHONE_REGEX = /^\d{7,15}$/;

// --- Editar el propio perfil (PUT /api/v1/users/me) ---
// ¿Qué? Solo datos que el usuario puede cambiar sin intervención del staff. NO incluye
//   email (requiere re-verificación), documento ni rol.
// ¿Impacto? Todos opcionales, pero al menos uno debe venir (.refine).
export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(100)
      .regex(NAME_REGEX, 'El nombre solo puede contener letras.')
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres.')
      .max(100)
      .regex(NAME_REGEX, 'El apellido solo puede contener letras.')
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(PHONE_REGEX, 'El teléfono debe tener entre 7 y 15 dígitos.')
      .optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Envía al menos un campo para actualizar.',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- Listado de clientes para el staff (GET /api/v1/staff/clients) ---
// ¿Qué? `q` opcional para buscar; `page`/`limit` para paginar la lista completa.
// ¿Para qué? La pantalla "Clientes" del panel necesita recorrer todos los clientes
//   paginados; el buscador de mascotas sigue usando el mismo endpoint con `q`.
export const listClientsQuerySchema = z.object({
  q: z.string().trim().min(2, 'Escribe al menos 2 caracteres para buscar.').max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
