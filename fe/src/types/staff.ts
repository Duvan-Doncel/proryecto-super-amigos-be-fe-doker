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
}
