-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "clientEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LineItem" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showDueDate" BOOLEAN NOT NULL DEFAULT true;
