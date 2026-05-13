-- AlterTable: add style/layout settings to Proposal
ALTER TABLE "Proposal"
  ADD COLUMN "pagesCount"    INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "addOnsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "creativity"    INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN "elegance"      INTEGER NOT NULL DEFAULT 50;
