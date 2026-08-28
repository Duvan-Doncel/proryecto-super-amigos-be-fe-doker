/**
 * Archivo: api/emergency.ts
 * Descripción: Llamadas HTTP para la información de emergencia (RF-011).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { EmergencyInfo } from '@/types/emergency';

export async function getEmergencyInfo(): Promise<EmergencyInfo> {
  const res = await apiClient.get<ApiResponse<EmergencyInfo>>('/emergency-info');
  return res.data.data;
}

export async function updateEmergencyInfo(data: EmergencyInfo): Promise<EmergencyInfo> {
  const res = await apiClient.put<ApiResponse<EmergencyInfo>>('/emergency-info', data);
  return res.data.data;
}
