/**
 * Archivo: modules/symptom-reports/symptom-reports.schema.ts
 * Descripción: Schemas de validación zod para los reportes de síntomas leves (RF-010).
 */

import { z } from 'zod';

export const createSymptomReportSchema = z.object({
  petId: z.string().uuid('El petId debe ser un UUID válido.'),
  symptom: z.string().min(3, 'Describe el síntoma con al menos 3 caracteres.').max(500).trim(),
  daysWithSymptom: z.coerce.number().int().min(1, 'Debe ser al menos 1 día.'),
  notes: z.string().max(500).trim().optional(),
});

export type CreateSymptomReportInput = z.infer<typeof createSymptomReportSchema>;

export const reviewSymptomReportSchema = z.object({
  recommendation: z.string().min(1, 'La recomendación es requerida.').max(1000).trim(),
});

export type ReviewSymptomReportInput = z.infer<typeof reviewSymptomReportSchema>;
