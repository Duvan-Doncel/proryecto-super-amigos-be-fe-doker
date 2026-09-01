-- CreateEnum
CREATE TYPE "PetSize" AS ENUM ('pequeno', 'mediano', 'grande', 'gigante');

-- CreateEnum
CREATE TYPE "CoatType" AS ENUM ('corto', 'largo');

-- CreateEnum
CREATE TYPE "SkinConditionType" AS ENUM ('pulgas', 'garrapatas', 'piel_irritada', 'alergia', 'piel_sensible', 'hongos', 'sarna', 'heridas', 'infeccion');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "price_breakdown" JSONB,
ADD COLUMN     "total_price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "coat_type" "CoatType",
ADD COLUMN     "size" "PetSize";

-- CreateTable
CREATE TABLE "pet_skin_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pet_id" UUID NOT NULL,
    "type" "SkinConditionType" NOT NULL,
    "note" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_skin_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_size_modifiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "size" "PetSize" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "service_size_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_coat_modifiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "coat_type" "CoatType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "service_coat_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_condition_rules" (
    "type" "SkinConditionType" NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "blocks_booking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "skin_condition_rules_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "size_tiers" (
    "size" "PetSize" NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "max_weight" DECIMAL(5,2),

    CONSTRAINT "size_tiers_pkey" PRIMARY KEY ("size")
);

-- CreateIndex
CREATE UNIQUE INDEX "pet_skin_conditions_pet_id_type_key" ON "pet_skin_conditions"("pet_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "service_size_modifiers_service_id_size_key" ON "service_size_modifiers"("service_id", "size");

-- CreateIndex
CREATE UNIQUE INDEX "service_coat_modifiers_service_id_coat_type_key" ON "service_coat_modifiers"("service_id", "coat_type");

-- AddForeignKey
ALTER TABLE "pet_skin_conditions" ADD CONSTRAINT "pet_skin_conditions_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_size_modifiers" ADD CONSTRAINT "service_size_modifiers_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_coat_modifiers" ADD CONSTRAINT "service_coat_modifiers_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: tramos de tamaño (kg máximo de cada tramo). Valores de ejemplo — el admin los ajusta.
INSERT INTO "size_tiers" ("size", "label", "max_weight") VALUES
  ('pequeno', 'Pequeño', 10.00),
  ('mediano', 'Mediano', 25.00),
  ('grande',  'Grande',  45.00),
  ('gigante', 'Gigante', NULL);

-- Seed: reglas por condición de piel. Las primeras 5 recargan; las últimas 4 bloquean la cita.
-- Montos de ejemplo — el admin los ajusta desde la pantalla de tarifario.
INSERT INTO "skin_condition_rules" ("type", "label", "amount", "blocks_booking") VALUES
  ('pulgas',        'Pulgas',            18000.00, false),
  ('garrapatas',    'Garrapatas',        18000.00, false),
  ('piel_irritada', 'Piel irritada',     12000.00, false),
  ('alergia',       'Alergia conocida',  10000.00, false),
  ('piel_sensible', 'Piel sensible',      8000.00, false),
  ('hongos',        'Hongos',                0.00, true),
  ('sarna',         'Sarna',                 0.00, true),
  ('heridas',       'Heridas abiertas',      0.00, true),
  ('infeccion',     'Infección visible',     0.00, true);

