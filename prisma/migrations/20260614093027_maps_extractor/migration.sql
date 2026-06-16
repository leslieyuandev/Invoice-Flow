/*
  Warnings:

  - You are about to drop the column `creativity` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `elegance` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `fontPair` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `pagesCount` on the `Proposal` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MapsJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "creativity",
DROP COLUMN "elegance",
DROP COLUMN "fontPair",
DROP COLUMN "pagesCount";

-- CreateTable
CREATE TABLE "MapsScrapeJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MapsJobStatus" NOT NULL DEFAULT 'PENDING',
    "searchQueries" JSONB NOT NULL,
    "coordinates" JSONB,
    "maxResults" INTEGER NOT NULL DEFAULT 50,
    "language" TEXT NOT NULL DEFAULT 'en',
    "proxyConfig" JSONB,
    "requestedCount" INTEGER NOT NULL DEFAULT 0,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapsScrapeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapsPlace" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "address" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "countryCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "website" TEXT,
    "claimedStatus" TEXT,
    "operatingHours" JSONB,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "openingStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapsPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MapsScrapeJob_userId_idx" ON "MapsScrapeJob"("userId");

-- CreateIndex
CREATE INDEX "MapsScrapeJob_userId_status_idx" ON "MapsScrapeJob"("userId", "status");

-- CreateIndex
CREATE INDEX "MapsPlace_jobId_idx" ON "MapsPlace"("jobId");

-- CreateIndex
CREATE INDEX "MapsPlace_userId_idx" ON "MapsPlace"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MapsPlace_jobId_placeId_key" ON "MapsPlace"("jobId", "placeId");

-- AddForeignKey
ALTER TABLE "MapsScrapeJob" ADD CONSTRAINT "MapsScrapeJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapsPlace" ADD CONSTRAINT "MapsPlace_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "MapsScrapeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapsPlace" ADD CONSTRAINT "MapsPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
