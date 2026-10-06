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
 * Matchmaking stage — one VS face-off, compact scout strip, stakes.
 * Centered pitch; no stretched empty panels.
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
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-sky-500/16 to-transparent" />
        <div className="absolute -inset-s-16 top-1/3 h-40 w-40 rounded-full bg-amber-400/12 blur-3xl" />
        <div className="absolute -inset-e-12 bottom-1/4 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-3 px-3 py-3">
        {/* Header — one job: status */}
        <header className="shrink-0 text-center">
          <GameChip
            tone={found ? "emerald" : "amber"}
            className="mx-auto tracking-wide"
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
            {found ? t("duel.matchedBadge") : t("duel.matchingBadge")}
          </GameChip>

          <h1 className="mt-2.5 font-display text-xl font-black leading-tight text-white">
            {found ? t("duel.matchedTitle") : t("duel.matchingTitle")}
          </h1>
          <p className="mx-auto mt-1 max-w-76 font-display text-xs font-bold leading-snug text-white/65">
            {found
              ? foundIsBot
                ? t("duel.matchedBot")
                : t("duel.matchedHuman")
              : t("duel.matchingHint")}
          </p>
        </header>

        {/* Face-off — tight, not a tall empty card */}
        <GamePanel
          tone={found ? "emerald" : "sky"}
          className="mx-auto w-full max-w-sm shrink-0 bg-black/25 px-3 py-3.5"
        >
          <div className="flex w-full items-start justify-center gap-2">
            <Fighter
              avatarKey={yourAvatar}
              name={yourName?.trim() || t("duel.you")}
              badge={t("duel.you")}
              ringClass="ring-emerald-400"
              glowClass="bg-emerald-400/30"
              pulse={!reduceMotion && !found}
            />

            <div className="flex shrink-0 flex-col items-center gap-1.5 pt-1">
              <div className="relative flex h-16 w-16 items-center justify-center">
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
                {!found && !reduceMotion ? (
                  <motion.span
                    className="absolute inset-2 rounded-full border border-dashed border-amber-300/50"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.4,
                      ease: "linear",
                    }}
                  />
                ) : null}
                <motion.span
                  className={cn(
                    "relative z-10 font-display text-lg font-black",
                    found ? "text-emerald-300" : "text-amber-300",
                  )}
                  animate={
                    reduceMotion
                      ? undefined
                      : found
                        ? { scale: [1, 1.15, 1] }
                        : { scale: [1, 1.06, 1] }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: found ? 0.75 : 1.1,
                  }}
                >
                  VS
                </motion.span>
              </div>

              {!found ? (
                <p className="font-display text-[11px] font-black tabular-nums text-amber-200">
                  {t("duel.matchingTimer", {
                    s: toLocaleDigits(elapsedSec, locale),
                  })}
                </p>
              ) : (
                <p className="font-display text-[11px] font-extrabold text-emerald-300">
                  {t("duel.matchingKickoff")}
                </p>
              )}
            </div>

            <div className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="relative h-16 w-16">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={found ? "found" : rivalKey}
                    initial={
                      reduceMotion ? false : { opacity: 0.4, scale: 0.92 }
                    }
                    animate={{
                      scale: 1,
                      opacity: found ? 1 : 0.95,
                    }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    className="absolute inset-0"
                  >
                    <span
                      className={cn(
                        "absolute -inset-1.5 rounded-full blur-md",
                        found
                          ? foundIsBot
                            ? "bg-amber-400/35"
                            : "bg-sky-400/40"
                          : "bg-white/8",
                      )}
                    />
                    <AvatarImage
                      avatarKey={rivalKey}
                      className={cn(
                        "relative h-full w-full rounded-full shadow-[0_4px_0_0_rgba(0,0,0,0.35)] ring-[3px]",
                        found
                          ? foundIsBot
                            ? "ring-amber-400"
                            : "ring-sky-400"
                          : "ring-white/25",
                      )}
                      muted={!found}
                    />
                    {found && !reduceMotion ? (
                      <motion.span
                        initial={{ scale: 0.7, opacity: 0.7 }}
                        animate={{ scale: 1.35, opacity: 0 }}
                        transition={{ duration: 0.65 }}
                        className="absolute inset-0 rounded-full ring-4 ring-emerald-300"
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="max-w-22 truncate text-center font-display text-xs font-extrabold text-white/90">
                {found
                  ? foundIsBot
                    ? t("duel.vsBot")
                    : t("duel.vsRival")
                  : rivalLabel}
              </p>
            </div>
          </div>

          {/* Scout strip — inside the same panel, not a second tall card */}
          {!found ? (
            <div className="mt-3 border-t border-white/8 pt-2.5">
              <p className="mb-2 text-center font-display text-[10px] font-extrabold tracking-wide text-amber-100/70">
                {t("duel.matchingScanning")}
              </p>
              <div className="flex items-center justify-center gap-2">
                {[-2, -1, 0, 1, 2].map((offset) => {
                  const idx =
                    (scanIndex + offset + scanKeys.length) % scanKeys.length;
                  const key = scanKeys[idx]!;
                  const active = offset === 0;
                  return (
                    <motion.div
                      key={`${key}-${offset}`}
                      animate={{
                        scale: active ? 1.1 : 0.85,
                        opacity: active ? 1 : 0.32,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 24,
                      }}
                      className="shrink-0"
                    >
                      <AvatarImage
                        avatarKey={key}
                        className={cn(
                          "h-9 w-9 rounded-full",
                          active
                            ? "shadow-[0_2px_0_0_rgba(0,0,0,0.35)] ring-2 ring-amber-300"
                            : "ring-1 ring-white/15",
                        )}
                        muted={!active}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </GamePanel>

        {/* Stakes — one row, no nested panel */}
        <div className="mx-auto flex w-full max-w-sm flex-wrap items-center justify-center gap-1.5">
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

        <p className="shrink-0 text-center font-display text-[11px] font-bold leading-snug text-white/45">
          {t("duel.matchingWaitNote")}
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
        {pulse ? (
          <motion.span
            className={cn("absolute -inset-2 rounded-full blur-lg", glowClass)}
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ repeat: Infinity, duration: 1.55 }}
          />
        ) : null}
        <AvatarImage
          avatarKey={avatarKey}
          className={cn(
            "relative h-16 w-16 rounded-full shadow-[0_4px_0_0_rgba(0,0,0,0.35)] ring-[3px]",
            ringClass,
          )}
        />
        <span className="absolute -bottom-1 inset-s-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 font-display text-[9px] font-black text-white shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
          {badge}
        </span>
      </div>
      <p className="mt-0.5 max-w-22 truncate text-center font-display text-xs font-extrabold text-white">
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
