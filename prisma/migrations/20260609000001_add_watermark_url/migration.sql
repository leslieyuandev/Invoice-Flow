-- AlterTable User: add watermarkUrl column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "watermarkUrl" TEXT;
