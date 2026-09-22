"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  nextMilestone,
  winsAway,
  type MilestoneInput,
} from "@/lib/club/milestones";
import { staminaRegenIntervalMs } from "@/lib/club/stamina";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { LastMatchLine } from "@/lib/club/lastMatch";

type MatchDoorProps = {
  stamina: number;
  maxStamina: number;
  msUntilNext: number;
  medicalLevel: number;
  questionCount: number;
  approxCoins: number;
  staminaCost: number;
  milestoneInput: MilestoneInput;
  coinsPerWin: number;
  /** Newest finished match. Omitted when the club has not played yet. */
  lastMatch?: LastMatchLine | null;
};

function formatMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * First-viewport match door. Penalty is the core loop; the club milestone
 * is one line under the kickoff, not a second shop.
 */
export function MatchDoor({
  stamina,
  maxStamina,
  msUntilNext,
  medicalLevel,
  questionCount,
  approxCoins,
  staminaCost,
  milestoneInput,
  coinsPerWin,
  lastMatch = null,
}: MatchDoorProps) {
  const { t, locale } = useTranslation();
  const regenIntervalMs = staminaRegenIntervalMs(medicalLevel);
  const [localStamina, setLocalStamina] = useState(stamina);
  const [remainingMs, setRemainingMs] = useState(msUntilNext);
  const remainingRef = useRef(msUntilNext);

  useEffect(() => {
    setLocalStamina(stamina);
    setRemainingMs(msUntilNext);
    remainingRef.current = msUntilNext;
  }, [stamina, msUntilNext, maxStamina, medicalLevel]);

  useEffect(() => {
    if (localStamina >= staminaCost || localStamina >= maxStamina) return;
    const id = window.setInterval(() => {
      remainingRef.current -= 1000;
      if (remainingRef.current <= 0) {
        setLocalStamina((current) => Math.min(maxStamina, current + 1));
        remainingRef.current = regenIntervalMs;
      }
      setRemainingMs(remainingRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [localStamina, maxStamina, staminaCost, regenIntervalMs]);

  const canPlay = localStamina >= staminaCost;
  const goal = nextMilestone(milestoneInput);
  const goalName = goal ? (locale === "fa" ? goal.faName : goal.name) : null;
  const wins =
    goal && !goal.affordable
      ? winsAway(goal.remaining, coinsPerWin)
      : 0;
  const showProgress = Boolean(goal && goalName && !goal.affordable);
  const lastBits = lastMatch
    ? [
        t(lastMatch.won ? "club.lastMatchWin" : "club.lastMatchLoss"),
        lastMatch.coins > 0
          ? t("club.lastMatchCoins", {
              coins: toLocaleDigits(lastMatch.coins, locale),
            })
          : null,
        lastMatch.fans > 0
          ? t("club.lastMatchFans", {
              fans: toLocaleDigits(lastMatch.fans, locale),
            })
          : null,
      ].filter(Boolean)
    : [];

  return (
    <GamePanel tone={canPlay ? "emerald" : "rose"} className="p-3">
      <div className="relative flex items-start gap-3">
        <GameIconWell size="lg" src="/icons/nav-ball.png" />
        <div className="min-w-0 flex-1">
          <GameChip tone={canPlay ? "emerald" : "amber"}>
            {t("club.matchDoorKicker")}
          </GameChip>
          <p className="mt-1 font-display text-xl font-black leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
            {t("play.penalty")}
          </p>
          <p className="mt-1 font-display text-xs font-bold text-white/75">
            {t("club.matchDoorQuestions", {
              n: toLocaleDigits(questionCount, locale),
            })}
            {" · "}
            {t("club.matchDoorReward", {
              coins: toLocaleDigits(approxCoins, locale),
            })}
          </p>
        </div>
      </div>

      {canPlay ? (
        <Link
          href="/play/penalty"
          onClick={() => {
            playSound("click");
            haptic(HAPTIC.tap);
          }}
          className="game-cta game-cta-accent mt-3 flex min-h-14 w-full items-center justify-center font-display text-base font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
        >
          {t("club.matchDoorStart")}
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="game-cta game-cta-ghost mt-3 min-h-14 w-full font-display text-base font-black"
        >
          {t("club.matchDoorEmpty")}
        </button>
      )}

      <p className="mt-2 text-center font-display text-[11px] font-bold text-white/70">
        {t("club.matchDoorEnergy", {
          n: toLocaleDigits(staminaCost, locale),
        })}
        {!canPlay && remainingMs > 0
          ? ` · ${t("club.matchDoorRegen", {
              time: toLocaleDigits(formatMMSS(remainingMs), locale),
            })}`
          : ""}
      </p>

      {(lastBits.length > 0 || showProgress) && (
        <div className="mt-2 border-t border-white/10 px-1 pt-2 text-center">
          {lastBits.length > 0 ? (
            <p className="font-display text-xs font-bold text-white/80">
              {lastBits.join(" · ")}
            </p>
          ) : null}
          {showProgress && goalName ? (
            <p
              className={[
                "font-display text-xs font-bold text-white/80",
                lastBits.length > 0 ? "mt-1" : "",
              ].join(" ")}
            >
              {t("club.matchDoorWins", {
                n: toLocaleDigits(wins === Infinity ? 0 : wins, locale),
                name: goalName,
              })}
            </p>
          ) : null}
        </div>
      )}
    </GamePanel>
  );
}
