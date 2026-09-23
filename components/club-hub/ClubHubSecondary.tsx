import { getDuelInbox } from "@/actions/duel/getInboxCount";
import { getMyMissions } from "@/actions/missions";
import { listRecordChallenges } from "@/actions/challenge/recordChallenge";
import { buildCampaignSeasonView } from "@/lib/game/campaignSeason";
import type { ActiveNewsBoosterSnapshot } from "@/lib/club/upgrades";
import { ClubHubSecondaryPanels } from "@/components/club-hub/ClubHubSecondaryPanels";

type ClubHubSecondaryProps = {
  mysteryStreak: number;
  activeNews: ActiveNewsBoosterSnapshot | null;
};

/**
 * Deferred hub rails — streamed under Suspense so MatchDoor + HUD paint first.
 * Skips duel-mission backfill (drawer syncs on open).
 */
export async function ClubHubSecondary({
  mysteryStreak,
  activeNews,
}: ClubHubSecondaryProps) {
  const [inbox, missions, challenges] = await Promise.all([
    getDuelInbox(),
    getMyMissions({ skipDuelSync: true }),
    listRecordChallenges(),
  ]);

  const missionBoard = missions.ok ? missions.board : null;
  const dailyBoard = missions.ok ? missions.daily : null;
  const campaignSeason = buildCampaignSeasonView({
    board: missionBoard,
    chapters: challenges.ok
      ? challenges.challenges.map((c) => ({
          id: c.id,
          slug: c.slug,
          titleEn: c.titleEn,
          titleFa: c.titleFa,
          rewardBadgeEmoji: c.rewardBadgeEmoji,
          targetScore: c.targetScore,
          unlocked: c.unlocked,
          conquered: c.conquered,
          bestScore: c.bestScore,
        }))
      : [],
  });

  return (
    <ClubHubSecondaryPanels
      duelInboxCount={inbox.ok ? inbox.count : 0}
      duelInboxItems={inbox.ok ? inbox.items : []}
      missionBoard={missionBoard}
      dailyBoard={dailyBoard}
      campaignSeason={campaignSeason}
      mysteryStreak={mysteryStreak}
      activeNews={activeNews}
    />
  );
}
