"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { buyStaminaRefill, type ShopErrorCode } from "@/actions/shop";
import type { ClubSnapshot } from "@/lib/club/upgrades";
import { staminaRegenIntervalMs } from "@/lib/club/stamina";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { GameCta } from "@/components/ui/game/GameCta";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";
import { cn } from "@/lib/utils";

type StatusBarProps = {
  coins: number;
  stamina: number;
  maxStamina: number;
  msUntilNext: number;
  /** Medical bay level — drives the local +1 tick interval. */
  medicalLevel: number;
  staminaRefillCost: number;
  onClubUpdate?: (club: ClubSnapshot) => void;
};

function formatMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Consumables only — coins + stamina. Fans live on the Stadium hero. */
export function StatusBar({
  coins,
  stamina,
  maxStamina,
  msUntilNext,
  medicalLevel,
  staminaRefillCost,
  onClubUpdate,
}: StatusBarProps) {
  const { t, locale } = useTranslation();
  const prevCoins = useRef(coins);
  const [pulse, setPulse] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const regenIntervalMs = staminaRegenIntervalMs(medicalLevel);

  useEffect(() => {
    if (coins > prevCoins.current) {
      setPulse(true);
      const timer = window.setTimeout(() => setPulse(false), 700);
      prevCoins.current = coins;
      return () => window.clearTimeout(timer);
    }
    prevCoins.current = coins;
  }, [coins]);

  const [localStamina, setLocalStamina] = useState(stamina);
  const [remainingMs, setRemainingMs] = useState(msUntilNext);
  const remainingRef = useRef(msUntilNext);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setLocalStamina(stamina);
      setRemainingMs(msUntilNext);
      remainingRef.current = msUntilNext;
    });
    return () => window.cancelAnimationFrame(id);
  }, [stamina, maxStamina, msUntilNext, medicalLevel]);

  useEffect(() => {
    if (localStamina >= maxStamina) return;
    const id = window.setInterval(() => {
      remainingRef.current -= 1000;
      if (remainingRef.current <= 0) {
        setLocalStamina((s) => Math.min(maxStamina, s + 1));
        remainingRef.current = regenIntervalMs;
      }
      setRemainingMs(remainingRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [localStamina, maxStamina, regenIntervalMs]);

  const regenerating = localStamina < maxStamina;
  const staminaLow = localStamina <= 1;
  const staminaFull = localStamina >= maxStamina;

  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, pending]);

  function errorMessage(code: ShopErrorCode): string {
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

  function openRefill() {
    playSound("click");
    if (staminaFull) {
      toast.message(t("status.staminaAlreadyFull"));
      return;
    }
    setConfirmOpen(true);
  }

  function confirmRefill() {
    if (pending) return;
    startTransition(async () => {
      const result = await buyStaminaRefill();
      if (result.ok) {
        onClubUpdate?.(result.club);
        setConfirmOpen(false);
        playSound("upgrade");
        haptic(HAPTIC.tap);
        toast.success(t("status.staminaRefilled"));
      } else {
        haptic(HAPTIC.light);
        toast.error(errorMessage(result.code));
        if (result.code === "already_full") setConfirmOpen(false);
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div
          id="coin-balance-target"
          className={cn(pulse && "animate-status-coin-pulse")}
        >
          <Link
            href="/shop?tab=coins"
            aria-label={t("status.buyCoins")}
            onClick={() => playSound("click")}
            className="block rounded-bubble-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <GameTile
              tone="amber"
              className="flex min-h-touch items-center gap-2 px-2.5 py-1.5 active:translate-y-px"
            >
              <ResourceIcon kind="coin" size="md" priority />
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-[10px] font-bold leading-none text-amber-200/80">
                  {t("status.coins")}
                </span>
                <span className="font-display text-base font-black tabular-nums text-amber-100">
                  {toLocaleDigits(coins, locale)}
                </span>
              </span>
            </GameTile>
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            aria-label={t("status.refillStamina")}
            onClick={openRefill}
            className="block w-full rounded-bubble-xl text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <GameTile
              tone={staminaLow ? "rose" : "sky"}
              className="flex min-h-touch w-full items-center gap-2 px-2.5 py-1.5 active:translate-y-px"
            >
              <ResourceIcon kind="energy" size="md" priority />
              <span className="flex min-w-0 flex-col">
                <span
                  className={[
                    "font-display text-[10px] font-bold leading-none",
                    staminaLow ? "text-rose-200/80" : "text-sky-200/80",
                  ].join(" ")}
                >
                  {t("status.stamina")}
                </span>
                <span
                  className={[
                    "font-display text-base font-black tabular-nums",
                    staminaLow ? "text-rose-100" : "text-sky-100",
                  ].join(" ")}
                >
                  {toLocaleDigits(localStamina, locale)}/
                  {toLocaleDigits(maxStamina, locale)}
                </span>
              </span>
            </GameTile>
          </button>
          {regenerating && (
            <span className="px-1 text-end font-display text-[10px] font-bold tabular-nums text-white/70">
              {t("status.plusOneIn", {
                time: toLocaleDigits(formatMMSS(remainingMs), locale),
              })}
            </span>
          )}
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-70 flex items-end justify-center bg-black/60 p-4 animate-status-sheet-fade sm:items-center"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stamina-refill-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm animate-status-sheet-rise"
          >
            <GamePanel tone="sky" className="p-5">
              <div className="relative mb-3 flex justify-center" aria-hidden>
                <ResourceIcon kind="energy" size="lg" className="h-12 w-12" />
              </div>
              <h2
                id="stamina-refill-title"
                className="relative text-center font-display text-xl font-black text-white"
              >
                {t("status.refillTitle")}
              </h2>
              <p className="relative mt-2 text-center font-display text-sm font-bold text-white/65">
                {t("status.refillBody", {
                  cost: toLocaleDigits(staminaRefillCost, locale),
                })}
              </p>
              <div className="relative mt-5 grid grid-cols-2 gap-2">
                <GameCta
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setConfirmOpen(false)}
                >
                  {t("common.close")}
                </GameCta>
                <GameCta
                  variant="accent"
                  disabled={pending || coins < staminaRefillCost}
                  onClick={confirmRefill}
                  className="flex-col gap-0.5"
                >
                  {pending ? (
                    "…"
                  ) : (
                    <>
                      <span>{t("status.refillConfirm")}</span>
                      <span className="flex items-center gap-1 text-xs opacity-95">
                        <ResourceIcon kind="coin" size="sm" />
                        {toLocaleDigits(staminaRefillCost, locale)}
                      </span>
                    </>
                  )}
                </GameCta>
              </div>
            </GamePanel>
          </div>
        </div>
      )}
    </>
  );
}
