-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogPackage" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "imageUrl" TEXT,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogPackageFeature" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogPackageFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogAddOn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER,
    "priceLabel" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadName" TEXT NOT NULL,
    "leadEmail" TEXT,
    "leadPhone" TEXT,
    "clientId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT,
    "senderLogoUrl" TEXT,
    "senderPhone" TEXT,
    "eventTitle" TEXT NOT NULL,
    "eventCategoryId" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "termsText" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "packageName" TEXT NOT NULL,
    "tagline" TEXT,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER,
    "imageUrl" TEXT,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "features" TEXT NOT NULL,

    CONSTRAINT "ProposalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalAddOnItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addOnName" TEXT NOT NULL,
    "price" INTEGER,
    "priceLabel" TEXT,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProposalAddOnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_slug_key" ON "EventCategory"("slug");

-- CreateIndex
CREATE INDEX "EventCategory_parentId_idx" ON "EventCategory"("parentId");

-- CreateIndex
CREATE INDEX "CatalogPackage_categoryId_idx" ON "CatalogPackage"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogPackageFeature_packageId_sortOrder_idx" ON "CatalogPackageFeature"("packageId", "sortOrder");

-- CreateIndex
CREATE INDEX "Proposal_userId_idx" ON "Proposal"("userId");

-- CreateIndex
CREATE INDEX "Proposal_userId_status_idx" ON "Proposal"("userId", "status");

-- CreateIndex
CREATE INDEX "Proposal_userId_deletedAt_idx" ON "Proposal"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ProposalItem_proposalId_sortOrder_idx" ON "ProposalItem"("proposalId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProposalAddOnItem_proposalId_sortOrder_idx" ON "ProposalAddOnItem"("proposalId", "sortOrder");

-- AddForeignKey
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPackage" ADD CONSTRAINT "CatalogPackage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPackageFeature" ADD CONSTRAINT "CatalogPackageFeature_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CatalogPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalAddOnItem" ADD CONSTRAINT "ProposalAddOnItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
