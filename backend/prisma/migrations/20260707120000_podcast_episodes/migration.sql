-- CreateTable
CREATE TABLE "podcast_episodes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/wav',
    "byteSize" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "scriptText" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "externalId" TEXT,
    "sourceMeta" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "podcast_episodes_publishedAt_idx" ON "podcast_episodes"("publishedAt");
