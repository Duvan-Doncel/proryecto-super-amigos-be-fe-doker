/**
 * Archivo: modules/suppliers/suppliers.service.ts
 * Descripción: Lógica de negocio de la gestión de proveedores (RF-020).
 */

import type { Supplier } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';
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

export async function listSuppliers(): Promise<SupplierResponse[]> {
  const suppliers = await db.supplier.findMany({ orderBy: { name: 'asc' } });
  return suppliers.map(toResponse);
}

export async function createSupplier(data: CreateSupplierInput): Promise<SupplierResponse> {
  const supplier = await db.supplier.create({ data });
  return toResponse(supplier);
}

export async function updateSupplier(
  id: string,
  data: UpdateSupplierInput,
): Promise<SupplierResponse> {
  const existing = await db.supplier.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Proveedor no encontrado.');

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
