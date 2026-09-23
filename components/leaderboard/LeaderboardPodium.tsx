"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AvatarImage } from "@/components/common/AvatarImage";
import type { LeaderboardRow } from "@/actions/getLeaderboard";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatNumber, toLocaleDigits } from "@/lib/i18n/format";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { RankArt, medalKindForPlace } from "@/components/leaderboard/RankArt";
import { shortClubName } from "@/lib/leaderboard/displayName";
import { GamePanel } from "@/components/ui/game/GamePanel";

type LeaderboardPodiumProps = {
  rows: LeaderboardRow[];
};

const PLACES: Record<
  number,
  {
    ring: string;
    glow: string;
    barOuter: string;
    barInner: string;
    barHeight: string;
    avatarSize: string;
    numberTone: string;
  }
> = {
  1: {
    ring: "ring-amber-300",
    glow: "shadow-[0_0_28px_rgba(250,204,21,0.55)]",
    barOuter: "bg-linear-to-b from-amber-200 via-amber-400 to-amber-700",
    barInner: "bg-linear-to-b from-white/35 via-transparent to-black/25",
    barHeight: "h-[4.75rem]",
    avatarSize: "h-[4.25rem] w-[4.25rem]",
    numberTone: "text-amber-950",
  },
  2: {
    ring: "ring-slate-300",
    glow: "shadow-[0_0_18px_rgba(203,213,225,0.4)]",
    barOuter: "bg-linear-to-b from-slate-100 via-slate-300 to-slate-500",
    barInner: "bg-linear-to-b from-white/40 via-transparent to-black/20",
    barHeight: "h-14",
    avatarSize: "h-12 w-12",
    numberTone: "text-slate-800",
  },
  3: {
    ring: "ring-orange-300",
    glow: "shadow-[0_0_18px_rgba(192,132,87,0.45)]",
    barOuter: "bg-linear-to-b from-orange-200 via-orange-400 to-amber-800",
    barInner: "bg-linear-to-b from-white/30 via-transparent to-black/25",
    barHeight: "h-11",
    avatarSize: "h-12 w-12",
    numberTone: "text-amber-950",
  },
};

const RENDER_ORDER = [2, 1, 3] as const;

/** Top-3 podium — staged dark chrome with dimensional steps. */
export function LeaderboardPodium({ rows }: LeaderboardPodiumProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const byRank = new Map(rows.map((r) => [r.rank, r] as const));

  return (
    <GamePanel tone="amber" className="mb-2.5 px-2 pb-1.5 pt-2.5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_70%_90%_at_50%_0%,rgba(251,191,36,0.28),transparent_70%)]"
      />

      <div className="relative mb-1 flex items-center justify-center gap-1.5">
        <RankArt kind="trophy" size="sm" className="h-4 w-4" />
        <p className="font-display text-xs font-black text-amber-200/90">
          {t("leaderboard.podiumTitle")}
        </p>
      </div>

      <div className="relative flex items-end justify-center gap-1 px-0.5 pt-4">
        {RENDER_ORDER.map((rank) => {
          const row = byRank.get(rank);
          if (!row) return null;
          const place = PLACES[rank]!;
          const isChampion = rank === 1;

          return (
            <motion.div
              key={row.userId}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 280,
                      damping: 20,
                      delay: rank === 1 ? 0.06 : rank === 2 ? 0.14 : 0.22,
                    }
              }
              className={[
                "flex min-w-0 flex-1 flex-col items-center",
                isChampion ? "z-10" : "z-0",
              ].join(" ")}
            >
              {isChampion && (
                <div
                  className="mb-0.5 motion-safe:animate-[podium-crown_2.4s_ease-in-out_infinite]"
                  aria-hidden
                >
                  <RankArt kind="crown" size="md" className="h-6 w-6" />
                </div>
              )}

              <div className="relative">
                <div
                  className={[
                    "overflow-hidden rounded-full ring-4",
                    place.ring,
                    place.glow,
                    place.avatarSize,
                    row.isCurrentUser
                      ? "outline outline-2 outline-offset-2 outline-accent"
                      : "",
                  ].join(" ")}
                >
                  <AvatarImage
                    avatarKey={row.avatarKey}
                    priority={isChampion}
                    sizes={isChampion ? "68px" : "48px"}
                    className="h-full w-full rounded-full"
                  />
                </div>
                <span
                  className="absolute -bottom-1 flex h-6 w-6 items-center justify-center inset-inline-end-[-2px]"
                  aria-label={`#${rank}`}
                >
                  <RankArt
                    kind={medalKindForPlace(rank)}
                    size="sm"
                    className="h-6 w-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                  />
                </span>
                {row.isCurrentUser && (
                  <span className="absolute -top-1 start-1/2 -translate-x-1/2 rounded-full bg-accent px-1.5 py-0.5 font-display text-[8px] font-black uppercase text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
                    {t("leaderboard.you")}
                  </span>
                )}
              </div>

              <p
                className={[
                  "mt-1.5 w-full truncate px-0.5 text-center font-display font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]",
                  isChampion ? "text-xs" : "text-[11px]",
                ].join(" ")}
                title={row.clubName}
              >
                {shortClubName(row.clubName, isChampion ? 18 : 14)}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-black/45 px-2 py-0.5 font-display text-[11px] font-black tabular-nums text-emerald-300 shadow-[0_2px_0_0_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.12)]">
                <ResourceIcon kind="xp" size="sm" className="h-3.5 w-3.5" />
                {formatNumber(row.weeklyXp, locale)}
              </p>

              <div
                className={[
                  "relative mt-1.5 w-full overflow-hidden rounded-t-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.4)]",
                  place.barOuter,
                  place.barHeight,
                ].join(" ")}
              >
                <div
                  aria-hidden
                  className={["absolute inset-0", place.barInner].join(" ")}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 start-0 w-2 bg-white/15"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 end-0 w-2 bg-black/20"
                />
                <span
                  className={[
                    "relative flex h-full items-start justify-center pt-1.5 font-display text-2xl font-black drop-shadow-sm",
                    place.numberTone,
                  ].join(" ")}
                >
                  {toLocaleDigits(rank, locale)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div
        aria-hidden
        className="relative -mx-1 h-2 rounded-b-xl bg-linear-to-b from-black/40 to-black/10"
      />
    </GamePanel>
  );
}
