/**
 * Archivo: modules/pricing/pricing.service.ts
 * Descripción: Motor de precios del grooming (RF-014). Calcula el precio final de un servicio
 *   para una mascota concreta: precio base + tamaño + tipo de pelo + condiciones de piel + comportamiento.
 * ¿Para qué? Centralizar la fórmula en un solo lugar, para que el estimador del cliente (RF-009),
 *   el agendamiento y el reporte de ventas (RF-022) usen exactamente el mismo cálculo.
 * ¿Impacto? Los recargos por tamaño y pelo están diferenciados por especie (perro/gato).
 *   Si una condición de piel o el comportamiento exigen revisión previa (blocksBooking),
 *   el resultado viene con `blocked = true` y la cita NO debe crearse (se deriva al RF-010).
 */

import type { CoatType, PetSize, PetSpecies } from '@prisma/client';
import { db } from '../../db/index.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';
import type {
  UpdateBehaviorRulesInput,
  UpdateServiceModifiersInput,
  UpdateSizeTiersInput,
  UpdateSkinRulesInput,
} from './pricing.schema.js';

// ¿Qué? Una línea del desglose que ve el cliente: una etiqueta y cuánto suma (o resta).
export interface PriceLine {
  label: string;
  amount: number;
}

// ¿Qué? Resultado completo del cálculo — se guarda tal cual en `Appointment.priceBreakdown`.
export interface PriceBreakdown {
  serviceId: string;
  serviceName: string;
  petId: string;
  petName: string;
  base: number;
  lines: PriceLine[];
  total: number;
  // ¿Qué? true si la mascota tiene al menos un factor que exige revisión previa.
  blocked: boolean;
  // ¿Qué? Nombres legibles de esos factores, para el aviso al cliente.
  blockingConditions: string[];
}

const SIZE_LABEL: Record<PetSize, string> = {
  pequeno: 'pequeño',
  mediano: 'mediano',
  grande: 'grande',
  gigante: 'gigante',
};
const COAT_LABEL: Record<CoatType, string> = {
  corto: 'Pelo corto',
  largo: 'Pelo largo',
};

// ¿Qué? Deduce el tramo de tamaño a partir del peso, usando los tramos de LA ESPECIE dada.
// ¿Para qué? El staff no siempre fija `Pet.size` a mano; si hay peso, se sugiere solo.
//   Un gato de 6 kg es "grande"; un perro de 6 kg es "pequeño" — por eso se filtra por especie.
// ¿Impacto? Devuelve null solo si no hay peso registrado. El tramo mayor (`maxWeight = null`)
//   actúa como "todo lo que supere el resto".
export async function deriveSizeFromWeight(
  weight: number | null | undefined,
  species: PetSpecies,
): Promise<PetSize | null> {
  if (weight == null) return null;

  const tiers = await db.sizeTier.findMany({ where: { species } });
  const withCap = tiers
    .filter((t) => t.maxWeight != null)
    .sort((a, b) => Number(a.maxWeight) - Number(b.maxWeight));
  const uncapped = tiers.find((t) => t.maxWeight == null);

  for (const tier of withCap) {
    if (weight <= Number(tier.maxWeight)) return tier.size;
  }
  return uncapped?.size ?? withCap.at(-1)?.size ?? null;
}

// ¿Qué? Calcula el precio final de un servicio para una mascota (RF-014).
// ¿Para qué? Lo usan el estimador (POST /appointments/quote) y el agendamiento (POST /appointments).
export async function calculatePrice(serviceId: string, petId: string): Promise<PriceBreakdown> {
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new NotFoundError('Servicio no encontrado.');

  const pet = await db.pet.findUnique({
    where: { id: petId },
    include: { skinConditions: true },
  });
  if (!pet) throw new NotFoundError('Mascota no encontrada.');

  const base = Number(service.price);
  const lines: PriceLine[] = [];
  const blockingConditions: string[] = [];

  // --- Factor 1: tamaño (recargo propio por especie) ---
  const size = pet.size ?? (await deriveSizeFromWeight(pet.weight ? Number(pet.weight) : null, pet.species));
  if (size) {
    const mod = await db.serviceSizeModifier.findUnique({
      where: { serviceId_species_size: { serviceId, species: pet.species, size } },
    });
    const amount = mod ? Number(mod.amount) : 0;
    if (amount !== 0) lines.push({ label: `Tamaño: ${SIZE_LABEL[size]}`, amount });
  }

  // --- Factor 2: tipo de pelo (recargo propio por especie) ---
  if (pet.coatType) {
    const mod = await db.serviceCoatModifier.findUnique({
      where: {
        serviceId_species_coatType: { serviceId, species: pet.species, coatType: pet.coatType },
      },
    });
    const amount = mod ? Number(mod.amount) : 0;
    if (amount !== 0) lines.push({ label: COAT_LABEL[pet.coatType], amount });
  }

  // --- Factor 3: condiciones de piel (regla global) ---
  if (pet.skinConditions.length > 0) {
    const rules = await db.skinConditionRule.findMany({
      where: { type: { in: pet.skinConditions.map((c) => c.type) } },
    });
    const ruleByType = new Map(rules.map((r) => [r.type, r]));

    for (const condition of pet.skinConditions) {
      const rule = ruleByType.get(condition.type);
      if (!rule) continue;
      if (rule.blocksBooking) {
        blockingConditions.push(rule.label);
        continue;
      }
      const amount = Number(rule.amount);
      if (amount !== 0) lines.push({ label: rule.label, amount });
    }
  }

  // --- Factor 4: comportamiento (regla global; 'agresivo' bloquea por defecto) ---
  if (pet.behavior) {
    const rule = await db.behaviorRule.findUnique({ where: { behavior: pet.behavior } });
    if (rule) {
      if (rule.blocksBooking) {
        blockingConditions.push(`Comportamiento: ${rule.label.toLowerCase()}`);
      } else {
        const amount = Number(rule.amount);
        if (amount !== 0) lines.push({ label: `Comportamiento: ${rule.label.toLowerCase()}`, amount });
      }
    }
  }

  const total = lines.reduce((sum, l) => sum + l.amount, base);

  return {
    serviceId,
    serviceName: service.name,
    petId,
    petName: pet.name,
    base,
    lines,
    total,
    blocked: blockingConditions.length > 0,
    blockingConditions,
  };
}

// ¿Qué? Configuración completa del tarifario, para la pantalla de administración (RF-014).
export async function getPricingConfig() {
  const [sizeTiers, skinRules, behaviorRules, services] = await Promise.all([
    db.sizeTier.findMany(),
    db.skinConditionRule.findMany(),
    db.behaviorRule.findMany(),
    db.service.findMany({
      orderBy: { name: 'asc' },
      include: { sizeModifiers: true, coatModifiers: true },
    }),
  ]);

  return {
    sizeTiers: sortSizeTiers(sizeTiers).map((t) => ({
      species: t.species,
      size: t.size,
      label: t.label,
      maxWeight: t.maxWeight != null ? Number(t.maxWeight) : null,
    })),
    skinRules: skinRules.map((r) => ({
      type: r.type,
      label: r.label,
      amount: Number(r.amount),
      blocksBooking: r.blocksBooking,
    })),
    behaviorRules: BEHAVIOR_ORDER.map((behavior) => behaviorRules.find((r) => r.behavior === behavior))
      .filter((r): r is NonNullable<typeof r> => r != null)
      .map((r) => ({
        behavior: r.behavior,
        label: r.label,
        amount: Number(r.amount),
        blocksBooking: r.blocksBooking,
      })),
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      basePrice: Number(s.price),
      active: s.active,
      sizeModifiers: s.sizeModifiers.map((m) => ({
        species: m.species,
        size: m.size,
        amount: Number(m.amount),
      })),
      coatModifiers: s.coatModifiers.map((m) => ({
        species: m.species,
        coatType: m.coatType,
        amount: Number(m.amount),
      })),
    })),
  };
}

// ¿Qué? Versión pública y de solo lectura del tarifario, para la página "Cómo calculamos el precio".
export async function getPublicPricing() {
  const config = await getPricingConfig();
  return {
    sizeTiers: config.sizeTiers,
    skinSurcharges: config.skinRules.filter((r) => !r.blocksBooking),
    behaviorSurcharges: config.behaviorRules.filter((r) => !r.blocksBooking && r.amount !== 0),
    blockingConditions: [
      ...config.skinRules.filter((r) => r.blocksBooking).map((r) => r.label),
      ...config.behaviorRules.filter((r) => r.blocksBooking).map((r) => `comportamiento ${r.label.toLowerCase()}`),
    ],
    services: config.services
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        name: s.name,
        basePrice: s.basePrice,
        sizeModifiers: s.sizeModifiers,
        coatModifiers: s.coatModifiers,
      })),
  };
}

const SIZE_ORDER: Record<PetSize, number> = { pequeno: 0, mediano: 1, grande: 2, gigante: 3 };
const SPECIES_ORDER: Record<PetSpecies, number> = { canina: 0, felina: 1 };
const BEHAVIOR_ORDER = ['tranquilo', 'nervioso', 'agresivo'] as const;

function sortSizeTiers<T extends { species: PetSpecies; size: PetSize }>(tiers: T[]): T[] {
  return [...tiers].sort(
    (a, b) => SPECIES_ORDER[a.species] - SPECIES_ORDER[b.species] || SIZE_ORDER[a.size] - SIZE_ORDER[b.size],
  );
}

// ¿Qué? Guarda los tramos de tamaño de ambas especies (RF-014, solo admin).
export async function updateSizeTiers(data: UpdateSizeTiersInput): Promise<void> {
  await db.$transaction(
    data.tiers.map((t) =>
      db.sizeTier.upsert({
        where: { species_size: { species: t.species, size: t.size } },
        create: { species: t.species, size: t.size, label: t.label, maxWeight: t.maxWeight },
        update: { label: t.label, maxWeight: t.maxWeight },
      }),
    ),
  );
}

// ¿Qué? Guarda las reglas de condición de piel (RF-014, solo admin).
export async function updateSkinRules(data: UpdateSkinRulesInput): Promise<void> {
  await db.$transaction(
    data.rules.map((r) =>
      db.skinConditionRule.upsert({
        where: { type: r.type },
        create: { type: r.type, label: r.label, amount: r.amount, blocksBooking: r.blocksBooking },
        update: { label: r.label, amount: r.amount, blocksBooking: r.blocksBooking },
      }),
    ),
  );
}

// ¿Qué? Guarda las reglas de comportamiento (RF-014, solo admin).
export async function updateBehaviorRules(data: UpdateBehaviorRulesInput): Promise<void> {
  await db.$transaction(
    data.rules.map((r) =>
      db.behaviorRule.upsert({
        where: { behavior: r.behavior },
        create: { behavior: r.behavior, label: r.label, amount: r.amount, blocksBooking: r.blocksBooking },
        update: { label: r.label, amount: r.amount, blocksBooking: r.blocksBooking },
      }),
    ),
  );
}

// ¿Qué? Fija los modificadores de tamaño y pelo de un servicio, por especie (RF-014, solo admin).
// ¿Para qué? Enviar el conjunto completo: lo que no venga se borra, lo que venga se recrea.
export async function updateServiceModifiers(
  serviceId: string,
  data: UpdateServiceModifiersInput,
): Promise<void> {
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new NotFoundError('Servicio no encontrado.');

  await db.$transaction([
    db.serviceSizeModifier.deleteMany({ where: { serviceId } }),
    db.serviceCoatModifier.deleteMany({ where: { serviceId } }),
    ...data.sizeModifiers.map((m) =>
      db.serviceSizeModifier.create({
        data: { serviceId, species: m.species, size: m.size, amount: m.amount },
      }),
    ),
    ...data.coatModifiers.map((m) =>
      db.serviceCoatModifier.create({
        data: { serviceId, species: m.species, coatType: m.coatType, amount: m.amount },
      }),
    ),
  ]);
}
