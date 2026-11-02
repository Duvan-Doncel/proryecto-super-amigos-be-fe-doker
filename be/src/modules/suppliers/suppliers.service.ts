/**
 * Archivo: modules/suppliers/suppliers.service.ts
 * Descripción: Lógica de negocio de la gestión de proveedores (RF-020).
 */

import type { Supplier } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError, ValidationError } from '../../middlewares/error.middleware.js';
import type { CreateSupplierInput, UpdateSupplierInput } from './suppliers.schema.js';

export interface SupplierResponse {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
  createdAt: Date;
}

function toResponse(s: Supplier): SupplierResponse {
  return {
    id: s.id,
    name: s.name,
    contactName: s.contactName,
    phone: s.phone,
    email: s.email,
    address: s.address,
    active: s.active,
    createdAt: s.createdAt,
  };
}

// ¿Qué? Rechaza textos que traen el carácter nulo (\u0000) en cualquier campo.
// ¿Para qué? PostgreSQL no acepta ese carácter en columnas de texto y respondía 500.
//   (MySQL sí lo guarda: es una diferencia entre motores.) Hallazgo de la semana 6,
//   capa BD; lo fijan tests/suppliers.rules.test.ts y tests/suppliers.db.test.ts.
// ¿Impacto? El cliente recibe 422 con el formato del contrato en vez de un 500.
export function assertNoNullCharacters(data: Record<string, unknown>): void {
  for (const value of Object.values(data)) {
    if (typeof value === 'string' && value.includes('\u0000')) {
      throw new ValidationError('El texto contiene caracteres no permitidos.');
    }
  }
}

export async function listSuppliers(): Promise<SupplierResponse[]> {
  const suppliers = await db.supplier.findMany({ orderBy: { name: 'asc' } });
  return suppliers.map(toResponse);
}

export async function createSupplier(data: CreateSupplierInput): Promise<SupplierResponse> {
  assertNoNullCharacters(data);
  const supplier = await db.supplier.create({ data });
  return toResponse(supplier);
}

export async function updateSupplier(
  id: string,
  data: UpdateSupplierInput,
): Promise<SupplierResponse> {
  const existing = await db.supplier.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Proveedor no encontrado.');

  assertNoNullCharacters(data);
  const updated = await db.supplier.update({ where: { id }, data });
  return toResponse(updated);
}

// ¿Qué? "Elimina" un proveedor — si tiene pedidos asociados, lo desactiva (RN-202).
export async function deleteSupplier(id: string): Promise<{ softDeleted: boolean }> {
  const existing = await db.supplier.findUnique({
    where: { id },
    include: { _count: { select: { supplierOrders: true } } },
  });
  if (!existing) throw new NotFoundError('Proveedor no encontrado.');

  if (existing._count.supplierOrders > 0) {
    await db.supplier.update({ where: { id }, data: { active: false } });
    return { softDeleted: true };
  }

  await db.supplier.delete({ where: { id } });
  return { softDeleted: false };
}