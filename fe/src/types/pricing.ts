/**
 * Archivo: types/pricing.ts
 * Descripción: Tipos y etiquetas del tarifario del grooming (RF-014).
 * ¿Para qué? Precio final = base + tamaño + tipo de pelo + condiciones de piel + comportamiento.
 *   Los recargos de tamaño y pelo son propios por especie (perro / gato).
 */

import type { CoatType, PetBehavior, PetSize, PetSpecies, SkinConditionType } from './pets';

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  serviceId: string;
  serviceName: string;
  petId: string;
  petName: string;
  base: number;
  lines: PriceLine[];
  total: number;
  blocked: boolean;
  blockingConditions: string[];
}

export interface SizeTier {
  species: PetSpecies;
  size: PetSize;
  label: string;
  maxWeight: number | null;
}

export interface SkinRule {
  type: SkinConditionType;
  label: string;
  amount: number;
  blocksBooking: boolean;
}

export interface BehaviorRule {
  behavior: PetBehavior;
  label: string;
  amount: number;
  blocksBooking: boolean;
}

export interface SizeModifier {
  species: PetSpecies;
  size: PetSize;
  amount: number;
}
export interface CoatModifier {
  species: PetSpecies;
  coatType: CoatType;
  amount: number;
}

export interface ServiceModifiers {
  id: string;
  name: string;
  basePrice: number;
  active: boolean;
  sizeModifiers: SizeModifier[];
  coatModifiers: CoatModifier[];
}

export interface PricingConfig {
  sizeTiers: SizeTier[];
  skinRules: SkinRule[];
  behaviorRules: BehaviorRule[];
  services: ServiceModifiers[];
}

export interface PublicPricing {
  sizeTiers: SizeTier[];
  skinSurcharges: SkinRule[];
  behaviorSurcharges: BehaviorRule[];
  blockingConditions: string[];
  services: Omit<ServiceModifiers, 'active'>[];
}

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  canina: 'Perro',
  felina: 'Gato',
};

export const SIZE_LABELS: Record<PetSize, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande: 'Grande',
  gigante: 'Gigante',
};

export const COAT_LABELS: Record<CoatType, string> = {
  corto: 'Corto',
  largo: 'Largo',
};

export const BEHAVIOR_LABELS: Record<PetBehavior, string> = {
  tranquilo: 'Tranquilo',
  nervioso: 'Nervioso',
  agresivo: 'Agresivo',
};

export const SKIN_CONDITION_LABELS: Record<SkinConditionType, string> = {
  pulgas: 'Pulgas',
  garrapatas: 'Garrapatas',
  piel_irritada: 'Piel irritada',
  alergia: 'Alergia conocida',
  piel_sensible: 'Piel sensible',
  nudos: 'Nudos / pelo enredado',
  hongos: 'Hongos',
  sarna: 'Sarna',
  heridas: 'Heridas abiertas',
  infeccion: 'Infección visible',
};

export function formatCOP(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-CO')}`;
}
