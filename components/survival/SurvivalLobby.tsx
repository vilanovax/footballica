"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  PremiumChallenges,
  type PlayChallengeCard,
} from "@/components/play/PremiumChallenges";
import { TrophyShowcase } from "@/components/survival/TrophyShowcase";
import { MatchLeaveControl } from "@/components/quiz/MatchLeaveControl";
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
 * Survival hub — one composition: rule + kickoff, then optional challenges.
 */
export function SurvivalLobby({
  challenges,
  coins,
  survivalBest,
}: SurvivalLobbyProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const liveCount = challenges.length;
  const hasRecord = survivalBest > 0;

  return (
    <section className="flex flex-1 flex-col gap-3 pb-4">
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
          <MatchLeaveControl
            tone="lobby"
            className="order-last"
            onConfirmLeave={() => router.push("/play")}
          />
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
            <p className="mt-1.5 font-display text-sm font-bold leading-snug text-white/85">
              {t("survival.lobbyHook")}
            </p>
          </div>
        </div>

        <div
          className="relative mt-3 flex items-center justify-center gap-1.5"
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
                delay: 0.06 + i * 0.06,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/heart.png"
                alt=""
                draggable={false}
                className="h-9 w-9 object-contain drop-shadow-[0_4px_10px_rgba(220,38,38,0.35)]"
              />
            </motion.div>
          ))}
        </div>
        <p className="relative mt-1.5 text-center font-display text-xs font-bold text-rose-100/90">
          {t("survival.ruleLine")}
        </p>

        <div className="relative mt-3 flex flex-wrap justify-center gap-1.5">
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
          className="game-cta game-cta-accent relative mt-3.5 flex min-h-14 w-full items-center justify-center gap-1 font-display text-base font-black"
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

      {liveCount > 0 ? (
        <div className="hub-deck flex flex-1 flex-col gap-2.5">
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
