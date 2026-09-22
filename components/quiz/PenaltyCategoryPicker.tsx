"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { DuelCategoryOption } from "@/lib/duel/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";
import { cn } from "@/lib/utils";

type PenaltyCategoryPickerProps = {
  categories: DuelCategoryOption[];
  /** Live-Ops kick count shown on chips. */
  questionCount: number;
  /** Stamina spent on kickoff (default 1). */
  staminaCost?: number;
  /**
   * Personal bests keyed by categoryId — goals + whether they ever
   * finished a perfect shootout in that bank.
   */
  records?: Record<string, { bestGoals: number; hasPerfect: boolean }>;
};

/**
 * Penalty lobby — Random is the hero CTA; categories are a secondary deck.
 */
export function PenaltyCategoryPicker({
  categories,
  questionCount,
  staminaCost = 1,
  records = {},
}: PenaltyCategoryPickerProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Richest banks first — World Cup shouldn't sit under empty stubs.
  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => b.questionCount - a.questionCount),
    [categories],
  );

  function go(href: string, key: string) {
    if (pending) return;
    haptic(HAPTIC.tap);
    playSound("click");
    setPendingKey(key);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <section className="flex flex-1 flex-col gap-4 pb-4">
      {/* ── Match brief ─────────────────────────────────────────── */}
      <GamePanel tone="amber" className="overflow-hidden p-3.5 text-start">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-10 -top-12 h-36 w-36 rounded-full bg-amber-300/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -start-8 bottom-0 h-24 w-24 rounded-full bg-emerald-400/15 blur-3xl"
        />

        <div className="relative flex items-start gap-3">
          <GameIconWell
            size="lg"
            amber
            src="/icons/nav-ball.png"
            className="h-14 w-14"
            iconClassName="h-9 w-9"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-amber-200/90">
              {t("quiz.penaltyPick.eyebrow")}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-black leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
              {t("quiz.penaltyPick.title")}
            </h1>
            <p className="mt-1.5 font-display text-sm font-bold text-white/70">
              {t("quiz.penaltyPick.hint")}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <GameChip tone="amber" className="gap-1 tabular-nums">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/target.png"
                  alt=""
                  draggable={false}
                  className="h-3.5 w-3.5 object-contain"
                />
                {t("quiz.penaltyPick.chipKicks", {
                  n: toLocaleDigits(questionCount, locale),
                })}
              </GameChip>
              <GameChip className="gap-1 tabular-nums">
                <ResourceIcon kind="energy" size="sm" className="h-3.5 w-3.5" />
                {t("quiz.penaltyPick.chipEnergy", {
                  n: toLocaleDigits(staminaCost, locale),
                })}
              </GameChip>
            </div>
          </div>
        </div>
      </GamePanel>

      {/* ── Hero: Random mix ────────────────────────────────────── */}
      <motion.div
        initial={reduceMotion ? false : { y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        <GamePanel
          tone="emerald"
          className={cn(
            "p-3.5",
            pendingKey === "random" && "ring-2 ring-arena-amber",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -end-8 -top-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl"
          />

          <div className="relative flex items-start gap-3">
            <GameIconWell
              size="lg"
              src="/icons/target.png"
              className="h-14 w-14"
              iconClassName="h-9 w-9"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                  {t("quiz.penaltyPick.randomTitle")}
                </h2>
                <GameChip tone="amber" className="text-[10px] uppercase tracking-wide">
                  {t("quiz.penaltyPick.randomBadge")}
                </GameChip>
              </div>
              <p className="mt-1 font-display text-sm font-bold text-white/70">
                {t("quiz.penaltyPick.randomBlurb")}
              </p>
            </div>
          </div>

          <GameCta
            variant="accent"
            block
            disabled={pending}
            className="relative mt-3.5 text-base"
            onClick={() => go("/play/penalty?random=1", "random")}
          >
            {pendingKey === "random"
              ? t("quiz.penaltyPick.starting")
              : t("quiz.penaltyPick.randomCta")}
          </GameCta>
        </GamePanel>
      </motion.div>

      {/* ── Category deck ───────────────────────────────────────── */}
      {sorted.length > 0 && (
        <div className="hub-deck flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <h2 className="font-display text-xs font-black text-arena-muted">
              {t("quiz.penaltyPick.orCategory")}
            </h2>
            <span className="font-display text-[11px] font-bold tabular-nums text-arena-muted/80">
              {t("quiz.penaltyPick.categoryCount", {
                n: toLocaleDigits(sorted.length, locale),
              })}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {sorted.map((c, i) => {
              const name = locale === "fa" ? c.nameFa : c.nameEn;
              const busy = pending && pendingKey === c.id;
              const spot = toLocaleDigits(i + 1, locale);
              const rec = records[c.id];
              const best = rec?.bestGoals ?? 0;
              const hasPerfect = rec?.hasPerfect ?? false;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  disabled={pending}
                  initial={reduceMotion ? false : { y: 12, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: pending && !busy ? 0.45 : 1,
                  }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.05 + i * 0.035,
                    type: "spring",
                    stiffness: 300,
                    damping: 22,
                  }}
                  whileTap={pending ? undefined : { scale: 0.985 }}
                  onClick={() =>
                    go(
                      `/play/penalty?category=${encodeURIComponent(c.id)}`,
                      c.id,
                    )
                  }
                  className="text-start disabled:cursor-wait"
                >
                  <GameTile
                    className={cn(
                      "flex min-h-[3.75rem] items-center gap-3 bg-arena/90 px-3 py-2.5 text-white shadow-arena-ring",
                      busy && "ring-2 ring-arena-amber",
                      hasPerfect && "ring-1 ring-emerald-400/50",
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 font-display text-sm font-black text-emerald-100 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]"
                    >
                      {spot}
                    </span>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      {c.icon || "⚽"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-black text-white">
                        {busy ? t("quiz.penaltyPick.starting") : name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <GameChip className="tabular-nums">
                          {t("quiz.penaltyPick.questions", {
                            n: toLocaleDigits(c.questionCount, locale),
                          })}
                        </GameChip>
                        {best > 0 ? (
                          <GameChip
                            tone="amber"
                            className="gap-1 tabular-nums"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/icons/trophy.png"
                              alt=""
                              draggable={false}
                              className="h-3 w-3 object-contain"
                            />
                            {t("quiz.penaltyPick.yourBest", {
                              goals: toLocaleDigits(best, locale),
                              total: toLocaleDigits(questionCount, locale),
                            })}
                          </GameChip>
                        ) : null}
                        {hasPerfect ? (
                          <GameChip
                            tone="emerald"
                            className="gap-1 tabular-nums"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/icons/target.png"
                              alt=""
                              draggable={false}
                              className="h-3 w-3 object-contain"
                            />
                            {t("quiz.penaltyPick.perfected")}
                          </GameChip>
                        ) : null}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 font-display text-lg font-black text-white/70 ring-1 ring-white/15"
                    >
                      {locale === "fa" ? "‹" : "›"}
                    </span>
                  </GameTile>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <GamePanel tone="emerald" className="px-3.5 py-3 text-center">
          <p className="font-display text-sm font-bold text-white/70">
            {t("quiz.penaltyPick.noCategories")}
          </p>
        </GamePanel>
      )}

      <GameCta
        variant="ghost"
        className="mx-auto mt-1 min-h-11 px-6"
        onClick={() => {
          playSound("click");
          haptic(HAPTIC.tap);
          router.push("/play");
        }}
      >
        {t("quiz.penaltyPick.backPlay")}
      </GameCta>
    </section>
  );
}
