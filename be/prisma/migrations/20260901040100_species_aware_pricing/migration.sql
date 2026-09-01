-- ¿Qué? Hace el tarifario del grooming consciente de la especie (RF-014):
--   - tramos de tamaño con pesos propios por especie (un gato de 6 kg no es un perro de 6 kg)
--   - recargos por tamaño y por pelo diferenciados perro/gato
--   - comportamiento de la mascota como nuevo factor de precio (con posible bloqueo de cita)

-- ── Pet: comportamiento ──
ALTER TABLE "pets" ADD COLUMN "behavior" "PetBehavior";

-- ── size_tiers: pasa de PK (size) a PK (species, size) ──
-- Las 4 filas existentes son de perro → se les asigna 'canina'.
ALTER TABLE "size_tiers" ADD COLUMN "species" "PetSpecies" NOT NULL DEFAULT 'canina';
ALTER TABLE "size_tiers" ALTER COLUMN "species" DROP DEFAULT;
ALTER TABLE "size_tiers" DROP CONSTRAINT "size_tiers_pkey";
ALTER TABLE "size_tiers" ADD CONSTRAINT "size_tiers_pkey" PRIMARY KEY ("species", "size");

-- Tramos de gato (valores de ejemplo — el admin los ajusta).
INSERT INTO "size_tiers" ("species", "size", "label", "max_weight") VALUES
  ('felina', 'pequeno', 'Pequeño', 3.50),
  ('felina', 'mediano', 'Mediano', 5.00),
  ('felina', 'grande',  'Grande',  7.00),
  ('felina', 'gigante', 'Gigante', NULL);

-- ── service_size_modifiers / service_coat_modifiers: agregan 'species' ──
-- (ambas tablas están vacías; el DEFAULT solo cubre el caso de que hubiera filas)
ALTER TABLE "service_size_modifiers" ADD COLUMN "species" "PetSpecies" NOT NULL DEFAULT 'canina';
ALTER TABLE "service_size_modifiers" ALTER COLUMN "species" DROP DEFAULT;
DROP INDEX "service_size_modifiers_service_id_size_key";
CREATE UNIQUE INDEX "service_size_modifiers_service_id_species_size_key"
  ON "service_size_modifiers"("service_id", "species", "size");

ALTER TABLE "service_coat_modifiers" ADD COLUMN "species" "PetSpecies" NOT NULL DEFAULT 'canina';
ALTER TABLE "service_coat_modifiers" ALTER COLUMN "species" DROP DEFAULT;
DROP INDEX "service_coat_modifiers_service_id_coat_type_key";
CREATE UNIQUE INDEX "service_coat_modifiers_service_id_species_coat_type_key"
  ON "service_coat_modifiers"("service_id", "species", "coat_type");

-- ── behavior_rules: una fila por nivel de comportamiento ──
CREATE TABLE "behavior_rules" (
    "behavior" "PetBehavior" NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "blocks_booking" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "behavior_rules_pkey" PRIMARY KEY ("behavior")
);

INSERT INTO "behavior_rules" ("behavior", "label", "amount", "blocks_booking") VALUES
  ('tranquilo', 'Tranquilo',  0.00, false),
  ('nervioso',  'Nervioso', 15000.00, false),
  ('agresivo',  'Agresivo',    0.00, true);

-- ── skin_condition_rules: regla para la nueva etiqueta 'nudos' ──
INSERT INTO "skin_condition_rules" ("type", "label", "amount", "blocks_booking") VALUES
  ('nudos', 'Nudos / pelo enredado', 20000.00, false);
