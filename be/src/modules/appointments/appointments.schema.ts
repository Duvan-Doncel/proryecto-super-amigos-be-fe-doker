/**
 * Archivo: modules/appointments/appointments.schema.ts
 * Descripción: Schemas de validación zod para las citas de grooming (RF-009).
 * ¿Para qué? Validar formato de fecha/hora antes de aplicar las reglas de negocio
 *   (horario de atención, antelación mínima) en el service.
 */

import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createAppointmentSchema = z.object({
  petId: z.string().uuid('El petId debe ser un UUID válido.'),
  serviceId: z.string().uuid('El serviceId debe ser un UUID válido.'),
  date: z.string().regex(DATE_REGEX, 'La fecha debe tener el formato AAAA-MM-DD.'),
  time: z.string().regex(TIME_REGEX, 'La hora debe tener el formato HH:mm.'),
  notes: z.string().max(500).trim().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled'], {
    errorMap: () => ({ message: "El estado debe ser 'confirmed', 'completed' o 'cancelled'." }),
  }),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
