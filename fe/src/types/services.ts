/**
 * Archivo: types/services.ts
 * Descripción: Tipos TypeScript para el catálogo de servicios de grooming (RF-014).
 */

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  active?: boolean;
}
