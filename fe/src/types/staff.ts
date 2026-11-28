/**
 * Archivo: types/staff.ts
 * Descripción: Tipos TypeScript exclusivos del panel de staff.
 */

export interface ClientSummary {
  id: string;
  documentId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  // ¿Qué? Fecha de alta ("cliente desde") y nº de mascotas registradas — se muestran en
  //   la pantalla "Clientes". Opcionales porque respuestas antiguas / cacheadas podrían
  //   no traerlos.
  createdAt?: string;
  petCount?: number;
  // ¿Qué? Baja del cliente: fecha y motivo. null (o ausente) = cliente activo.
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
}

// ¿Qué? Filtro de estado de la lista de clientes.
export type ClientStatusFilter = 'active' | 'inactive' | 'all';

// ¿Qué? Respuesta al dar de baja o reactivar a un cliente.
export interface ClientStatusResult {
  id: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  cancelledAppointments: number;
  cancelledOrders: number;
}

// ¿Qué? Metadatos de paginación que devuelve GET /staff/clients.
export interface ClientsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedClients {
  clients: ClientSummary[];
  meta: ClientsMeta;
}
