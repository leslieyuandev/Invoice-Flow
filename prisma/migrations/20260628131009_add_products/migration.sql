-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "vendorName" TEXT,
    "manufacturer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "salesStartDate" TIMESTAMP(3),
    "salesEndDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "costPrice" INTEGER,
    "listPrice" INTEGER NOT NULL,
    "taxRate" DECIMAL(5,2),
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "unit" TEXT,
    "quantityInStock" DECIMAL(12,3),
    "reorderLevel" DECIMAL(12,3),
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE INDEX "Product_userId_deletedAt_idx" ON "Product"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_userId_isActive_idx" ON "Product"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
