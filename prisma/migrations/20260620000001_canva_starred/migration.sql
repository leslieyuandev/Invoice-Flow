-- AlterTable: add starred column to CanvaProject
ALTER TABLE "CanvaProject" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;
