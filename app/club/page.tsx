import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ClubHub } from "@/components/club-hub/ClubHub";
import { ClubHubSecondary } from "@/components/club-hub/ClubHubSecondary";
import { ClubHubSkeleton } from "@/components/club-hub/ClubHubSkeleton";
import { HubSecondarySkeleton } from "@/components/club-hub/HubSecondarySkeleton";
import { getClubSnapshot, getCurrentUser } from "@/lib/player/current";
import { getGameConfig } from "@/lib/game/gameConfig";
import { getPlayModeEconomy } from "@/lib/play/modeEconomy";
import { getLastMatchLine } from "@/lib/club/lastMatch";

// Reads live club balances from the DB — never prerender.
export const dynamic = "force-dynamic";

/**
 * Auth + onboarding gate only. Critical hub (HUD + MatchDoor + stadium)
 * streams first; missions / today rail / duel inbox nest under Suspense.
 */
export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{ manage?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.club) redirect("/onboarding");

  const sp = await searchParams;
  const openManage = sp.manage === "1";

  return (
    <Suspense fallback={<ClubHubSkeleton />}>
      <ClubHubLoader openManage={openManage} />
    </Suspense>
  );
}

async function ClubHubLoader({ openManage }: { openManage: boolean }) {
  const user = await getCurrentUser();
  // Deep-link manage needs settled business; otherwise skip settle for TTFB.
  const [club, config, lastMatch] = await Promise.all([
    getClubSnapshot({ settleBusiness: openManage }),
    getGameConfig(),
    user?.club ? getLastMatchLine(user.club.id) : Promise.resolve(null),
  ]);
  if (!club) redirect("/onboarding");

  const penalty = getPlayModeEconomy(config).penalty;

  return (
    <ClubHub
      initialClub={club}
      staminaRefillCost={config.costs.staminaRefill}
      coinsPerWin={config.rewards.coinsPerWin}
      matchPreview={{
        questionCount: penalty.questionCount ?? 5,
        approxCoins: penalty.approxCoins,
        staminaCost: penalty.staminaCost,
      }}
      lastMatch={lastMatch}
      openManage={openManage}
      needsBusinessSettle={!openManage && club.tutorialStep === 2}
    >
      {club.tutorialStep === 2 ? (
        <Suspense key="hub-secondary" fallback={<HubSecondarySkeleton />}>
          <ClubHubSecondary
            mysteryStreak={club.mysteryStreak}
            activeNews={club.activeNewsBooster}
          />
        </Suspense>
      ) : null}
    </ClubHub>
  );
}
