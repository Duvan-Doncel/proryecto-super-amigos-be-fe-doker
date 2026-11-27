/**
 * Archivo: api/staff.ts
 * Descripción: Llamadas HTTP exclusivas del staff que no pertenecen a un módulo de dominio
 *   propio (gestión de clientes).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type {
  ClientStatusFilter,
  ClientStatusResult,
  ClientSummary,
  ClientsMeta,
  PaginatedClients,
} from '@/types/staff';

type ClientsApiResponse = ApiResponse<ClientSummary[]> & { meta: ClientsMeta };

interface ListClientsParams {
  q?: string;
  hasPets?: 'true' | 'false';
  // ¿Qué? Por defecto el backend devuelve solo clientes activos.
  status?: ClientStatusFilter;
  page?: number;
  limit?: number;
}

// ¿Qué? Lista de clientes paginada, con búsqueda opcional — pantalla "Clientes" del panel.
export async function listClients(params: ListClientsParams = {}): Promise<PaginatedClients> {
  const res = await apiClient.get<ClientsApiResponse>('/staff/clients', { params });
  return { clients: res.data.data, meta: res.data.meta };
}

// ¿Qué? Busca clientes por nombre, email o documento — soporte de RF-012 (registrar mascota,
//   registrar venta). Devuelve solo el array; ignora la paginación.
export async function searchClients(q: string): Promise<ClientSummary[]> {
  const { clients } = await listClients({ q, limit: 10 });
  return clients;
}

// ¿Qué? Da de baja a un cliente (borrado lógico): pierde el acceso, se conserva su historial
//   y se cancelan sus citas futuras y pedidos pendientes.
export async function deactivateClient(id: string, reason?: string): Promise<ClientStatusResult> {
  const res = await apiClient.post<ApiResponse<ClientStatusResult>>(`/staff/clients/${id}/deactivate`, {
    reason: reason || undefined,
  });
  return res.data.data;
}

// ¿Qué? Devuelve el acceso a un cliente dado de baja.
export async function reactivateClient(id: string): Promise<ClientStatusResult> {
  const res = await apiClient.post<ApiResponse<ClientStatusResult>>(`/staff/clients/${id}/reactivate`);
  return res.data.data;
}
