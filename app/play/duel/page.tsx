import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getClubSnapshot, getCurrentUser } from "@/lib/player/current";
import { getMyDuels } from "@/actions/duel/getMyDuels";
import { DuelLobby } from "@/components/duel/DuelLobby";
import { RouteLoading } from "@/components/ui/RouteLoading";

export const dynamic = "force-dynamic";

export default async function DuelLobbyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // user.club already on the cached auth row — no extra hasClub() hop.
  if (!user.club) redirect("/onboarding");

  return (
    <Suspense fallback={<RouteLoading label="Duel" />}>
      <DuelLobbyLoader />
    </Suspense>
  );
}

async function DuelLobbyLoader() {
  const [res, club] = await Promise.all([getMyDuels(), getClubSnapshot()]);
  if (!res.ok) redirect("/login");

  return (
    <DuelLobby
      initialDuels={res.duels}
      initialYourTurn={res.yourTurn}
      initialHistory={res.history}
      yourAvatar={club?.avatar}
    />
  );
}
