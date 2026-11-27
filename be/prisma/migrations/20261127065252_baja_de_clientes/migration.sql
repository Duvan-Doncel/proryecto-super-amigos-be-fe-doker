-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deactivated_at" TIMESTAMP(3),
ADD COLUMN     "deactivation_reason" VARCHAR(300);
