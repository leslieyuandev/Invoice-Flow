-- Revert INV-2026-8805 from PAID back to SENT
UPDATE "Invoice"
SET "status" = 'SENT', "paidAt" = NULL
WHERE "invoiceNumber" = 'INV-2026-8805';
