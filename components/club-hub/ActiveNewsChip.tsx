"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  BOOSTER_DURATION_HOURS,
  formatMultiplier,
  newspaperEventById,
} from "@/lib/boosters/boosters";
import type { ActiveNewsBoosterSnapshot } from "@/lib/club/upgrades";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

type ActiveNewsChipProps = {
  booster: ActiveNewsBoosterSnapshot;
  onExpired?: () => void;
  onOpen?: () => void;
  /** Slim club-chrome strip under daily missions. */
  compact?: boolean;
};

const BOOSTER_DURATION_MS = BOOSTER_DURATION_HOURS * 60 * 60 * 1000;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function BoosterBar({
  remainPct,
  urgent,
}: {
  remainPct: number;
  urgent: boolean;
}) {
  return (
    <div className="relative h-1 bg-black/45" aria-hidden>
      <div
        className={cn(
          "h-full transition-[width] duration-300 ease-out",
          urgent
            ? "bg-linear-to-r from-rose-400 to-orange-300"
            : "bg-linear-to-r from-emerald-400 to-lime-300",
        )}
        style={{ width: `${remainPct}%` }}
      />
    </div>
  );
}

/** Live Newspaper Event timer — cooldown-style booster HUD chip. */
export function ActiveNewsChip({
  booster,
  onExpired,
  onOpen,
  compact = false,
}: ActiveNewsChipProps) {
  const { t, locale } = useTranslation();
  const expiresAt = new Date(booster.expiresAt).getTime();
  // Stay off `Date.now()` until after hydrate — SSR and the first client render
  // must print the same placeholder or React reports a 1s countdown mismatch.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useLayoutEffect(() => {
    const tick = () => {
      const ms = Math.max(0, expiresAt - Date.now());
      setRemainingMs(ms);
      if (ms <= 0) onExpiredRef.current?.();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (remainingMs !== null && remainingMs <= 0) return null;

  const liveMs = remainingMs ?? 0;

  const catalog = newspaperEventById(booster.headline);
  const isCoin = booster.type === "COIN_BOOST";
  const labelKey = isCoin ? "news.activeChipCoin" : "news.activeChipFan";
  const remainPct =
    remainingMs === null
      ? 0
      : Math.min(100, Math.round((liveMs / BOOSTER_DURATION_MS) * 100));
  const urgent = remainingMs !== null && liveMs < 5 * 60_000;
  const eventTitle = catalog
    ? t(`news.events.${catalog.id}`)
    : booster.headline;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("club.dailyNews")}
      className="w-full rounded-bubble-xl animate-status-sheet-rise transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
    >
      {compact ? (
        <GameTile
          tone={isCoin ? "amber" : "sky"}
          className="min-h-11 overflow-hidden"
        >
          <div className="relative flex items-center justify-between gap-2 px-2.5 py-2">
            <span className="flex min-w-0 items-center gap-2 font-display text-xs font-black text-white">
              <GameIconWell
                size="sm"
                amber={isCoin}
                src={isCoin ? "/icons/coin.png" : "/icons/fans.png"}
                className="h-8 w-8"
              />
              <span className="min-w-0 truncate">
                {t(labelKey, { mult: formatMultiplier(booster.multiplier) })}
              </span>
            </span>
            <GameChip
              tone={urgent ? "default" : "amber"}
              className={cn(
                "shrink-0 min-w-14 px-2 py-1 text-center text-[10px] tabular-nums",
                urgent && "bg-rose-500/30 text-rose-100",
              )}
            >
              {remainingMs === null
                ? "\u2014"
                : toLocaleDigits(formatRemaining(liveMs), locale)}
            </GameChip>
          </div>
          <BoosterBar remainPct={remainPct} urgent={urgent} />
        </GameTile>
      ) : (
        <GamePanel tone={isCoin ? "amber" : "sky"} className="min-h-12">
          <div
            className={cn(
              "relative flex items-center justify-between gap-2",
              compact ? "px-2.5 py-2" : "px-3 py-2.5",
            )}
          >
            <span className="flex min-w-0 items-center gap-2 font-display font-black text-white">
              <GameIconWell
                size="sm"
                amber={isCoin}
                src={isCoin ? "/icons/coin.png" : "/icons/fans.png"}
                className={compact ? "h-8 w-8" : "h-9 w-9"}
              />
              <span
                className={cn(
                  "min-w-0 truncate",
                  compact ? "text-xs" : "text-sm",
                )}
              >
                {t(labelKey, { mult: formatMultiplier(booster.multiplier) })}
                {!compact && (
                  <span className="mt-0.5 block truncate font-display text-[10px] font-bold text-white/55">
                    {eventTitle}
                  </span>
                )}
              </span>
            </span>
            <GameChip
              tone={urgent ? "default" : "amber"}
              className={cn(
                "shrink-0 min-w-14 text-center tabular-nums",
                compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs",
                urgent && "bg-rose-500/30 text-rose-100",
              )}
            >
              {remainingMs === null
                ? "\u2014"
                : toLocaleDigits(formatRemaining(liveMs), locale)}
            </GameChip>
          </div>

          <BoosterBar remainPct={remainPct} urgent={urgent} />
        </GamePanel>
      )}
    </button>
  );
}
