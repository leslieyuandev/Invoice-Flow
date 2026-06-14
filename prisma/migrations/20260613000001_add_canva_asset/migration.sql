-- CreateTable CanvaAsset
CREATE TABLE IF NOT EXISTS "CanvaAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "meta" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanvaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CanvaAsset_userId_type_idx" ON "CanvaAsset"("userId", "type");

ALTER TABLE "CanvaAsset" ADD CONSTRAINT "CanvaAsset_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
