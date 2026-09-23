"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AvatarImage } from "@/components/common/AvatarImage";
import { MANAGER_AVATARS, type AvatarKey } from "@/lib/onboarding/avatars";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/economy";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { GameChip } from "@/components/ui/game/GameChip";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

const SCAN_POOL: AvatarKey[] = MANAGER_AVATARS.map((a) => a.key);

/** Fake rival labels shown while scanning the pool (visual only). */
const SCAN_LABELS_EN = [
  "Rival FC",
  "Night Striker",
  "Pitch Ghost",
  "Cup Hunter",
  "Blue Bench",
  "Derby King",
  "Wing Wizard",
  "Last Whistle",
];
const SCAN_LABELS_FA = [
  "رقیب مرموز",
  "مهاجم شب",
  "شبح زمین",
  "شکارچی جام",
  "نیمکت آبی",
  "شاه دربی",
  "جادوگر بال",
  "آخرین سوت",
];

export const MATCHING_MIN_MS = 5_000;

type MatchingSearchProps = {
  yourAvatar: string | null | undefined;
  yourName?: string | null;
  /** True once the server matched a human or bot. */
  found?: boolean;
  foundIsBot?: boolean;
};

/**
 * Matchmaking stage — Arena sheet, radar VS, scanning rivals, stakes.
 * Fills the pitch like DraftPicker (no dead floor).
 */
export function MatchingSearch({
  yourAvatar,
  yourName,
  found = false,
  foundIsBot = false,
}: MatchingSearchProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const labels = locale === "fa" ? SCAN_LABELS_FA : SCAN_LABELS_EN;
  const weeklyXp = DEFAULT_GAME_CONFIG.duel.winWeeklyXp;
  const staminaCost = DEFAULT_GAME_CONFIG.duel.staminaCost;

  const scanKeys = useMemo(() => {
    const keys = [...SCAN_POOL];
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j]!, keys[i]!];
    }
    return keys;
  }, []);

  const [scanIndex, setScanIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (found) return;
    const id = window.setInterval(() => {
      setScanIndex((i) => (i + 1) % scanKeys.length);
    }, 420);
    return () => window.clearInterval(id);
  }, [found, scanKeys.length]);

  useEffect(() => {
    const started = performance.now();
    const id = window.setInterval(() => {
      const ms = performance.now() - started;
      setElapsedSec(Math.floor(ms / 1000));
      setProgress(Math.min(1, ms / MATCHING_MIN_MS));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  const rivalKey = scanKeys[scanIndex] ?? "TACTICAL_COACH";
  const rivalLabel = labels[scanIndex % labels.length]!;
  const ring = 2 * Math.PI * 34;
  const dash = ring * (found ? 1 : progress);

  return (
    <section className="game-sheet relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-bubble-xl">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="game-sheet-wash absolute inset-x-0 top-0 h-36" />
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-sky-500/18 to-transparent" />
        <div className="absolute -inset-s-16 top-1/3 h-44 w-44 rounded-full bg-amber-400/14 blur-3xl" />
        <div className="absolute -inset-e-12 bottom-1/4 h-40 w-40 rounded-full bg-emerald-400/12 blur-3xl" />
        {!reduceMotion &&
          [0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-amber-300/75"
              style={{
                left: `${20 + i * 18}%`,
                top: `${24 + (i % 3) * 16}%`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.25, 0.85, 0.25] }}
              transition={{
                repeat: Infinity,
                duration: 2.1 + i * 0.3,
                delay: i * 0.18,
              }}
            />
          ))}
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2.5 px-3 pb-3 pt-3">
        {/* Compact live header */}
        <header className="shrink-0 text-center">
          <GameChip
            tone={found ? "emerald" : "amber"}
            className="mx-auto uppercase tracking-wide"
          >
            <motion.span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                found ? "bg-emerald-300" : "bg-amber-300",
              )}
              animate={
                reduceMotion
                  ? undefined
                  : found
                    ? { scale: [1, 1.3, 1] }
                    : { opacity: [1, 0.35, 1] }
              }
              transition={{ repeat: Infinity, duration: 0.95 }}
            />
            {found ? t("duel.matchedTitle") : t("duel.matchingBadge")}
          </GameChip>

          <h1 className="mt-2 font-display text-xl font-black leading-tight text-white drop-shadow-md">
            {found ? t("duel.matchedTitle") : t("duel.matchingTitle")}
          </h1>
          <p className="mx-auto mt-1 max-w-[20rem] font-display text-xs font-bold leading-snug text-white/70">
            {found
              ? foundIsBot
                ? t("duel.matchedBot")
                : t("duel.matchedHuman")
              : t("duel.matchingHint")}
          </p>
        </header>

        {/* VS stage grows into leftover pitch */}
        <GamePanel
          tone={found ? "emerald" : "sky"}
          className="flex min-h-0 flex-[1.35] flex-col items-center justify-center gap-3 bg-black/25 p-3"
        >
          <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
            <Fighter
              avatarKey={yourAvatar}
              name={yourName?.trim() || t("duel.you")}
              badge={t("duel.you")}
              ringClass="ring-emerald-400"
              glowClass="bg-emerald-400/30"
              pulse={!reduceMotion}
            />

            <div className="relative flex h-18 w-18 shrink-0 items-center justify-center sm:h-24 sm:w-24">
              <svg
                className="absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 80 80"
                aria-hidden
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={
                    found
                      ? "hsl(var(--arena-ring))"
                      : "hsl(var(--arena-ring-amber))"
                  }
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  initial={false}
                  animate={{ strokeDashoffset: ring - dash }}
                  transition={{ duration: 0.15, ease: "linear" }}
                />
              </svg>
              {!found && !reduceMotion && (
                <>
                  <motion.span
                    className="absolute inset-1 rounded-full shadow-[0_0_0_2px_hsl(var(--arena-ring-amber)/0.45)]"
                    animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      ease: "easeOut",
                    }}
                  />
                  <motion.span
                    className="absolute inset-3 rounded-full border border-dashed border-amber-300/55"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.4,
                      ease: "linear",
                    }}
                  />
                </>
              )}
              <motion.span
                className={cn(
                  "relative z-10 font-display text-xl font-black sm:text-2xl",
                  found ? "text-emerald-300" : "text-amber-300",
                )}
                animate={
                  reduceMotion
                    ? undefined
                    : found
                      ? { scale: [1, 1.2, 1] }
                      : { scale: [1, 1.08, 1] }
                }
                transition={{ repeat: Infinity, duration: found ? 0.75 : 1.1 }}
              >
                VS
              </motion.span>
            </div>

            <div className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="relative h-18 w-18 sm:h-24 sm:w-24">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={found ? "found" : rivalKey}
                    initial={false}
                    animate={{
                      scale: 1,
                      opacity: found ? 1 : 0.92,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className="absolute inset-0"
                  >
                    <span
                      className={cn(
                        "absolute -inset-2 rounded-full blur-lg",
                        found
                          ? foundIsBot
                            ? "bg-amber-400/35"
                            : "bg-sky-400/40"
                          : "bg-white/10",
                      )}
                    />
                    <AvatarImage
                      avatarKey={rivalKey}
                      className={cn(
                        "relative h-full w-full rounded-full shadow-[0_6px_0_0_rgba(0,0,0,0.35)] ring-[3px]",
                        found
                          ? foundIsBot
                            ? "ring-amber-400"
                            : "ring-sky-400"
                          : "ring-white/25",
                      )}
                      muted={!found}
                    />
                    {!found && !reduceMotion && (
                      <motion.span
                        className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-full bg-linear-to-b from-sky-300/50 to-transparent"
                        animate={{ y: [0, 48, 0], opacity: [0.25, 0.8, 0.25] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.05,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    {found && !reduceMotion && (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 0.7 }}
                        animate={{ scale: 1.35, opacity: 0 }}
                        transition={{ duration: 0.65 }}
                        className="absolute inset-0 rounded-full ring-4 ring-emerald-300"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="max-w-22 truncate font-display text-xs font-extrabold text-white/90 sm:text-sm">
                {found
                  ? foundIsBot
                    ? t("duel.vsBot")
                    : t("duel.vsRival")
                  : rivalLabel}
              </p>
            </div>
          </div>

          {!found ? (
            <p className="font-display text-sm font-black tabular-nums text-amber-300">
              {t("duel.matchingTimer", {
                s: toLocaleDigits(elapsedSec, locale),
              })}
            </p>
          ) : (
            <p className="font-display text-sm font-extrabold text-emerald-300">
              {t("duel.matchingKickoff")}
            </p>
          )}
        </GamePanel>

        {/* Scout ticker + stakes fill remaining height */}
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {!found && (
            <GamePanel
              tone="amber"
              className="flex min-h-18 flex-1 flex-col justify-center gap-2 bg-black/30 px-3 py-2.5"
            >
              <p className="text-start font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-100/80">
                {t("duel.matchingScanning")}
              </p>
              <div className="flex justify-center gap-2.5">
                {[-2, -1, 0, 1, 2].map((offset) => {
                  const idx =
                    (scanIndex + offset + scanKeys.length) % scanKeys.length;
                  const key = scanKeys[idx]!;
                  const active = offset === 0;
                  return (
                    <motion.div
                      key={`${key}-${offset}`}
                      animate={{
                        scale: active ? 1.12 : 0.82,
                        opacity: active ? 1 : 0.35,
                        y: active ? -2 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 360, damping: 22 }}
                      className="shrink-0"
                    >
                      <AvatarImage
                        avatarKey={key}
                        className={cn(
                          "h-11 w-11 rounded-full",
                          active
                            ? "ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                            : "ring-1 ring-white/20",
                        )}
                        muted={!active}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </GamePanel>
          )}

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <StakeChip
              icon="/icons/xp.png"
              label={t("duel.matchingStakeXp", {
                n: toLocaleDigits(weeklyXp, locale),
              })}
              highlight
            />
            <StakeChip
              icon="/icons/energy.png"
              label={t("duel.matchingStakeEnergy", {
                n: toLocaleDigits(staminaCost, locale),
              })}
            />
            <StakeChip
              icon="/icons/trophy.png"
              label={t("duel.matchingStakeGlory")}
            />
          </div>
        </div>

        <p className="shrink-0 text-center font-display text-[11px] font-bold leading-snug text-white/55">
          {t("duel.summaryAutoRefresh")}
        </p>
      </div>
    </section>
  );
}

function Fighter({
  avatarKey,
  name,
  badge,
  ringClass,
  glowClass,
  pulse,
}: {
  avatarKey: string | null | undefined;
  name: string;
  badge: string;
  ringClass: string;
  glowClass: string;
  pulse: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <div className="relative">
        {pulse && (
          <motion.span
            className={cn("absolute -inset-2 rounded-full blur-lg", glowClass)}
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ repeat: Infinity, duration: 1.55 }}
          />
        )}
        <AvatarImage
          avatarKey={avatarKey}
          className={cn(
            "relative h-18 w-18 rounded-full shadow-[0_6px_0_0_rgba(0,0,0,0.35)] ring-[3px] sm:h-24 sm:w-24",
            ringClass,
          )}
        />
        <span className="absolute -bottom-1 inset-s-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 font-display text-[9px] font-black text-white shadow-md">
          {badge}
        </span>
      </div>
      <p className="mt-1 max-w-22 truncate font-display text-xs font-extrabold text-white sm:text-sm">
        {name}
      </p>
    </div>
  );
}

function StakeChip({
  icon,
  label,
  highlight = false,
}: {
  icon: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <GameChip
      tone={highlight ? "amber" : "default"}
      className="min-h-9 gap-1.5 px-2.5 py-1.5 text-[11px] font-extrabold"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        draggable={false}
        className="h-4 w-4 object-contain"
      />
      {label}
    </GameChip>
  );
}
