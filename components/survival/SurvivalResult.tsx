"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  settleSurvival,
  type SettleSurvivalResult,
} from "@/actions/match/settleSurvival";
import type { KickSubmission } from "@/lib/quiz/scoring";
import type { SurvivalEndReason } from "@/lib/game/survival";
import { calculateLevel } from "@/lib/game/economy";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { PostMatchSummary } from "@/components/match/PostMatchSummary";
import type { PostMatchTrophy } from "@/components/match/postMatchTypes";
import { GameCta } from "@/components/ui/game/GameCta";

type SurvivalResultProps = {
  categoryId: string;
  endReason: SurvivalEndReason;
  submissions: KickSubmission[];
  challengeId?: string | null;
  /** Zustand session — dedupes settle across remount after refresh. */
  sessionId?: string | null;
  onPlayAgain: () => void;
  onExit: () => void;
  onChangeCategory: () => void;
};

type SaveState =
  | { status: "saving" }
  | { status: "saved"; data: Extract<SettleSurvivalResult, { ok: true }> }
  | { status: "error"; message: string };

const settleCache = new Map<string, SaveState>();
const settleInflight = new Map<string, Promise<SaveState>>();

function survivalSettleKey(
  sessionId: string | null | undefined,
  categoryId: string,
  endReason: SurvivalEndReason,
  challengeId: string | null,
  submissions: KickSubmission[],
): string {
  if (sessionId) return `survival:${sessionId}`;
  return [
    categoryId,
    endReason,
    challengeId ?? "",
    submissions
      .map((s) => `${s.questionId}:${s.selectedIndex}:${s.msRemaining}`)
      .join(";"),
  ].join("|");
}

export function SurvivalResult({
  categoryId,
  endReason,
  submissions,
  challengeId = null,
  sessionId = null,
  onPlayAgain,
  onExit,
  onChangeCategory,
}: SurvivalResultProps) {
  const { t, locale } = useTranslation();
  const cacheKey = survivalSettleKey(
    sessionId,
    categoryId,
    endReason,
    challengeId,
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
        const result = await settleSurvival({
          categoryId,
          submissions,
          endReason,
          challengeId,
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
  }, [cacheKey, categoryId, endReason, submissions, challengeId]);

  if (save.status === "saving") {
    return (
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-arena px-6 text-center text-arena-fg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-arena-deep via-arena to-arena-mid"
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.15, ease: "easeInOut" }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/heart.png"
            alt=""
            draggable={false}
            className="h-24 w-24 object-contain drop-shadow-[0_6px_16px_rgba(220,38,38,0.3)]"
          />
        </motion.div>
        <h1 className="relative mt-4 font-display text-2xl font-black text-white">
          {t("result.saving")}
        </h1>
      </section>
    );
  }

  if (save.status === "error") {
    return (
      <section className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden bg-arena px-6 text-center text-arena-fg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-arena-deep via-arena to-arena-mid"
        />
        <p className="relative font-display text-lg font-bold text-rose-300">
          {t("survival.settleError")}
        </p>
        <p className="relative text-sm text-white/55">{save.message}</p>
        <GameCta variant="primary" onClick={onExit} className="relative">
          {t("survival.backLobby")}
        </GameCta>
      </section>
    );
  }

  const { data } = save;
  const cleared = data.rewards.endReason === "cleared";
  const catName =
    locale === "fa" ? data.category.nameFa : data.category.nameEn;

  const missionCoins = data.missions?.missionRewards.coins ?? 0;
  const missionXp = data.missions?.missionRewards.xp ?? 0;
  const matchXp = data.rewards.xp;
  const prevProgress = calculateLevel(
    data.balances.xp - matchXp - missionXp,
  ).progress;
  const barFrom = data.levelUp ? 0 : prevProgress;

  const bonusLines = [
    data.rewards.boosterCoinBonus > 0
      ? {
          key: "boosterCoin",
          label: t("result.boosterBonus"),
          amount: data.rewards.boosterCoinBonus,
          unit: "💰",
        }
      : null,
    data.rewards.boosterFanBonus > 0
      ? {
          key: "boosterFan",
          label: t("result.boosterBonus"),
          amount: data.rewards.boosterFanBonus,
          unit: "📣",
        }
      : null,
    missionCoins > 0
      ? {
          key: "missionCoins",
          label: t("result.missionCoins"),
          amount: missionCoins,
          unit: "💰",
        }
      : null,
    missionXp > 0
      ? {
          key: "missionXp",
          label: t("result.missionXp"),
          amount: missionXp,
          unit: "XP",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    amount: number;
    unit: string;
  }>;

  const trophies: PostMatchTrophy[] = [];
  if (data.isNewRecord) {
    trophies.push({
      key: "record",
      emoji: "📈",
      iconSrc: "/icons/trophy.png",
      title: t("survival.newRecordBanner"),
      subtitle: t("survival.newRecord", {
        n: toLocaleDigits(data.rewards.score, locale),
      }),
    });
  }
  if (data.challenge?.conquered) {
    trophies.push({
      key: "challenge",
      emoji: data.challenge.badgeEmoji ?? "🏆",
      iconSrc: "/icons/medal-gold.png",
      title: t("result.challengeConquered"),
      subtitle: t("survival.challengeConquered", {
        n: toLocaleDigits(data.challenge.targetScore, locale),
      }),
    });
  }

  const challengeBadges =
    data.challenge?.badgeGranted && data.challenge.badgeSlug
      ? [
          {
            slug: data.challenge.badgeSlug,
            emoji: data.challenge.badgeEmoji ?? "🏅",
            imageUrl: null,
            nameEn: data.challenge.badgeSlug,
            nameFa: data.challenge.badgeSlug,
            descriptionEn: t("result.challengeBadge"),
            descriptionFa: t("result.challengeBadge"),
            coins: 0,
            xp: 0,
          },
        ]
      : [];

  const chips = [
    {
      key: "score",
      label: `${t("survival.score")} ${toLocaleDigits(data.rewards.score, locale)}`,
      iconSrc: "/icons/trophy.png",
      bare: true,
    },
    data.rewards.bestCombo >= 2
      ? {
          key: "combo",
          label: `×${toLocaleDigits(data.rewards.bestCombo, locale)}`,
          iconSrc: "/icons/energy.png",
          bare: true,
        }
      : null,
    data.streak.extended && data.streak.dailyStreak > 1
      ? {
          key: "streak",
          label: toLocaleDigits(data.streak.dailyStreak, locale),
          iconSrc: "/icons/streak.png",
          bare: true,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    iconSrc: string;
    bare: boolean;
  }>;

  const streakNote =
    data.streak.extended && data.streak.dailyStreak <= 1
      ? t("result.streakStarted")
      : null;

  return (
    <PostMatchSummary
      outcome={{
        emoji: cleared ? "🏆" : "💔",
        heroSrc: cleared ? "/icons/trophy.png" : "/icons/broken-heart.png",
        title: cleared
          ? t("survival.clearedTitle")
          : t("survival.eliminatedTitle"),
        subtitle: catName,
        hint: cleared ? t("survival.clearedBody") : t("survival.eliminatedBody"),
        hintTone: cleared ? "positive" : "negative",
        chips,
      }}
      rewards={{
        coins: data.rewards.coins + missionCoins,
        xp: data.rewards.xp + missionXp,
        fans: data.rewards.fans,
        bonusLines,
        balances: {
          coins: data.balances.coins,
          fans: data.balances.fans,
          stamina: data.balances.stamina,
          maxStamina: data.balances.maxStamina,
        },
      }}
      achievements={{
        level: {
          level: data.level.level,
          currentLevelXp: data.level.currentLevelXp,
          nextLevelXp: data.level.nextLevelXp,
          progress: data.level.progress,
          barFrom,
          levelUp: data.levelUp,
        },
        badges: challengeBadges,
        trophies,
        missions: data.missions,
        streakNote,
      }}
      celebrateBadges={challengeBadges.length > 0}
      ctas={{
        primary: {
          label: t("survival.playAgainNamed", { name: catName }),
          onClick: onPlayAgain,
          variant: "primary",
        },
        secondary: {
          label: t("survival.backLobby"),
          onClick: onExit,
          variant: "accent",
        },
        tertiary: {
          label: t("survival.changeCategory"),
          onClick: onChangeCategory,
          variant: "secondary",
        },
      }}
    />
  );
}
