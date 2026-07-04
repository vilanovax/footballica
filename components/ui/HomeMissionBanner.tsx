"use client";

import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import {
  buildMissionSnapshot,
  firstClaimableMission,
  rewardLabel,
} from "@/lib/missions";

interface HomeMissionBannerProps {
  onOpenMissions: () => void;
  seasonTitle: string;
  seasonFocus: string;
}

export function HomeMissionBanner({
  onOpenMissions,
  seasonTitle,
  seasonFocus,
}: HomeMissionBannerProps) {
  const gamesPlayed = useGame((s) => s.gamesPlayed);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const unitCollectCount = useGame((s) => s.unitCollectCount);
  const vaultFillCount = useGame((s) => s.vaultFillCount);
  const matchesWon = useGame((s) => s.matchesWon);
  const streakDays = useGame((s) => s.streakDays);
  const bombBest = useGame((s) => s.bombBest);
  const fans = useGame((s) => s.fans);
  const setupDone = useGame((s) => s.setupDone);
  const units = useGame((s) => s.units);
  const hired = useGame((s) => s.hired);
  const assign = useGame((s) => s.assign);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const dailyProgress = useGame((s) => s.dailyProgress);
  const dailyDate = useGame((s) => s.dailyDate);
  const missionClaimed = useGame((s) => s.missionClaimed);
  const claimMission = useGame((s) => s.claimMission);
  const claimableMissions = useGame((s) => s.claimableMissions);

  const [toast, setToast] = useState<string | null>(null);

  const snap = useMemo(
    () =>
      buildMissionSnapshot({
        gamesPlayed,
        totalCorrect,
        unitCollectCount,
        vaultFillCount,
        matchesWon,
        streakDays,
        bombBest,
        fans,
        setupDone,
        units,
        hired,
        assign,
        vaultLevel,
        dailyProgress,
        dailyDate,
        missionClaimed,
      }),
    [
      gamesPlayed,
      totalCorrect,
      unitCollectCount,
      vaultFillCount,
      matchesWon,
      streakDays,
      bombBest,
      fans,
      setupDone,
      units,
      hired,
      assign,
      vaultLevel,
      dailyProgress,
      dailyDate,
      missionClaimed,
    ],
  );

  const count = claimableMissions();
  const first = firstClaimableMission(snap);

  if (count <= 0) {
    return (
      <button
        type="button"
        onClick={onOpenMissions}
        className="mx-5 mt-3 w-[calc(100%-2.5rem)] rounded-xl py-2 text-xs font-bold text-white/45 text-center active:opacity-70 home-mission-link"
      >
        🎯 {seasonTitle} · {seasonFocus} ›
      </button>
    );
  }

  function claim(e: React.MouseEvent) {
    e.stopPropagation();
    if (!first) {
      onOpenMissions();
      return;
    }
    const result = claimMission(first.def.id);
    if (result === "ok") {
      setToast(`✓ ${rewardLabel(first.def.reward)}`);
      setTimeout(() => setToast(null), 2000);
    } else {
      onOpenMissions();
    }
  }

  return (
    <GameCard
      variant="asset"
      className="home-mission-banner mx-5 mt-3 w-[calc(100%-2.5rem)] rounded-2xl p-3.5 text-right"
    >
      {toast && (
        <p className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-lg bg-grass-500/90 px-3 py-1 text-[10px] font-extrabold text-white whitespace-nowrap z-10">
          {toast}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button
          onClick={claim}
          variant="primary"
          size="sm"
          className="home-mission-claim-btn shrink-0 px-3.5"
        >
          دریافت
        </Button>
        <button
          type="button"
          onClick={onOpenMissions}
          className="flex-1 min-w-0 text-right active:opacity-85"
        >
          <p className="home-loop-card__eyebrow">{seasonTitle}</p>
          <p className="font-extrabold text-white text-sm">
            جایزه آماده است
            {count > 1 && (
              <span className="text-gold-400/90"> · {faNum(count)} ماموریت</span>
            )}
          </p>
          <p className="text-[11px] text-white/55 mt-0.5 truncate">
            {first ? first.def.title : "مسیر باشگاه را ببین"}
            {first && (
              <span className="text-gold-400/80">
                {" "}
                · {rewardLabel(first.def.reward)}
              </span>
            )}
          </p>
        </button>
        <span className="home-loop-card__count">{faNum(count)}</span>
      </div>
    </GameCard>
  );
}
