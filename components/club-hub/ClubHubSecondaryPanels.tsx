"use client";

import { useMemo } from "react";
import type { DuelInboxItem } from "@/actions/duel/getInboxCount";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import type { ActiveNewsBoosterSnapshot } from "@/lib/club/upgrades";
import { ActiveNewsChip } from "@/components/club-hub/ActiveNewsChip";
import { HubMissionReadyNudge } from "@/components/club-hub/HubMissionReadyNudge";
import { DuelInboxBanner } from "@/components/duel/DuelInboxBanner";
import { hasMissionRewardReady } from "@/lib/game/missionRewards";
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
  activeNews: ActiveNewsBoosterSnapshot | null;
};

/**
 * Client rails for streamed Club secondary data. Publishes boards into
 * ClubHub context so the header mission badge + MissionDrawer stay in sync.
 *
 * Order: play urgency (duel) → claim-ready mission nudge → active news.
 * Full daily list lives in MissionDrawer (header icon), not inline.
 * MatchDoor (Penalty) sits above this stack in ClubHub.
 */
export function ClubHubSecondaryPanels({
  duelInboxCount,
  duelInboxItems,
  missionBoard,
  dailyBoard,
  campaignSeason,
  activeNews,
}: ClubHubSecondaryPanelsProps) {
  const { openMissions, onOpenNews, onNewsExpired } = useClubHubData();

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

      <HubMissionReadyNudge
        dailyBoard={dailyBoard}
        campaignBoard={missionBoard}
        onOpen={() => {
          const dailyReady = hasMissionRewardReady(dailyBoard, null);
          openMissions(dailyReady ? "daily" : "campaign");
        }}
      />

      {activeNews ? (
        <ActiveNewsChip
          key={activeNews.expiresAt}
          booster={activeNews}
          onOpen={onOpenNews}
          onExpired={onNewsExpired}
          compact
        />
      ) : null}
    </div>
  );
}
