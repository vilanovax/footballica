"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  nextMilestone,
  winsAway,
  type MilestoneInput,
} from "@/lib/club/milestones";
import { staminaRegenIntervalMs } from "@/lib/club/stamina";
import type { ClubSnapshot } from "@/lib/club/upgrades";
import { buyStaminaRefill, type ShopErrorCode } from "@/actions/shop";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { LastMatchLine } from "@/lib/club/lastMatch";
import { toast } from "sonner";

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
  coins: number;
  staminaRefillCost: number;
  onClubUpdate: (club: ClubSnapshot) => void;
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
  coins,
  staminaRefillCost,
  onClubUpdate,
  lastMatch = null,
}: MatchDoorProps) {
  const { t, locale } = useTranslation();
  const regenIntervalMs = staminaRegenIntervalMs(medicalLevel);
  const [localStamina, setLocalStamina] = useState(stamina);
  const [remainingMs, setRemainingMs] = useState(msUntilNext);
  const remainingRef = useRef(msUntilNext);
  const [refillOpen, setRefillOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
  const canAffordRefill = coins >= staminaRefillCost;
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

  function refillError(code: ShopErrorCode): string {
    switch (code) {
      case "insufficient":
        return t("shop.errInsufficient");
      case "already_full":
        return t("status.staminaAlreadyFull");
      case "rate_limited":
        return t("shop.errRateLimited");
      default:
        return t("shop.errGeneric");
    }
  }

  function confirmRefill() {
    if (pending) return;
    startTransition(async () => {
      const result = await buyStaminaRefill();
      if (result.ok) {
        onClubUpdate(result.club);
        setRefillOpen(false);
        playSound("upgrade");
        haptic(HAPTIC.tap);
        toast.success(t("status.staminaRefilled"));
      } else {
        haptic(HAPTIC.light);
        toast.error(refillError(result.code));
        if (result.code === "already_full") setRefillOpen(false);
      }
    });
  }

  return (
    <>
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
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.tap);
              setRefillOpen(true);
            }}
            className="game-cta game-cta-accent mt-3 flex min-h-14 w-full items-center justify-center font-display text-base font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            {t("club.matchDoorRefill")}
          </button>
        )}

        <p className="mt-2 text-center font-display text-[11px] font-bold text-white/70">
          {canPlay
            ? t("club.matchDoorEnergy", {
                n: toLocaleDigits(staminaCost, locale),
              })
            : t("club.matchDoorEmpty")}
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

      <BottomSheet
        open={refillOpen}
        onClose={() => setRefillOpen(false)}
        title={t("club.matchDoorRefill")}
        subtitle={t("club.matchDoorRefillHint", {
          n: toLocaleDigits(staminaRefillCost, locale),
        })}
        closeLabel={t("common.close")}
        tone="dark"
      >
        <div className="flex flex-col gap-3">
          <p className="text-center font-display text-sm font-bold text-white/75">
            {t("club.matchDoorEmpty")}
            {remainingMs > 0
              ? ` · ${t("club.matchDoorRegen", {
                  time: toLocaleDigits(formatMMSS(remainingMs), locale),
                })}`
              : ""}
          </p>
          <button
            type="button"
            disabled={pending || !canAffordRefill}
            onClick={confirmRefill}
            className="game-cta game-cta-accent flex min-h-14 w-full items-center justify-center gap-2 font-display text-base font-black disabled:opacity-50"
          >
            {t("status.refillStamina")}
            <span className="inline-flex items-center gap-1 tabular-nums">
              <ResourceIcon kind="coin" size="sm" />
              {toLocaleDigits(staminaRefillCost, locale)}
            </span>
          </button>
          {!canAffordRefill ? (
            <Link
              href="/shop?tab=coins"
              onClick={() => playSound("click")}
              className="flex min-h-11 items-center justify-center font-display text-sm font-black text-amber-200 underline-offset-2 hover:underline"
            >
              {t("status.buyCoins")}
            </Link>
          ) : null}
        </div>
      </BottomSheet>
    </>
  );
}
