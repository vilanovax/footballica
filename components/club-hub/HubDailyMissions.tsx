"use client";

import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";

type HubDailyMissionsProps = {
  board: EvaluateMissionsResult | null;
  onOpen: () => void;
};

/**
 * Three daily objectives already on the mission board. Tap opens the drawer.
 */
export function HubDailyMissions({ board, onOpen }: HubDailyMissionsProps) {
  const { t, locale } = useTranslation();
  const missions = board?.missions ?? [];
  const shown = missions.slice(0, 3);
  if (shown.length === 0) return null;

  const done = missions.filter((mission) => mission.isCompleted).length;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <p className="font-display text-xs font-black text-arena-muted">
          {t("missions.dailyTitle")}
        </p>
        <GameChip tone={board?.chestReady ? "amber" : "default"}>
          {board?.chestReady
            ? t("missions.tapClaim")
            : t("missions.progress", {
                done: toLocaleDigits(done, locale),
                total: toLocaleDigits(missions.length, locale),
              })}
        </GameChip>
      </div>
      <button
        type="button"
        onClick={() => {
          playSound("click");
          haptic(HAPTIC.tap);
          onOpen();
        }}
        aria-label={t("missions.openDrawer")}
        className="w-full text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
      >
        <GamePanel tone="emerald" className="px-3 py-2.5">
          <ul className="flex flex-col gap-2">
            {shown.map((mission) => {
              const title = locale === "fa" ? mission.titleFa : mission.titleEn;
              return (
                <li
                  key={mission.missionId}
                  className="flex items-center gap-2.5"
                >
                  <GameIconWell
                    size="sm"
                    src={
                      mission.isCompleted
                        ? "/icons/trophy.png"
                        : "/icons/hub-mission.png"
                    }
                  />
                  <p
                    className={[
                      "min-w-0 flex-1 font-display text-[13px] font-black leading-snug",
                      mission.isCompleted
                        ? "text-white/45 line-through"
                        : "text-white",
                    ].join(" ")}
                  >
                    {title}
                  </p>
                  <span className="shrink-0 font-display text-[11px] font-bold tabular-nums text-white/70">
                    {toLocaleDigits(mission.progress, locale)}/
                    {toLocaleDigits(mission.targetValue, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        </GamePanel>
      </button>
    </div>
  );
}
