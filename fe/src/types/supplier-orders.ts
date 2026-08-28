/**
 * Archivo: types/supplier-orders.ts
 * Descripción: Tipos TypeScript para los pedidos de reabastecimiento a proveedores (RF-021).
 */

export type SupplierOrderStatus = 'ordered' | 'received';

export interface SupplierOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: SupplierOrderStatus;
  expectedDate: string | null;
  receivedDate: string | null;
  items: SupplierOrderItem[];
  createdAt: string;
}

export interface CreateSupplierOrderRequest {
  supplierId: string;
  expectedDate?: string;
  items: { productId: string; quantity: number; unitCost: number }[];
}
