/**
 * Archivo: modules/suppliers/suppliers.schema.ts
 * Descripción: Schemas de validación zod para la gestión de proveedores (RF-020).
 */

import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'El nombre del proveedor es requerido.').max(150).trim(),
  contactName: z.string().max(150).trim().optional(),
  phone: z.string().max(30).trim().optional(),
  email: z.string().email('El email no tiene un formato válido.').trim().optional(),
  address: z.string().max(300).trim().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = z.object({
  name: z.string().min(2).max(150).trim().optional(),
  contactName: z.string().max(150).trim().optional(),
  phone: z.string().max(30).trim().optional(),
  email: z.string().email().trim().optional(),
  address: z.string().max(300).trim().optional(),
  active: z.boolean().optional(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
