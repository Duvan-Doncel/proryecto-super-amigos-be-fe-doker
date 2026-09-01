/**
 * Archivo: api/pricing.ts
 * Descripción: Llamadas HTTP del tarifario del grooming (RF-014).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type {
  BehaviorRule,
  CoatModifier,
  PricingConfig,
  PublicPricing,
  SizeModifier,
  SizeTier,
  SkinRule,
} from '@/types/pricing';

// ¿Qué? Tarifario público — para "Cómo calculamos el precio" (sin auth).
export async function getPublicPricing(): Promise<PublicPricing> {
  const res = await apiClient.get<ApiResponse<PublicPricing>>('/pricing/public');
  return res.data.data;
}

// ¿Qué? Configuración completa — pantalla de admin (solo staff).
export async function getPricingConfig(): Promise<PricingConfig> {
  const res = await apiClient.get<ApiResponse<PricingConfig>>('/pricing/config');
  return res.data.data;
}

export async function updateSizeTiers(tiers: SizeTier[]): Promise<PricingConfig> {
  const res = await apiClient.put<ApiResponse<PricingConfig>>('/pricing/size-tiers', { tiers });
  return res.data.data;
}

export async function updateSkinRules(rules: SkinRule[]): Promise<PricingConfig> {
  const res = await apiClient.put<ApiResponse<PricingConfig>>('/pricing/skin-rules', { rules });
  return res.data.data;
}

export async function updateBehaviorRules(rules: BehaviorRule[]): Promise<PricingConfig> {
  const res = await apiClient.put<ApiResponse<PricingConfig>>('/pricing/behavior-rules', { rules });
  return res.data.data;
}

// ¿Qué? Fija los recargos por tamaño y pelo de un servicio, por especie (RF-014, solo staff).
export async function updateServiceModifiers(
  serviceId: string,
  sizeModifiers: SizeModifier[],
  coatModifiers: CoatModifier[],
): Promise<PricingConfig> {
  const res = await apiClient.put<ApiResponse<PricingConfig>>(`/services/${serviceId}/modifiers`, {
    sizeModifiers,
    coatModifiers,
  });
  return res.data.data;
}
