/**
 * Archivo: types/suppliers.ts
 * Descripción: Tipos TypeScript para la gestión de proveedores (RF-020).
 */

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
}
