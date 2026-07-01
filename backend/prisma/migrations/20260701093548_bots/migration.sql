-- CreateEnum
CREATE TYPE "BotDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "botDifficulty" "BotDifficulty",
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_isBot_idx" ON "users"("isBot");
