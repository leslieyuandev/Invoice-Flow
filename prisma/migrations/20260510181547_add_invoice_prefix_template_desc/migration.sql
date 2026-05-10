-- AlterTable
ALTER TABLE "LineItemTemplate" ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invoiceNumberPrefix" TEXT NOT NULL DEFAULT 'INV';
