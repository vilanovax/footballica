"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AvatarImage } from "@/components/common/AvatarImage";
import type { HallOfFameWeek } from "@/actions/getHallOfFame";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatNumber, toLocaleDigits } from "@/lib/i18n/format";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { RankArt, medalKindForPlace } from "@/components/leaderboard/RankArt";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type HallOfFamePanelProps = {
  weeks: HallOfFameWeek[];
};

const RANK_TONE: Record<
  number,
  { panel: "amber" | "emerald" | "sky"; ring: string }
> = {
  1: {
    panel: "amber",
    ring: "ring-1 ring-amber-300/55 shadow-[0_0_18px_rgba(251,191,36,0.28)]",
  },
  2: {
    panel: "sky",
    ring: "ring-1 ring-slate-300/40",
  },
  3: {
    panel: "emerald",
    ring: "ring-1 ring-orange-300/40",
  },
};

/** Format `2026-W30` → localized week label. */
function weekLabel(
  key: string,
  locale: string,
  t: (k: string, p?: Record<string, string | number>) => string,
): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!m) return key;
  const year = m[1];
  const week = toLocaleDigits(Number(m[2]), locale as "en" | "fa");
  return t("leaderboard.hofWeek", { week, year });
}

/**
 * Past weekly podiums — Arena chrome (pitch-dark) matching the weekly tab.
 */
export function HallOfFamePanel({ weeks }: HallOfFamePanelProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();

  if (weeks.length === 0) {
    return (
      <GamePanel tone="amber" className="mt-4 px-4 py-10 text-center">
        <div className="relative flex justify-center" aria-hidden>
          <RankArt kind="trophy" size="lg" className="h-12 w-12" />
        </div>
        <p className="relative mt-2 font-display text-base font-bold text-amber-50">
          {t("leaderboard.hofEmpty")}
        </p>
        <p className="relative mt-1 font-body text-sm text-amber-100/65">
          {t("leaderboard.hofEmptyHint")}
        </p>
      </GamePanel>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      {weeks.map((week, wi) => (
        <motion.section
          key={week.tehranWeekKey}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { delay: wi * 0.05 }
          }
        >
          <GamePanel tone="amber" className="overflow-hidden p-0">
            <header className="relative flex items-center gap-2 border-b border-white/10 bg-black/25 px-3 py-2.5">
              <RankArt kind="trophy" size="sm" className="h-5 w-5" />
              <h2 className="font-display text-sm font-black tracking-wide text-amber-100">
                {weekLabel(week.tehranWeekKey, locale, t)}
              </h2>
            </header>

            <ol className="relative flex flex-col gap-2 p-2.5">
              {week.entries.map((entry) => {
                const style = RANK_TONE[entry.rank] ?? RANK_TONE[3]!;
                return (
                  <li key={entry.id}>
                    <GamePanel
                      tone={style.panel}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5",
                        style.ring,
                        entry.isCurrentUser &&
                          "ring-2 ring-arena-amber shadow-[0_0_14px_rgba(251,191,36,0.3)]",
                      )}
                    >
                      <span
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center"
                        aria-label={`#${entry.rank}`}
                      >
                        {entry.rank === 1 ? (
                          <RankArt
                            kind="crown"
                            size="lg"
                            className="h-9 w-9"
                          />
                        ) : (
                          <RankArt
                            kind={medalKindForPlace(entry.rank)}
                            size="lg"
                            className="h-9 w-9"
                          />
                        )}
                      </span>
                      <AvatarImage
                        avatarKey={entry.avatarKey}
                        sizes="44px"
                        priority={wi === 0 && entry.rank === 1}
                        className="relative h-11 w-11 shrink-0 rounded-full ring-2 ring-white/25"
                      />
                      <div className="relative min-w-0 flex-1">
                        <p className="truncate font-display text-base font-bold text-white">
                          {entry.clubName}
                        </p>
                        {entry.isCurrentUser && (
                          <span className="mt-0.5 inline-flex rounded-full bg-accent px-2 py-0.5 font-display text-[10px] font-extrabold text-accent-foreground">
                            {t("leaderboard.you")}
                          </span>
                        )}
                        {entry.rank === 1 && (
                          <p className="mt-0.5 font-display text-[11px] font-bold text-amber-200/90">
                            {t("leaderboard.champion")}
                          </p>
                        )}
                      </div>
                      <div className="relative shrink-0 text-end">
                        <p className="inline-flex items-center gap-1 font-display text-lg font-extrabold leading-none text-emerald-300">
                          <ResourceIcon
                            kind="xp"
                            size="sm"
                            className="h-4 w-4"
                          />
                          {formatNumber(entry.xp, locale)}
                        </p>
                      </div>
                    </GamePanel>
                  </li>
                );
              })}
            </ol>
          </GamePanel>
        </motion.section>
      ))}
    </div>
  );
}
