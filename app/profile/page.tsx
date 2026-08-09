import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PlayerProfile } from "@/components/profile/PlayerProfile";
import { RouteLoading } from "@/components/ui/RouteLoading";
import { getCurrentUser, getProfileSnapshot } from "@/lib/player/current";
import { getMyMissions } from "@/actions/missions";
import { listBadgePresentations } from "@/lib/game/badgeCatalog";

// Reads live user XP + club stats + unlocked badges — never prerender.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.club) redirect("/onboarding");

  return (
    <Suspense fallback={<RouteLoading label="Profile" />}>
      <ProfileLoader />
    </Suspense>
  );
}

async function ProfileLoader() {
  // Profile / missions / badge catalog are independent after auth.
  const [profile, missions, badgeCatalog] = await Promise.all([
    getProfileSnapshot(),
    getMyMissions(),
    listBadgePresentations(),
  ]);
  if (!profile) redirect("/onboarding");

  const missionBoard = missions.ok ? missions.board : null;
  const dailyBoard = missions.ok ? missions.daily : null;

  return (
    <PlayerProfile
      profile={profile}
      missionBoard={missionBoard}
      dailyBoard={dailyBoard}
      badgeCatalog={badgeCatalog}
    />
  );
}
