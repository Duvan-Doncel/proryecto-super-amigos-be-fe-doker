/**
 * Archivo: api/services.ts
 * Descripción: Llamadas HTTP para el catálogo de servicios (RF-014).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { CreateServiceRequest, Service, UpdateServiceRequest } from '@/types/services';

// ¿Qué? Catálogo público — siempre solo servicios activos.
export async function listServices(): Promise<Service[]> {
  const res = await apiClient.get<ApiResponse<Service[]>>('/services');
  return res.data.data;
}

// ¿Qué? Catálogo completo para el staff, incluye inactivos.
export async function listServicesForStaff(activeOnly = true): Promise<Service[]> {
  const res = await apiClient.get<ApiResponse<Service[]>>('/services/staff', {
    params: { active: activeOnly },
  });
  return res.data.data;
}

export async function createService(data: CreateServiceRequest): Promise<Service> {
  const res = await apiClient.post<ApiResponse<Service>>('/services', data);
  return res.data.data;
}

export async function updateService(id: string, data: UpdateServiceRequest): Promise<Service> {
  const res = await apiClient.put<ApiResponse<Service>>(`/services/${id}`, data);
  return res.data.data;
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}
