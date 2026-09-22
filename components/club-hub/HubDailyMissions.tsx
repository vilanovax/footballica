"use client";

import { useEffect, useState, useTransition } from "react";
import {
  claimMyMissionChest,
  claimMyMissionReward,
  getMyMissions,
} from "@/actions/missions";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { toast } from "sonner";

type HubDailyMissionsProps = {
  board: EvaluateMissionsResult | null;
  onOpen: () => void;
  /** Keep hub coin HUD in sync after a drip or chest claim. */
  onBalances?: (balances: { coins: number; xp: number }) => void;
};

/**
 * Daily objectives on the hub. Claimable rows pay on tap; otherwise opens the drawer.
 */
export function HubDailyMissions({
  board: initialBoard,
  onOpen,
  onBalances,
}: HubDailyMissionsProps) {
  const { t, locale } = useTranslation();
  const [board, setBoard] = useState(initialBoard);
  const [pending, startTransition] = useTransition();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const missions = board?.missions ?? [];
  const shown = missions.slice(0, 3);
  if (shown.length === 0 || !board) return null;

  const done = missions.filter((mission) => mission.isCompleted).length;
  const claimable = missions.filter(
    (mission) => mission.isCompleted && !mission.isClaimed,
  );
  const chestReady = Boolean(board.chestReady);

  function claimDrip(missionId: string) {
    if (pending || claimingId) return;
    playSound("click");
    haptic(HAPTIC.tap);
    setClaimingId(missionId);
    startTransition(async () => {
      const res = await claimMyMissionReward(missionId);
      if (!res.ok) {
        setClaimingId(null);
        toast.error(t("missions.errClaimDrip"));
        return;
      }
      playSound("upgrade");
      haptic(HAPTIC.goal);
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              missions: prev.missions.map((m) =>
                m.missionId === missionId ? { ...m, isClaimed: true } : m,
              ),
            }
          : prev,
      );
      onBalances?.(res.balances);
      setClaimingId(null);
    });
  }

  function claimChest() {
    if (pending || !board?.chestReady || !board.batchId) return;
    playSound("click");
    haptic(HAPTIC.tap);
    startTransition(async () => {
      const res = await claimMyMissionChest(board.batchId ?? undefined);
      if (!res.ok) {
        toast.error(t("missions.errClaim"));
        return;
      }
      playSound("upgrade");
      haptic(HAPTIC.goal);
      onBalances?.(res.balances);
      const next = await getMyMissions();
      if (next.ok) setBoard(next.daily);
    });
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <p className="font-display text-xs font-black text-arena-muted">
          {t("missions.dailyTitle")}
        </p>
        <GameChip
          tone={chestReady || claimable.length > 0 ? "amber" : "default"}
        >
          {chestReady
            ? t("missions.tapClaim")
            : claimable.length > 0
              ? t("missions.readyToClaim")
              : t("missions.progress", {
                  done: toLocaleDigits(done, locale),
                  total: toLocaleDigits(missions.length, locale),
                })}
        </GameChip>
      </div>

      <GamePanel tone="emerald" className="px-3 py-2.5">
        <ul className="flex flex-col gap-2">
          {shown.map((mission) => {
            const title = locale === "fa" ? mission.titleFa : mission.titleEn;
            const canClaim = mission.isCompleted && !mission.isClaimed;
            const claimed = mission.isCompleted && mission.isClaimed;
            const busy = claimingId === mission.missionId;

            if (canClaim) {
              return (
                <li key={mission.missionId}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => claimDrip(mission.missionId)}
                    aria-label={`${t("missions.claimDrip")}: ${title}`}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
                  >
                    <GameIconWell size="sm" amber src="/icons/trophy.png" />
                    <p className="min-w-0 flex-1 font-display text-[13px] font-black leading-snug text-white">
                      {title}
                    </p>
                    <GameChip tone="amber" className="shrink-0">
                      {busy ? t("missions.claiming") : t("missions.claimDrip")}
                    </GameChip>
                  </button>
                </li>
              );
            }

            return (
              <li key={mission.missionId} className="flex items-center gap-2.5">
                <GameIconWell
                  size="sm"
                  src={
                    claimed ? "/icons/trophy.png" : "/icons/hub-mission.png"
                  }
                />
                <p
                  className={[
                    "min-w-0 flex-1 font-display text-[13px] font-black leading-snug",
                    claimed ? "text-white/45 line-through" : "text-white",
                  ].join(" ")}
                >
                  {title}
                </p>
                <span className="shrink-0 font-display text-[11px] font-bold tabular-nums text-white/70">
                  {claimed
                    ? t("missions.claimed")
                    : `${toLocaleDigits(mission.progress, locale)}/${toLocaleDigits(mission.targetValue, locale)}`}
                </span>
              </li>
            );
          })}
        </ul>

        {chestReady ? (
          <button
            type="button"
            disabled={pending}
            onClick={claimChest}
            className="game-cta game-cta-accent relative mt-3 w-full text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            {t("missions.claimChest")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.tap);
              onOpen();
            }}
            aria-label={t("missions.openDrawer")}
            className="mt-2.5 flex min-h-10 w-full items-center justify-center font-display text-[11px] font-bold text-white/55 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            {t("missions.openDrawer")}
          </button>
        )}
      </GamePanel>
    </div>
  );
}
