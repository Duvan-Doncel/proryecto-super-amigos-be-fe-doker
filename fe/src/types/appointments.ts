/**
 * Archivo: types/appointments.ts
 * Descripción: Tipos TypeScript para las citas de grooming (RF-009, RF-017).
 */

import type { PriceBreakdown } from './pricing';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  clientId: string;
  petId: string;
  serviceId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string | null;
  // ¿Qué? Precio congelado al agendar (RF-009). Null en citas previas al motor de precios.
  totalPrice: number | null;
  priceBreakdown: PriceBreakdown | null;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  petId: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

// ¿Qué? Cupos ocupados por día, dentro de un rango — el cliente los consulta antes de
//   elegir fecha (RF-009). Solo trae los días CON al menos una cita; los ausentes están
//   en 0 (capacidad completa disponible).
export interface AvailabilityDay {
  date: string;
  booked: number;
}

export interface Availability {
  capacity: number;
  days: AvailabilityDay[];
}

// ¿Qué? Forma enriquecida usada en la agenda del staff (RF-017).
export interface AgendaAppointment {
  id: string;
  time: string;
  status: AppointmentStatus;
  pet: { id: string; name: string };
  client: { id: string; firstName: string; lastName: string; phone: string | null };
  service: { id: string; name: string; durationMinutes: number };
}
