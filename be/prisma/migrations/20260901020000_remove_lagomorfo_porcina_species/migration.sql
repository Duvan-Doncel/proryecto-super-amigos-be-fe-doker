-- AlterEnum
-- ¿Qué? Reduce el enum PetSpecies a ('canina', 'felina') — el negocio solo atiende
--   perros y gatos, así que se quitan 'lagomorfo' y 'porcina'.
-- ¿Impacto? Postgres no permite borrar valores de un enum en uso: se crea el tipo nuevo,
--   se migra la columna y se elimina el viejo. Falla si alguna fila de "pets" todavía
--   usa uno de los valores removidos.
BEGIN;
CREATE TYPE "PetSpecies_new" AS ENUM ('canina', 'felina');
ALTER TABLE "pets" ALTER COLUMN "species" TYPE "PetSpecies_new" USING ("species"::text::"PetSpecies_new");
ALTER TYPE "PetSpecies" RENAME TO "PetSpecies_old";
ALTER TYPE "PetSpecies_new" RENAME TO "PetSpecies";
DROP TYPE "public"."PetSpecies_old";
COMMIT;
