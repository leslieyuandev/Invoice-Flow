-- CreateTable CanvaProject
CREATE TABLE IF NOT EXISTS "CanvaProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Design',
    "format" TEXT NOT NULL DEFAULT 'custom',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "pages" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanvaProject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CanvaProject_userId_idx" ON "CanvaProject"("userId");
CREATE INDEX IF NOT EXISTS "CanvaProject_userId_deletedAt_idx" ON "CanvaProject"("userId", "deletedAt");

ALTER TABLE "CanvaProject" ADD CONSTRAINT "CanvaProject_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
