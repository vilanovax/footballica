"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { GotdRewardsPayload } from "@/lib/game/gotdRewards";
import type { UnlockedBadge } from "@/actions/resolveMatch";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";

/** Stable default — avoid `= []` recreating referential identity each render. */
const EMPTY_BADGES: UnlockedBadge[] = [];

type Props = {
  open: boolean;
  outcome: "SOLVED" | "FAILED";
  kind: "mystery" | "grid" | "starPath" | "memory";
  rewards: GotdRewardsPayload | null;
  /** Streak before hard-reset on loss. */
  previousStreak?: number;
  currentStreak?: number;
  shareCode?: string | null;
  unlockedBadges?: UnlockedBadge[];
  onShare?: () => void;
  onClose?: () => void;
  playHref?: string;
};

/**
 * Premium GotD post-game overlay — win reward breakdown or streak-broken loss.
 */
export function GotdResultModal({
  open,
  outcome,
  kind,
  rewards,
  previousStreak = 0,
  currentStreak = 0,
  shareCode,
  unlockedBadges = EMPTY_BADGES,
  onShare,
  onClose,
  playHref = "/play",
}: Props) {
  const { t, locale } = useTranslation();
  const win = outcome === "SOLVED";
  const streakBroken = !win && previousStreak > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-80 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={t("common.back")}
            className="absolute inset-0 bg-black/75 backdrop-blur-[6px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gotd-result-title"
            initial={{ y: 48, opacity: 0.9, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative z-10 mx-4 mb-[max(1rem,env(safe-area-inset-bottom))] w-full max-w-sm sm:mb-0"
          >
            <GamePanel
              tone={win ? "amber" : "rose"}
              className="overflow-hidden p-5"
            >
              <div
                aria-hidden
                className={[
                  "pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent",
                  win ? "from-amber-400/15" : "from-rose-500/15",
                ].join(" ")}
              />

              <GameIconWell
                size="lg"
                amber={win}
                src={win ? "/icons/coin.png" : "/icons/broken-heart.png"}
                className="relative mx-auto"
              />

              <h2
                id="gotd-result-title"
                className="relative mt-3 text-center font-display text-xl font-black text-white"
              >
                {win
                  ? t("gotd.winTitle")
                  : streakBroken
                    ? t("gotd.streakBrokenTitle")
                    : t("gotd.loseTitle")}
              </h2>
              <p className="relative mt-1 text-center font-display text-sm font-bold text-white/70">
                {win
                  ? t(
                      kind === "mystery"
                        ? "gotd.winBodyMystery"
                        : kind === "grid"
                          ? "gotd.winBodyGrid"
                          : kind === "memory"
                            ? "gotd.winBodyMemory"
                            : "gotd.winBodyStarPath",
                    )
                  : streakBroken
                    ? t("gotd.streakBrokenBody", {
                        n: toLocaleDigits(previousStreak, locale),
                      })
                    : t("gotd.loseBody")}
              </p>

              {win && rewards && (
                <GameTile
                  tone="amber"
                  className="relative mt-4 space-y-2 px-3 py-3 text-start"
                >
                  <RewardLine
                    label={t("gotd.baseCoins")}
                    value={`+${toLocaleDigits(rewards.baseCoins, locale)}`}
                    gold
                  />
                  {rewards.streakBonus > 0 && (
                    <RewardLine
                      label={t("gotd.streakBonus", {
                        n: toLocaleDigits(rewards.streakDays, locale),
                        pct: toLocaleDigits(
                          Math.round(rewards.streakMultiplierPerDay * 100),
                          locale,
                        ),
                      })}
                      value={`+${toLocaleDigits(rewards.streakBonus, locale)}`}
                      gold
                    />
                  )}
                  {rewards.perfectBonus > 0 && (
                    <RewardLine
                      label={t("gotd.perfectBonus")}
                      value={`+${toLocaleDigits(rewards.perfectBonus, locale)}`}
                      gold
                    />
                  )}
                  <div className="border-t border-white/10 pt-2">
                    <RewardLine
                      label={t("gotd.totalCoins")}
                      value={`+${toLocaleDigits(rewards.coinsEarned, locale)}`}
                      gold
                      bold
                    />
                    <RewardLine
                      label={t("gotd.totalXp")}
                      value={`+${toLocaleDigits(rewards.xpEarned, locale)}`}
                      bold
                    />
                  </div>
                  {currentStreak > 0 && (
                    <div className="flex justify-center pt-1">
                      <GameChip tone="amber" className="gap-1.5 px-2.5 py-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/icons/streak.png"
                          alt=""
                          aria-hidden
                          className="h-3.5 w-3.5 object-contain"
                        />
                        {t("gotd.streakNow", {
                          n: toLocaleDigits(currentStreak, locale),
                        })}
                      </GameChip>
                    </div>
                  )}
                </GameTile>
              )}

              {win && unlockedBadges.length > 0 && (
                <div className="relative mt-3 flex flex-wrap justify-center gap-2">
                  {unlockedBadges.map((b) => (
                    <GameChip
                      key={b.slug}
                      tone="amber"
                      className="gap-1 px-2.5 py-1 text-[11px]"
                    >
                      {b.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.imageUrl}
                          alt=""
                          className="h-3.5 w-3.5 object-contain"
                        />
                      ) : (
                        <span aria-hidden>{b.emoji}</span>
                      )}
                      {locale === "fa" ? b.nameFa : b.nameEn}
                    </GameChip>
                  ))}
                </div>
              )}

              {shareCode ? (
                <pre className="relative mt-4 rounded-2xl bg-black/35 px-3 py-3 text-center font-display text-base leading-relaxed text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
                  {shareCode}
                </pre>
              ) : null}

              <div className="relative mt-4 flex flex-col gap-2">
                {onShare && shareCode ? (
                  <GameCta
                    variant="ghost"
                    block
                    onClick={() => {
                      playSound("click");
                      onShare();
                    }}
                  >
                    {t("gotd.share")}
                  </GameCta>
                ) : null}
                <Link
                  href={playHref}
                  onClick={() => playSound("click")}
                  className={[
                    "game-cta flex w-full min-h-14 items-center justify-center",
                    win ? "game-cta-accent" : "game-cta-danger",
                  ].join(" ")}
                >
                  {t("gotd.backPlay")}
                </Link>
              </div>
            </GamePanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RewardLine({
  label,
  value,
  gold,
  bold,
}: {
  label: string;
  value: string;
  gold?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={[
          "font-display text-xs font-bold text-white/70",
          bold ? "text-sm text-white/90" : "",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "font-display text-sm font-black tabular-nums",
          gold ? "text-amber-300" : "text-sky-200",
          bold ? "text-base" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
