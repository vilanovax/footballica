-- AlterTable
ALTER TABLE "users" ADD COLUMN     "streakCurrent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streakLastDay" TEXT,
ADD COLUMN     "streakLongest" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_key_key" ON "user_achievements"("userId", "key");

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
