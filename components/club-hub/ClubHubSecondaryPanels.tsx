"use client";

import { useMemo } from "react";
import type { DuelInboxItem } from "@/actions/duel/getInboxCount";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import type { ActiveNewsBoosterSnapshot } from "@/lib/club/upgrades";
import { HubTodayRail } from "@/components/club-hub/HubTodayRail";
import { HubDailyMissions } from "@/components/club-hub/HubDailyMissions";
import { DuelInboxBanner } from "@/components/duel/DuelInboxBanner";
import {
  useClubHubData,
  usePublishClubHubBoards,
} from "@/components/club-hub/clubHubData";

type ClubHubSecondaryPanelsProps = {
  duelInboxCount: number;
  duelInboxItems: DuelInboxItem[];
  missionBoard: EvaluateMissionsResult | null;
  dailyBoard: EvaluateMissionsResult | null;
  campaignSeason: CampaignSeasonView | null;
  mysteryStreak: number;
  activeNews: ActiveNewsBoosterSnapshot | null;
};

/**
 * Client rails for streamed Club secondary data. Publishes boards into
 * ClubHub context so the header mission badge + MissionDrawer stay in sync.
 *
 * Order: play urgency (duel) → daily progress → discovery rail.
 * MatchDoor (Penalty) sits above this stack in ClubHub.
 */
export function ClubHubSecondaryPanels({
  duelInboxCount,
  duelInboxItems,
  missionBoard,
  dailyBoard,
  campaignSeason,
  mysteryStreak,
  activeNews,
}: ClubHubSecondaryPanelsProps) {
  // lastMatch stays on the critical MatchDoor path — not streamed here.
  const {
    openMissions,
    onOpenNews,
    onNewsExpired,
    onBalances,
  } = useClubHubData();

  const boards = useMemo(
    () => ({
      missionBoard,
      dailyBoard,
      campaignSeason,
      duelInboxCount,
      duelInboxItems,
    }),
    [
      missionBoard,
      dailyBoard,
      campaignSeason,
      duelInboxCount,
      duelInboxItems,
    ],
  );
  usePublishClubHubBoards(boards);

  return (
    <div className="flex flex-col gap-2">
      <DuelInboxBanner
        count={duelInboxCount}
        items={duelInboxItems}
        variant="club"
      />

      <HubDailyMissions
        board={dailyBoard}
        onOpen={() => openMissions("daily")}
        onBalances={onBalances}
      />

      <HubTodayRail
        mysteryStreak={mysteryStreak}
        campaignSeason={campaignSeason}
        activeNews={activeNews}
        onOpenCampaign={() => openMissions("campaign")}
        onOpenNews={onOpenNews}
        onNewsExpired={onNewsExpired}
      />
    </div>
  );
}
