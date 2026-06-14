-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(10,2),
    "discountAmount" INTEGER,
    "total" INTEGER NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT,
    "senderAddress" TEXT,
    "senderPhone" TEXT,
    "senderSsmNumber" TEXT,
    "senderLogoUrl" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientAddress" TEXT,
    "clientCompany" TEXT,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationLineItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationLineItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable Invoice: add quotationId column
ALTER TABLE "Invoice" ADD COLUMN "quotationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_userId_quotationNumber_key" ON "Quotation"("userId", "quotationNumber");
CREATE INDEX "Quotation_userId_idx" ON "Quotation"("userId");
CREATE INDEX "Quotation_userId_status_idx" ON "Quotation"("userId", "status");
CREATE INDEX "Quotation_userId_deletedAt_idx" ON "Quotation"("userId", "deletedAt");
CREATE INDEX "Quotation_clientId_idx" ON "Quotation"("clientId");
CREATE INDEX "QuotationLineItem_quotationId_sortOrder_idx" ON "QuotationLineItem"("quotationId", "sortOrder");
CREATE UNIQUE INDEX "Invoice_quotationId_key" ON "Invoice"("quotationId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuotationLineItem" ADD CONSTRAINT "QuotationLineItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
