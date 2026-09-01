-- ¿Qué? Solo los cambios de enum, en su propia migración.
-- ¿Por qué aparte? Postgres no permite usar un valor de enum recién agregado en la misma
--   transacción que lo crea. La siguiente migración (species_aware_pricing) siembra filas
--   que usan 'nudos' y el enum PetBehavior, así que estos ADD deben quedar ya commiteados.

-- CreateEnum
CREATE TYPE "PetBehavior" AS ENUM ('tranquilo', 'nervioso', 'agresivo');

-- AlterEnum: nueva etiqueta de condición de piel para pelo muy enredado / con nudos.
ALTER TYPE "SkinConditionType" ADD VALUE 'nudos';
