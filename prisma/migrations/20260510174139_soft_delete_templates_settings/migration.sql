/*
  Warnings:

  - The `defaultPaymentTerms` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "currency" SET DEFAULT 'MYR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultNotes" TEXT,
ADD COLUMN     "defaultTerms" TEXT,
ALTER COLUMN "defaultCurrency" SET DEFAULT 'MYR',
DROP COLUMN "defaultPaymentTerms",
ADD COLUMN     "defaultPaymentTerms" INTEGER DEFAULT 30;

-- CreateTable
CREATE TABLE "LineItemTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineItemTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LineItemTemplate_userId_idx" ON "LineItemTemplate"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_deletedAt_idx" ON "Client"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Invoice_userId_deletedAt_idx" ON "Invoice"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "LineItemTemplate" ADD CONSTRAINT "LineItemTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
