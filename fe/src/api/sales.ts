/**
 * Archivo: api/sales.ts
 * Descripción: Llamadas HTTP para ventas de mostrador (RF-023) y el reporte de ventas (RF-022).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { CreateSaleRequest, Sale, SalesReport } from '@/types/sales';

export async function createSale(data: CreateSaleRequest): Promise<Sale> {
  const res = await apiClient.post<ApiResponse<Sale>>('/sales', data);
  return res.data.data;
}

export async function getSalesReport(from: string, to: string): Promise<SalesReport> {
  const res = await apiClient.get<ApiResponse<SalesReport>>('/staff/sales-report', { params: { from, to } });
  return res.data.data;
}
