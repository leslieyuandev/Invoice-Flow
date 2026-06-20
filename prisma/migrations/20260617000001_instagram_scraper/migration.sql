-- CreateEnum
CREATE TYPE "InstagramJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "InstagramScrapeJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "InstagramJobStatus" NOT NULL DEFAULT 'PENDING',
    "hashtags" JSONB NOT NULL,
    "searchByKeyword" BOOLEAN NOT NULL DEFAULT false,
    "resultsType" TEXT NOT NULL DEFAULT 'posts',
    "maxResults" INTEGER NOT NULL DEFAULT 20,
    "provider" TEXT NOT NULL DEFAULT 'apify',
    "config" JSONB,
    "requestedCount" INTEGER NOT NULL DEFAULT 0,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramScrapeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashtag" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "type" TEXT,
    "caption" TEXT,
    "ownerFullName" TEXT,
    "ownerUsername" TEXT,
    "ownerId" TEXT,
    "likesCount" INTEGER,
    "commentsCount" INTEGER,
    "videoViewCount" INTEGER,
    "videoPlayCount" INTEGER,
    "sharesCount" INTEGER,
    "firstComment" TEXT,
    "locationName" TEXT,
    "locationId" TEXT,
    "timestamp" TIMESTAMP(3),
    "displayUrl" TEXT,
    "images" JSONB,
    "hashtags" JSONB,
    "mentions" JSONB,
    "musicInfo" JSONB,
    "productType" TEXT,
    "isSponsored" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperProviderState" (
    "provider" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "freeCredits" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'results',
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetsAt" TIMESTAMP(3) NOT NULL,
    "limited" BOOLEAN NOT NULL DEFAULT false,
    "limitReason" TEXT,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScraperProviderState_pkey" PRIMARY KEY ("provider")
);

-- CreateIndex
CREATE INDEX "InstagramScrapeJob_userId_idx" ON "InstagramScrapeJob"("userId");

-- CreateIndex
CREATE INDEX "InstagramScrapeJob_userId_status_idx" ON "InstagramScrapeJob"("userId", "status");

-- CreateIndex
CREATE INDEX "InstagramPost_jobId_idx" ON "InstagramPost"("jobId");

-- CreateIndex
CREATE INDEX "InstagramPost_userId_idx" ON "InstagramPost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_jobId_shortCode_key" ON "InstagramPost"("jobId", "shortCode");

-- AddForeignKey
ALTER TABLE "InstagramScrapeJob" ADD CONSTRAINT "InstagramScrapeJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "InstagramScrapeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
