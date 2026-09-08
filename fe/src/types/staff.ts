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
