-- AlterTable
ALTER TABLE "CategoryRecord" ADD COLUMN "maxPenaltyGoals" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CategoryRecord" ADD COLUMN "perfectPenaltyCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CategoryRecord_categoryId_maxPenaltyGoals_idx" ON "CategoryRecord"("categoryId", "maxPenaltyGoals");
