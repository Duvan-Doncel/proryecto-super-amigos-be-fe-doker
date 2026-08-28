-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "color" VARCHAR(50),
ADD COLUMN     "pathology" VARCHAR(300) NOT NULL DEFAULT 'No aplica',
ADD COLUMN     "weight" DECIMAL(5,2);
