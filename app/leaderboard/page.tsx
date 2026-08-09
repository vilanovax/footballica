import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/actions/getLeaderboard";
import { getHallOfFame } from "@/actions/getHallOfFame";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { RouteLoading } from "@/components/ui/RouteLoading";
import { getCurrentUser } from "@/lib/player/current";

// Standings + dev seeding read/write the DB — never prerender.
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.club) redirect("/onboarding");

  return (
    <Suspense fallback={<RouteLoading label="Leaderboard" />}>
      <LeaderboardLoader />
    </Suspense>
  );
}

async function LeaderboardLoader() {
  const [board, hallOfFame] = await Promise.all([
    getLeaderboard(),
    getHallOfFame(),
  ]);

  return (
    <LeaderboardList
      rows={board.rows}
      resetsInDays={board.resetsInDays}
      hallOfFame={hallOfFame}
      currentUserRow={board.currentUserRow}
    />
  );
}
