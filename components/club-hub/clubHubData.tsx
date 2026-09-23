"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DuelInboxItem } from "@/actions/duel/getInboxCount";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import type { ClubSnapshot } from "@/lib/club/upgrades";

export type ClubHubBoards = {
  missionBoard: EvaluateMissionsResult | null;
  dailyBoard: EvaluateMissionsResult | null;
  campaignSeason: CampaignSeasonView | null;
  duelInboxCount: number;
  duelInboxItems: DuelInboxItem[];
};

type ClubHubDataContextValue = {
  boards: ClubHubBoards;
  setBoards: (boards: ClubHubBoards) => void;
  openMissions: (tab: "daily" | "campaign") => void;
  onOpenNews: () => void;
  onNewsExpired: () => void;
  onBalances: (balances: { coins: number; xp: number }) => void;
  setClub: React.Dispatch<React.SetStateAction<ClubSnapshot>>;
};

const ClubHubDataContext = createContext<ClubHubDataContextValue | null>(null);

const EMPTY_BOARDS: ClubHubBoards = {
  missionBoard: null,
  dailyBoard: null,
  campaignSeason: null,
  duelInboxCount: 0,
  duelInboxItems: [],
};

export function ClubHubDataProvider({
  children,
  openMissions,
  onOpenNews,
  onNewsExpired,
  onBalances,
  setClub,
}: {
  children: ReactNode;
  openMissions: (tab: "daily" | "campaign") => void;
  onOpenNews: () => void;
  onNewsExpired: () => void;
  onBalances: (balances: { coins: number; xp: number }) => void;
  setClub: React.Dispatch<React.SetStateAction<ClubSnapshot>>;
}) {
  const [boards, setBoardsState] = useState<ClubHubBoards>(EMPTY_BOARDS);
  const setBoards = useCallback((next: ClubHubBoards) => {
    setBoardsState(next);
  }, []);

  const value = useMemo(
    () => ({
      boards,
      setBoards,
      openMissions,
      onOpenNews,
      onNewsExpired,
      onBalances,
      setClub,
    }),
    [
      boards,
      setBoards,
      openMissions,
      onOpenNews,
      onNewsExpired,
      onBalances,
      setClub,
    ],
  );

  return (
    <ClubHubDataContext.Provider value={value}>
      {children}
    </ClubHubDataContext.Provider>
  );
}

export function useClubHubData(): ClubHubDataContextValue {
  const ctx = useContext(ClubHubDataContext);
  if (!ctx) {
    throw new Error("useClubHubData must be used within ClubHubDataProvider");
  }
  return ctx;
}

/** Optional — secondary panels only. */
export function useClubHubDataOptional(): ClubHubDataContextValue | null {
  return useContext(ClubHubDataContext);
}

/** Publish streamed boards into the hub header badge + drawers. */
export function usePublishClubHubBoards(boards: ClubHubBoards) {
  const ctx = useClubHubDataOptional();
  const setBoards = ctx?.setBoards;
  useEffect(() => {
    setBoards?.(boards);
  }, [setBoards, boards]);
}
