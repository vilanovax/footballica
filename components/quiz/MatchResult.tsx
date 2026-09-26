"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  resolveMatch,
  type ResolveMatchResult,
  type MatchModeOption,
} from "@/actions/resolveMatch";
import type { KickSubmission } from "@/lib/quiz/scoring";
import type { HelperKey } from "@/lib/game/helpers";
import { calculateLevel } from "@/lib/game/economy";
import { nextMilestone, winsAway } from "@/lib/club/milestones";
import { usePenaltyStore } from "@/stores/penaltyStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { PostMatchSummary } from "@/components/match/PostMatchSummary";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";

/** Stable default — avoid `= []` recreating referential identity each render. */
const EMPTY_HELPERS: HelperKey[] = [];

type MatchResultProps = {
  totalKicks: number;
  submissions: KickSubmission[];
  /**
   * Zustand session for this kickoff — dedupes resolveMatch when the result
   * screen remounts after the Server Action refresh.
   */
  sessionId?: string | null;
  /** FTUE tutorial match — fixed payout, no "Play Again" (loop back to Hub). */
  tutorial?: boolean;
  /** Whether any help (50/50, freeze, superpower) was used — gates "no help" badges. */
  usedHelp?: boolean;
  /** In-match coin helpers used, in order — settled (coin cost) server-side. */
  helpersUsed?: HelperKey[];
  /** Core mode — logged server-side and drives the win/lose headline copy. */
  mode?: MatchModeOption;
  /**
   * Category bank for this Penalty (null = Random). Forwarded to settle so
   * CategoryRecord mastery updates.
   */
  categoryId?: string | null;
  /** Chronological goal/miss spots for the shootout strip. */
  kickResults?: boolean[];
  onPlayAgain: () => void;
  onExit: () => void;
};

type SaveState =
  | { status: "saving" }
  | { status: "saved"; data: Extract<ResolveMatchResult, { ok: true }> }
  | { status: "error"; message: string };

/** Survives remounts from resolveMatch → router refresh → loading.tsx. */
const settleCache = new Map<string, SaveState>();
const settleInflight = new Map<string, Promise<SaveState>>();

function settleCacheKey(
  sessionId: string | null | undefined,
  mode: MatchModeOption,
  tutorial: boolean,
  helpersUsed: HelperKey[],
  submissions: KickSubmission[],
): string {
  if (sessionId) return `session:${sessionId}`;
  // Fallback for callers that omit sessionId (should be rare).
  return [
    mode,
    tutorial ? "t" : "m",
    helpersUsed.join(","),
    submissions
      .map((s) => `${s.questionId}:${s.selectedIndex}:${s.msRemaining}`)
      .join(";"),
  ].join("|");
}

export function MatchResult({
  totalKicks,
  submissions,
  sessionId = null,
  tutorial = false,
  usedHelp = false,
  helpersUsed = EMPTY_HELPERS,
  mode = "penalty",
  categoryId = null,
  kickResults,
  onPlayAgain,
  onExit,
}: MatchResultProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const cacheKey = settleCacheKey(
    sessionId,
    mode,
    tutorial,
    helpersUsed,
    submissions,
  );
  const [save, setSave] = useState<SaveState>(
    () => settleCache.get(cacheKey) ?? { status: "saving" },
  );

  useEffect(() => {
    const cached = settleCache.get(cacheKey);
    if (cached && cached.status !== "saving") {
      setSave(cached);
      return;
    }

    let cancelled = false;
    let promise = settleInflight.get(cacheKey);
    if (!promise) {
      promise = (async (): Promise<SaveState> => {
        const result = await resolveMatch(submissions, {
          tutorial,
          usedHelp: usedHelp || helpersUsed.length > 0,
          helpersUsed,
          mode,
          categoryId,
        });
        const next: SaveState = result.ok
          ? { status: "saved", data: result }
          : { status: "error", message: result.error };
        settleCache.set(cacheKey, next);
        settleInflight.delete(cacheKey);
        return next;
      })();
      settleInflight.set(cacheKey, promise);
      settleCache.set(cacheKey, { status: "saving" });
    }

    void promise.then((next) => {
      if (!cancelled) setSave(next);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, submissions, tutorial, usedHelp, helpersUsed, mode, categoryId]);

  function leaveToUpgrade() {
    usePenaltyStore.getState().reset();
    router.push("/club?manage=1");
  }

  async function retrySubmit() {
    settleCache.delete(cacheKey);
    settleInflight.delete(cacheKey);
    setSave({ status: "saving" });
    const result = await resolveMatch(submissions, {
      tutorial,
      usedHelp: usedHelp || helpersUsed.length > 0,
      helpersUsed,
      mode,
      categoryId,
    });
    const next: SaveState = result.ok
      ? { status: "saved", data: result }
      : { status: "error", message: result.error };
    settleCache.set(cacheKey, next);
    setSave(next);
  }

  if (save.status === "saving") {
    return (
      <section className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden bg-arena px-4 text-center text-arena-fg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/memory-ball.png"
            alt=""
            draggable={false}
            className="h-16 w-16 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
          />
        </motion.div>
        <h1 className="font-display text-2xl font-black text-white">
          {t("result.saving")}
        </h1>
      </section>
    );
  }

  if (save.status === "error") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 bg-arena px-4 text-center text-arena-fg">
        <GameIconWell size="xl" src="/icons/broken-heart.png" className="mx-auto" />
        <div>
          <h1 className="font-display text-2xl font-black text-rose-300">
            {t("result.saveFailed")}
          </h1>
          <p className="mt-1 max-w-xs font-display text-sm font-bold text-white/65">
            {save.message}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <GameCta
            variant="primary"
            block
            onClick={() => void retrySubmit()}
            className="font-display text-base font-black"
          >
            {t("common.retry")}
          </GameCta>
          <GameCta
            variant="accent"
            block
            onClick={onExit}
            className="font-display text-base font-black"
          >
            {t("common.backToClub")}
          </GameCta>
        </div>
      </section>
    );
  }

  const {
    rewards: confirmed,
    balances,
    level,
    levelUp,
    coinsPerWin,
    unlockedBadges,
    streak,
    missions,
    businessBoostGranted,
    businessBoostBonus,
    penaltyRecord,
  } = save.data;
  const won = confirmed.won;
  const outOfEnergy = balances.stamina <= 0;
  const hidePlayAgain = tutorial || outOfEnergy;

  const prevProgress = calculateLevel(balances.xp - confirmed.xp).progress;
  const barFrom = levelUp ? 0 : prevProgress;

  const coinBase =
    confirmed.breakdown.coinsWin +
    confirmed.breakdown.coinsPerfectBonus +
    confirmed.breakdown.comboCoinBonus;
  const boosterCoinBonus = Math.max(0, confirmed.coins - coinBase);

  const bonusLines = [
    {
      key: "correct",
      label: t("result.correctAnswers", {
        n: toLocaleDigits(confirmed.goals, locale),
      }),
      amount: confirmed.breakdown.xpFromGoals,
      unit: "XP",
    },
    {
      key: "winxp",
      label: t("result.winBonus"),
      amount: confirmed.breakdown.xpWinBonus,
      unit: "XP",
    },
    {
      key: "perfect",
      label: t("result.perfectBonus"),
      amount: confirmed.breakdown.coinsPerfectBonus,
      unit: "💰",
    },
    {
      key: "comboxp",
      label: t("result.comboBonus"),
      amount: confirmed.breakdown.comboXpBonus,
      unit: "XP",
    },
    {
      key: "combocoin",
      label: t("result.comboBonus"),
      amount: confirmed.breakdown.comboCoinBonus,
      unit: "💰",
    },
    {
      key: "booster",
      label: t("result.boosterBonus"),
      amount: boosterCoinBonus,
      unit: "💰",
    },
  ].filter((l) => l.amount > 0);

  const milestone = tutorial
    ? null
    : nextMilestone({
        coins: balances.coins,
        stadiumLevel: balances.stadiumLevel,
        medicalLevel: balances.medicalLevel,
        trainingGroundLevel: balances.trainingGroundLevel,
      });

  let milestoneBody: string | null = null;
  if (milestone) {
    const name = locale === "fa" ? milestone.faName : milestone.name;
    if (milestone.affordable) {
      milestoneBody = t("result.milestoneReady", { name });
    } else {
      const wins = winsAway(milestone.remaining, coinsPerWin);
      milestoneBody =
        wins <= 1
          ? t("result.milestoneOneWin", { name })
          : t("result.milestoneBudget", {
              n: toLocaleDigits(milestone.remaining, locale),
              name,
            });
    }
  }

  const title = won ? t("result.won") : t("result.lost");

  const chips = [
    confirmed.combo >= 2
      ? {
          key: "combo",
          label: t("result.combo", {
            n: toLocaleDigits(confirmed.combo, locale),
          }),
          tone: "accent" as const,
          iconSrc: "/icons/streak.png",
        }
      : null,
    streak.dailyStreak >= 1
      ? {
          key: "streak",
          label: t("result.streakDays", {
            n: toLocaleDigits(streak.dailyStreak, locale),
          }),
          tone: "secondary" as const,
          iconSrc: "/icons/streak.png",
        }
      : null,
    businessBoostGranted
      ? {
          key: "bizboost",
          label: t("result.businessBoost", {
            pct: toLocaleDigits(Math.round(businessBoostBonus * 100), locale),
          }),
          tone: "accent" as const,
          iconSrc: "/icons/upgrade.png",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    tone: "accent" | "secondary";
    iconSrc?: string;
  }>;

  const streakNote = streak.extended
    ? streak.dailyStreak > 1
      ? t("result.streakExtended", {
          n: toLocaleDigits(streak.dailyStreak, locale),
        })
      : t("result.streakStarted")
    : null;

  const trophies: Array<{
    key: string;
    emoji: string;
    title: string;
    subtitle?: string;
  }> = [];
  if (penaltyRecord?.isNewRecord) {
    trophies.push({
      key: "record",
      emoji: "📈",
      title: t("result.newRecordTrophy"),
      subtitle: t("result.penaltyNewRecord", {
        goals: toLocaleDigits(penaltyRecord.bestGoals, locale),
        total: toLocaleDigits(totalKicks, locale),
      }),
    });
  } else if (
    penaltyRecord &&
    penaltyRecord.previousBest > 0 &&
    !penaltyRecord.isPerfect
  ) {
    trophies.push({
      key: "toBeat",
      emoji: "🎯",
      title: t("result.penaltyRecordHintTitle"),
      subtitle: t("result.penaltyRecordHint", {
        goals: toLocaleDigits(penaltyRecord.previousBest, locale),
        total: toLocaleDigits(totalKicks, locale),
      }),
    });
  }
  if (penaltyRecord?.isPerfect) {
    trophies.push({
      key: "perfectBank",
      emoji: "💎",
      title: t("result.penaltyPerfectTrophy"),
      subtitle: t("result.penaltyPerfectHint", {
        n: toLocaleDigits(penaltyRecord.perfectCategories, locale),
      }),
    });
  }

  const upgradeReady = Boolean(milestone?.affordable && !tutorial);

  // One goal shy of Perfect — this run or sticky PB chase.
  const nearPerfect =
    !tutorial &&
    mode === "penalty" &&
    totalKicks >= 2 &&
    (confirmed.goals === totalKicks - 1 ||
      (penaltyRecord != null &&
        !penaltyRecord.isPerfect &&
        penaltyRecord.bestGoals === totalKicks - 1));

  // Mission rewards surface as the animated gift → MissionDrawer — no
  // duplicate "go to club" banner competing with Play Again.
  const ctaNotice = tutorial
    ? t("result.spendCoins")
    : nearPerfect && outOfEnergy && !upgradeReady
      ? t("result.nearPerfectOutOfEnergy")
      : nearPerfect && !outOfEnergy
        ? t("result.nearPerfectNotice")
        : outOfEnergy && !upgradeReady
          ? t("result.outOfEnergy")
          : null;

  // Metagame-first when an upgrade is buyable; otherwise keep the loop open.
  // Out-of-energy near-perfect lands on Club MatchDoor (refill), not manage.
  // Always keep an exit path (close + tertiary/secondary back) — never trap
  // the player between Upgrade and Play Again only.
  type Cta = {
    label: string;
    onClick: () => void;
    variant: "primary" | "accent" | "secondary";
  };
  let primaryCta: Cta | null = null;
  let secondaryCta: Cta | null = null;
  let tertiaryCta: Cta | null = null;

  if (upgradeReady) {
    primaryCta = {
      label: t("result.goUpgrade"),
      onClick: leaveToUpgrade,
      variant: "accent",
    };
    if (!hidePlayAgain) {
      secondaryCta = {
        label: nearPerfect
          ? t("result.nearPerfectCta")
          : t("result.playAgain"),
        onClick: onPlayAgain,
        variant: "primary",
      };
      tertiaryCta = {
        label: t("common.backToClub"),
        onClick: onExit,
        variant: "secondary",
      };
    } else {
      secondaryCta = {
        label: t("common.backToClub"),
        onClick: onExit,
        variant: "secondary",
      };
    }
  } else if (!hidePlayAgain) {
    primaryCta = {
      label: nearPerfect
        ? t("result.nearPerfectCta")
        : t("result.playAgain"),
      onClick: onPlayAgain,
      variant: "accent",
    };
    secondaryCta = {
      label: t("common.backToClub"),
      onClick: onExit,
      variant: "secondary",
    };
  } else if (outOfEnergy && nearPerfect) {
    primaryCta = {
      label: t("result.nearPerfectEnergyCta"),
      onClick: onExit,
      variant: "accent",
    };
    secondaryCta = {
      label: t("common.backToClub"),
      onClick: onExit,
      variant: "secondary",
    };
  } else {
    primaryCta = {
      label: t("common.backToClub"),
      onClick: onExit,
      variant: "primary",
    };
  }

  // Prefer live kick log; fall back to a compact goals-then-misses strip.
  const spots =
    kickResults && kickResults.length > 0
      ? kickResults
      : Array.from({ length: totalKicks }, (_, i) => i < confirmed.goals);

  return (
    <PostMatchSummary
      outcome={{
        emoji: won ? "🏆" : "🧤",
        heroSrc: won ? "/icons/trophy.png" : "/icons/broken-heart.png",
        title,
        subtitle: t("result.goalsScored", {
          goals: toLocaleDigits(confirmed.goals, locale),
          total: toLocaleDigits(totalKicks, locale),
        }),
        kickResults: spots,
        hint: won ? t("result.wonHint") : t("result.lostHint"),
        hintTone: won ? "positive" : "negative",
        chips,
      }}
      rewards={{
        coins: confirmed.coins,
        xp: confirmed.xp,
        fans: confirmed.fans,
        bonusLines,
        balances: {
          coins: balances.coins,
          fans: balances.fans,
          stamina: balances.stamina,
          maxStamina: balances.maxStamina,
        },
      }}
      achievements={{
        level: {
          level: level.level,
          currentLevelXp: level.currentLevelXp,
          nextLevelXp: level.nextLevelXp,
          progress: level.progress,
          barFrom,
          levelUp,
        },
        badges: unlockedBadges,
        missions,
        streakNote,
        trophies,
        // Affordable upgrade is the footer CTA — don't repeat it as a card.
        milestone:
          milestone && milestoneBody && !upgradeReady
            ? {
                icon: milestone.icon,
                eyebrow: t("result.milestoneTitle"),
                body: milestoneBody,
                fill: Math.min(1, balances.coins / milestone.cost),
              }
            : null,
      }}
      ctas={{
        notice: ctaNotice,
        primary: primaryCta,
        secondary: secondaryCta,
        tertiary: tertiaryCta,
        onClose: onExit,
      }}
    />
  );
}
