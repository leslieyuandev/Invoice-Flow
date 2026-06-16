-- AlterTable
ALTER TABLE "MapsPlace" ADD COLUMN     "description" TEXT,
ADD COLUMN     "emails" JSONB,
ADD COLUMN     "imageUrls" JSONB,
ADD COLUMN     "isClaimed" BOOLEAN,
ADD COLUMN     "isLikelyNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newnessSignals" JSONB,
ADD COLUMN     "plusCode" TEXT,
ADD COLUMN     "priceLevel" TEXT,
ADD COLUMN     "reviews" JSONB,
ADD COLUMN     "socialProfiles" JSONB;

-- AlterTable
ALTER TABLE "MapsScrapeJob" ADD COLUMN     "config" JSONB;

-- CreateIndex
CREATE INDEX "MapsPlace_jobId_isLikelyNew_idx" ON "MapsPlace"("jobId", "isLikelyNew");
