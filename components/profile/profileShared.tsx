"use client";

import type { Locale } from "@/lib/i18n/config";
import { toLocaleDigits } from "@/lib/i18n/format";
import type {
  Achievement,
  BadgeCategory,
  BadgeTier,
  PlayerStats,
} from "@/lib/game/achievements";
import type { GamePanelTone } from "@/components/ui/game/GamePanel";

/** Achievement + resolved presentation (admin overlay / art). */
export type DisplayAchievement = Achievement & {
  imageUrl?: string | null;
  hidden?: boolean;
};

/** Tier → medal ring fill. */
export const TIER_RING: Record<BadgeTier, string> = {
  bronze: "from-amber-200 to-amber-600 text-amber-950",
  silver: "from-slate-100 to-slate-400 text-slate-800",
  gold: "from-yellow-200 to-amber-400 text-yellow-950",
};

/** Arena panel tone per badge tier. */
export const TIER_PANEL: Record<BadgeTier, GamePanelTone> = {
  bronze: "amber",
  silver: "emerald",
  gold: "amber",
};

export const TIER_MEDAL_GLOW: Record<BadgeTier, string> = {
  bronze: "shadow-[0_0_12px_rgba(180,83,9,0.55)] ring-2 ring-amber-200/55",
  silver: "shadow-[0_0_12px_rgba(203,213,225,0.65)] ring-2 ring-slate-100/70",
  gold: "shadow-[0_0_14px_rgba(250,204,21,0.65)] ring-2 ring-amber-100/75",
};

export const TIER_SHEET_WASH: Record<BadgeTier, string> = {
  bronze: "from-amber-900/90 via-arena to-arena-mid",
  silver: "from-slate-600/80 via-arena to-arena-mid",
  gold: "from-amber-700/85 via-arena to-arena-mid",
};

export const CATEGORY_ORDER: BadgeCategory[] = [
  "skill",
  "purity",
  "dedication",
  "volume",
];

export type TrophyState = "unlocked" | "progress" | "locked";

export function resolveTrophyState(
  unlockedAt: string | undefined,
  prog: { current: number; target: number } | undefined,
): TrophyState {
  if (unlockedAt) return "unlocked";
  if (prog && prog.current > 0 && prog.current < prog.target) return "progress";
  if (prog && prog.current >= prog.target) return "progress";
  return "locked";
}

/** RTL-safe fraction: FA "۱۹ از ۱۰۰", EN LTR "19 / 100". */
export function FractionText({
  cur,
  next,
  locale,
  suffix,
  className,
}: {
  cur: number | string;
  next: number | string;
  locale: Locale;
  suffix?: string;
  className?: string;
}) {
  const c = toLocaleDigits(cur, locale);
  const n = toLocaleDigits(next, locale);
  if (locale === "fa") {
    return (
      <span className={className}>
        {c} از {n}
        {suffix ? ` ${suffix}` : ""}
      </span>
    );
  }
  return (
    <bdi dir="ltr" className={className}>
      {c} / {n}
      {suffix ? ` ${suffix}` : ""}
    </bdi>
  );
}

export type TrophyCabinetBuckets = {
  nextGoal: DisplayAchievement | null;
  unlockedHonors: DisplayAchievement[];
  otherByCategory: { cat: BadgeCategory; items: DisplayAchievement[] }[];
};

/** Split achievements into next-goal chase, unlocked honors, and locked pools. */
export function buildTrophyCabinet(
  displayAchievements: DisplayAchievement[],
  owned: Map<string, string>,
  playerStats: PlayerStats,
): TrophyCabinetBuckets {
  const unlocked: DisplayAchievement[] = [];
  const inProgress: {
    row: DisplayAchievement;
    ratio: number;
    stepsLeft: number;
  }[] = [];
  const locked: DisplayAchievement[] = [];

  for (const a of displayAchievements) {
    if (owned.has(a.slug)) {
      unlocked.push(a);
      continue;
    }
    const prog = a.progress?.(playerStats);
    if (prog && prog.current > 0) {
      const ratio = prog.target > 0 ? prog.current / prog.target : 0;
      inProgress.push({
        row: a,
        ratio,
        stepsLeft: Math.max(0, prog.target - prog.current),
      });
    } else {
      locked.push(a);
    }
  }

  inProgress.sort((a, b) => b.ratio - a.ratio);
  const chase = inProgress.filter((x) => x.ratio >= 0.4 || x.stepsLeft <= 3);
  const next = chase[0]?.row ?? null;
  const nextSlug = next?.slug;
  const otherPool = [
    ...inProgress.filter((x) => x.row.slug !== nextSlug).map((x) => x.row),
    ...locked,
  ];

  const byCat = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: otherPool.filter((a) => a.category === cat),
  })).filter((g) => g.items.length > 0);

  return {
    nextGoal: next,
    unlockedHonors: unlocked,
    otherByCategory: byCat,
  };
}
