/**
 * Archivo: types/emergency.ts
 * Descripción: Tipos TypeScript para la información de emergencia (RF-011).
 */

export interface EmergencyPhone {
  label: string;
  phone: string;
}

export interface EmergencyInfo {
  searchQuery: string;
  emergencyPhones: EmergencyPhone[];
}
