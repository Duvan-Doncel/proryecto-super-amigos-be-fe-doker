/**
 * Archivo: api/supplier-orders.ts
 * Descripción: Llamadas HTTP para los pedidos de reabastecimiento a proveedores (RF-021).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { CreateSupplierOrderRequest, SupplierOrder } from '@/types/supplier-orders';

export async function listSupplierOrders(): Promise<SupplierOrder[]> {
  const res = await apiClient.get<ApiResponse<SupplierOrder[]>>('/supplier-orders');
  return res.data.data;
}

export async function createSupplierOrder(data: CreateSupplierOrderRequest): Promise<SupplierOrder> {
  const res = await apiClient.post<ApiResponse<SupplierOrder>>('/supplier-orders', data);
  return res.data.data;
}

// ¿Qué? Marca un pedido como recibido — incrementa el stock de sus productos (RF-021).
export async function receiveSupplierOrder(id: string, receivedDate?: string): Promise<SupplierOrder> {
  const res = await apiClient.put<ApiResponse<SupplierOrder>>(`/supplier-orders/${id}`, {
    status: 'received',
    receivedDate,
  });
  return res.data.data;
}
