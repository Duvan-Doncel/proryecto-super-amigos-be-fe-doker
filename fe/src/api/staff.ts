/**
 * Archivo: api/staff.ts
 * Descripción: Llamadas HTTP exclusivas del staff que no pertenecen a un módulo de dominio
 *   propio (por ahora, solo la búsqueda de clientes de apoyo a RF-012).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { ClientSummary } from '@/types/staff';

// ¿Qué? Busca clientes por nombre, email o documento — soporte técnico de RF-012.
export async function searchClients(q: string): Promise<ClientSummary[]> {
  const res = await apiClient.get<ApiResponse<ClientSummary[]>>('/staff/clients', { params: { q } });
  return res.data.data;
}
