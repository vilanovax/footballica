"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  PremiumChallenges,
  type PlayChallengeCard,
} from "@/components/play/PremiumChallenges";
import { TrophyShowcase } from "@/components/survival/TrophyShowcase";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

type SurvivalLobbyProps = {
  challenges: PlayChallengeCard[];
  coins: number;
  survivalBest: number;
};

/**
 * Survival hub — one clear main run, then optional paid challenges.
 */
export function SurvivalLobby({
  challenges,
  coins,
  survivalBest,
}: SurvivalLobbyProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const liveCount = challenges.length;
  const hasRecord = survivalBest > 0;

  return (
    <section className="flex flex-1 flex-col gap-3.5 pb-4">
      {/* ── What is Survival ─────────────────────────────────────── */}
      <GamePanel tone="rose" className="relative overflow-hidden p-3.5 text-start">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-e-12 -top-10 h-36 w-36 rounded-full bg-rose-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-s-10 bottom-0 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl"
        />

        <div className="relative flex items-start gap-3">
          <Link
            href="/play"
            aria-label={t("survival.backPlay")}
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.tap);
            }}
            className="order-last shrink-0 transition-transform active:scale-90"
          >
            <GameIconWell size="md" src="/icons/close.png" />
          </Link>
          <GameIconWell
            size="lg"
            src="/icons/heart.png"
            className="h-14 w-14"
            iconClassName="h-8 w-8"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-bold text-rose-200/85">
              {t("survival.eyebrow")}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
              {t("survival.lobbyTitle")}
            </h1>
          </div>
        </div>

        <p className="relative mt-3 font-display text-sm font-bold leading-snug text-white/90">
          {t("survival.lobbyHook")}
        </p>

        <div
          className="relative mt-3 flex items-center justify-center gap-2"
          dir="ltr"
          aria-label={t("survival.howHeartsTitle")}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 18,
                delay: 0.08 + i * 0.07,
              }}
            >
              <GameIconWell
                size="md"
                src="/icons/heart.png"
                className="h-12 w-12"
                iconClassName="h-7 w-7"
              />
            </motion.div>
          ))}
        </div>
        <p className="relative mt-2 text-center font-display text-xs font-bold text-rose-100/90">
          {t("survival.ruleLine")}
        </p>
        <p className="relative mt-1 text-center font-display text-[11px] font-bold text-white/55">
          {t("survival.scoreLine")}
        </p>
      </GamePanel>

      {/* ── Main path: classic run ───────────────────────────────── */}
      <GamePanel tone="amber" className="relative p-3.5 text-start">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-s-8 bottom-0 h-24 w-24 rounded-full bg-amber-300/25 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <GameIconWell
            size="md"
            amber
            src="/icons/nav-ball.png"
            className="h-12 w-12"
            iconClassName="h-7 w-7"
          />
          <div className="min-w-0 flex-1">
            <GameChip tone="amber" className="mb-1">
              {t("survival.classicBadge")}
            </GameChip>
            <h2 className="font-display text-lg font-black text-white">
              {t("survival.classicTitle")}
            </h2>
            <p className="mt-0.5 font-display text-xs font-bold leading-snug text-white/70">
              {t("survival.classicSub")}
            </p>
          </div>
        </div>

        <ol className="relative mt-3 space-y-1.5 rounded-2xl bg-black/25 px-3 py-2.5 font-display text-xs font-bold text-white/80 ring-1 ring-white/10">
          <li className="flex gap-2">
            <span className="tabular-nums text-amber-200">۱.</span>
            <span>{t("survival.stepPick")}</span>
          </li>
          <li className="flex gap-2">
            <span className="tabular-nums text-amber-200">۲.</span>
            <span>{t("survival.stepPlay")}</span>
          </li>
          <li className="flex gap-2">
            <span className="tabular-nums text-amber-200">۳.</span>
            <span>{t("survival.stepRecord")}</span>
          </li>
        </ol>

        <div className="relative mt-3 flex flex-wrap gap-1.5">
          <GameChip className="gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/heart.png"
              alt=""
              draggable={false}
              className="h-3.5 w-3.5 object-contain"
            />
            {t("survival.chipHearts", { n: toLocaleDigits(3, locale) })}
          </GameChip>
          <GameChip className="gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/energy.png"
              alt=""
              draggable={false}
              className="h-3.5 w-3.5 object-contain"
            />
            {t("survival.chipEnergy", { n: toLocaleDigits(1, locale) })}
          </GameChip>
          <GameChip tone={hasRecord ? "amber" : "default"} className="gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/trophy.png"
              alt=""
              draggable={false}
              className="h-3.5 w-3.5 object-contain"
            />
            {hasRecord
              ? t("survival.chipRecord", {
                  n: toLocaleDigits(survivalBest, locale),
                })
              : t("survival.chipRecordEmpty")}
          </GameChip>
        </div>

        <Link
          href="/play/survival?pick=1"
          onClick={() => {
            playSound("click");
            haptic(HAPTIC.tap);
          }}
          className="game-cta game-cta-accent relative mt-3 flex min-h-14 w-full items-center justify-center gap-1 font-display text-base font-black"
        >
          {t("survival.classicCta")}
          <span aria-hidden className="rtl:-scale-x-100">
            ›
          </span>
        </Link>
        <p className="relative mt-2 text-center font-display text-[11px] font-bold text-white/55">
          {t("survival.classicFoot")}
        </p>
      </GamePanel>

      {/* ── Optional: live challenges ────────────────────────────── */}
      {liveCount > 0 ? (
        <div className="hub-deck flex flex-1 flex-col gap-3">
          <div className="px-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xs font-black text-arena-muted">
                {t("survival.lobbyChallenges")}
              </h2>
              <GameChip tone="default" className="text-[10px]">
                {t("survival.optionalBadge")}
              </GameChip>
            </div>
            <p className="mt-1 font-display text-[11px] font-bold leading-snug text-arena-muted/95">
              {t("survival.lobbyChallengesHint")}
            </p>
            <p className="mt-1 font-display text-[11px] font-bold leading-snug text-white/50">
              {t("survival.challengeVsClassic")}
            </p>
          </div>
          <TrophyShowcase challenges={challenges} />
          <PremiumChallenges
            challenges={challenges}
            coins={coins}
            variant="lobby"
          />
        </div>
      ) : (
        <GamePanel tone="emerald" className="px-3 py-3">
          <p className="font-display text-xs font-bold text-white/70">
            {t("survival.noChallenges")}
          </p>
        </GamePanel>
      )}
    </section>
  );
}
