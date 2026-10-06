"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type MissionProgressBannerProps = {
  missions: EvaluateMissionsResult;
  className?: string;
  /** Pitch-dark Arena styling for post-match / immersive shells. */
  arena?: boolean;
};

/**
 * Compact post-match mission pulse — game strip, not a form list.
 * Shows up to 3 movers + one chest CTA when ready.
 */
export function MissionProgressBanner({
  missions,
  className,
  arena = false,
}: MissionProgressBannerProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const updates = missions.updates ?? [];
  if (updates.length === 0 && !missions.chestReady) return null;

  const movers = updates.slice(0, 3);
  const completedCount = updates.filter((u) => u.justCompleted).length;
  const showChest = missions.chestReady || completedCount > 0;

  const batchLabel =
    missions.batchIndex != null
      ? t("missions.title", {
          n: toLocaleDigits(missions.batchIndex, locale),
        })
      : null;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <GamePanel
        tone="amber"
        className={cn(
          "w-full px-3 py-3 text-start",
          arena ? "bg-black/35" : "bg-black/20",
        )}
      >
        <div className="relative flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-[10px] font-extrabold tracking-wide text-amber-200/80">
              {t("missions.eyebrow")}
            </p>
            {batchLabel ? (
              <p className="mt-0.5 truncate font-display text-sm font-black text-white">
                {batchLabel}
              </p>
            ) : null}
          </div>
          {completedCount > 0 ? (
            <GameChip tone="emerald" className="shrink-0 text-[10px] font-black">
              ✓ {toLocaleDigits(completedCount, locale)}
            </GameChip>
          ) : null}
        </div>

        {movers.length > 0 ? (
          <ul className="relative mt-3 flex flex-col gap-2.5">
            {movers.map((u) => {
              const missionTitle = locale === "fa" ? u.titleFa : u.titleEn;
              const pct = Math.min(
                100,
                Math.round((u.progress / Math.max(1, u.targetValue)) * 100),
              );
              const done = u.justCompleted || pct >= 100;
              return (
                <li key={u.missionId} className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-display text-sm font-bold text-white">
                      {missionTitle}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-display text-[11px] font-extrabold tabular-nums",
                        done ? "text-emerald-300" : "text-white/55",
                      )}
                    >
                      {done
                        ? t("missions.justDone")
                        : `${toLocaleDigits(u.progress, locale)}/${toLocaleDigits(u.targetValue, locale)}`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        done
                          ? "bg-emerald-400"
                          : "bg-linear-to-r from-amber-400 to-emerald-400",
                      )}
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {showChest ? (
          <GameCta
            variant="accent"
            block
            className="relative mt-3 min-h-11 gap-2 font-display text-sm font-extrabold"
            onClick={() => {
              playSound("click");
              router.push("/club");
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/gift.png"
              alt=""
              aria-hidden
              draggable={false}
              className="h-6 w-6 object-contain"
            />
            <span className="min-w-0 truncate">
              {missions.chestReady
                ? t("missions.chestReadyBadge")
                : t("result.missionsReadyOnClub")}
              <span className="ms-1 opacity-80">
                · {t("missions.openDrawer")}
              </span>
            </span>
          </GameCta>
        ) : null}
      </GamePanel>
    </motion.div>
  );
}
