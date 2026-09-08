import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/actions/getLeaderboard";
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
  // Hall of Fame loads on tab switch (client) — keep weekly path lean.
  const board = await getLeaderboard();

  return (
    <LeaderboardList
      rows={board.rows}
      resetsInDays={board.resetsInDays}
      currentUserRow={board.currentUserRow}
    />
  );
}
