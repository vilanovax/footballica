-- Leaderboard hot path: filter humans + order/take by weeklyXp
CREATE INDEX "User_isBot_weeklyXp_idx" ON "User"("isBot", "weeklyXp");
