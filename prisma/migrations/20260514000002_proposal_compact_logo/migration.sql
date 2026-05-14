-- User: proposal-specific logo and default terms
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proposalLogoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proposalDefaultTerms" TEXT;

-- Proposal: compact layout flag
ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "compact" BOOLEAN NOT NULL DEFAULT FALSE;
