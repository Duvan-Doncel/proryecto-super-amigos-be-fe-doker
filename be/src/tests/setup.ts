/**
 * Archivo: tests/setup.ts
 * Descripción: Configuración global ejecutada antes de todos los tests del backend.
 * ¿Para qué? Inicializar y limpiar la BD de tests, asegurar entorno aislado.
 * ¿Impacto? Sin una BD de tests aislada, los tests afectarían datos reales.
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../db/index.js';

// ¿Qué? Limpia todas las tablas antes de cada test, en un orden que respeta las FKs.
// ¿Para qué? Garantizar que cada test parte de un estado limpio y predecible.
// ¿Impacto? Las tablas hijas se borran antes que sus padres — en particular `sales`
//   no tiene cascada hacia `users` (una venta no debe desaparecer si se borra el
//   usuario que la registró), así que debe limpiarse explícitamente antes.
beforeEach(async () => {
  await db.saleItem.deleteMany();
  await db.sale.deleteMany();
  await db.supplierOrderItem.deleteMany();
  await db.supplierOrder.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.symptomReport.deleteMany();
  await db.appointment.deleteMany();
  await db.pet.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.emailVerificationToken.deleteMany();
  await db.user.deleteMany();
  await db.product.deleteMany();
  await db.service.deleteMany();
  await db.supplier.deleteMany();
  await db.setting.deleteMany();

  // ¿Qué? Restaura el tarifario de referencia (tramos de tamaño y reglas de piel) a los
  //   valores sembrados en la migración. No se borra entre tests, pero algún test lo edita
  //   (RF-014) — sin este reset, ese cambio se filtraría al resto del suite.
  await resetPricingReferenceData();
});

async function resetPricingReferenceData(): Promise<void> {
  const tiers = [
    { species: 'canina' as const, size: 'pequeno' as const, label: 'Pequeño', maxWeight: 10 },
    { species: 'canina' as const, size: 'mediano' as const, label: 'Mediano', maxWeight: 25 },
    { species: 'canina' as const, size: 'grande' as const, label: 'Grande', maxWeight: 45 },
    { species: 'canina' as const, size: 'gigante' as const, label: 'Gigante', maxWeight: null },
    { species: 'felina' as const, size: 'pequeno' as const, label: 'Pequeño', maxWeight: 3.5 },
    { species: 'felina' as const, size: 'mediano' as const, label: 'Mediano', maxWeight: 5 },
    { species: 'felina' as const, size: 'grande' as const, label: 'Grande', maxWeight: 7 },
    { species: 'felina' as const, size: 'gigante' as const, label: 'Gigante', maxWeight: null },
  ];
  const skinRules = [
    { type: 'pulgas' as const, label: 'Pulgas', amount: 18000, blocksBooking: false },
    { type: 'garrapatas' as const, label: 'Garrapatas', amount: 18000, blocksBooking: false },
    { type: 'piel_irritada' as const, label: 'Piel irritada', amount: 12000, blocksBooking: false },
    { type: 'alergia' as const, label: 'Alergia conocida', amount: 10000, blocksBooking: false },
    { type: 'piel_sensible' as const, label: 'Piel sensible', amount: 8000, blocksBooking: false },
    { type: 'nudos' as const, label: 'Nudos / pelo enredado', amount: 20000, blocksBooking: false },
    { type: 'hongos' as const, label: 'Hongos', amount: 0, blocksBooking: true },
    { type: 'sarna' as const, label: 'Sarna', amount: 0, blocksBooking: true },
    { type: 'heridas' as const, label: 'Heridas abiertas', amount: 0, blocksBooking: true },
    { type: 'infeccion' as const, label: 'Infección visible', amount: 0, blocksBooking: true },
  ];
  const behaviorRules = [
    { behavior: 'tranquilo' as const, label: 'Tranquilo', amount: 0, blocksBooking: false },
    { behavior: 'nervioso' as const, label: 'Nervioso', amount: 15000, blocksBooking: false },
    { behavior: 'agresivo' as const, label: 'Agresivo', amount: 0, blocksBooking: true },
  ];

  await db.$transaction([
    ...tiers.map((t) =>
      db.sizeTier.upsert({
        where: { species_size: { species: t.species, size: t.size } },
        create: t,
        update: t,
      }),
    ),
    ...skinRules.map((r) =>
      db.skinConditionRule.upsert({ where: { type: r.type }, create: r, update: r }),
    ),
    ...behaviorRules.map((r) =>
      db.behaviorRule.upsert({ where: { behavior: r.behavior }, create: r, update: r }),
    ),
  ]);
}

// ¿Qué? Verificar que la conexión a la BD de tests está disponible antes de empezar.
beforeAll(async () => {
  // La BD de tests se establece via DATABASE_URL en el entorno de test.
  // Asegurarse de que .env.test o la variable de entorno apunte a una BD de pruebas.
  console.log('🧪 Setup: BD de tests conectada');
});

afterAll(async () => {
  console.log('🧪 Teardown: tests completados');
});
