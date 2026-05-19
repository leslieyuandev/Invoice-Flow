ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ssmNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "senderSsmNumber" TEXT;

-- Mark INV-2026-8805 as SENT
UPDATE "Invoice"
SET "status" = 'SENT', "sentAt" = NOW()
WHERE "invoiceNumber" = 'INV-2026-8805' AND "status" = 'DRAFT';
