-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'WAITING';

-- CreateTable
CREATE TABLE "duel_questions" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "duel_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duel_rounds" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "optionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "msTaken" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "duel_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "duel_questions_matchId_order_key" ON "duel_questions"("matchId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "duel_rounds_matchId_userId_order_key" ON "duel_rounds"("matchId", "userId", "order");

-- AddForeignKey
ALTER TABLE "duel_questions" ADD CONSTRAINT "duel_questions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_questions" ADD CONSTRAINT "duel_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_rounds" ADD CONSTRAINT "duel_rounds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_rounds" ADD CONSTRAINT "duel_rounds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duel_rounds" ADD CONSTRAINT "duel_rounds_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
