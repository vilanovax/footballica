"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ProfileSnapshot } from "@/lib/player/current";
import type { Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { GamePanel } from "@/components/ui/game/GamePanel";

type PlayerStatsPanelProps = {
  profile: ProfileSnapshot;
  locale: Locale;
};

export function PlayerStatsPanel({ profile, locale }: PlayerStatsPanelProps) {
  const { t } = useTranslation();
  const hasMatches = profile.matchesPlayed > 0;
  const winRate =
    profile.matchesPlayed > 0
      ? Math.round((profile.matchesWon / profile.matchesPlayed) * 100)
      : 0;

  const winHintKey =
    profile.matchesPlayed === 0 || winRate < 20
      ? "winCold"
      : winRate < 40
        ? "winFinding"
        : winRate < 60
          ? "winSolid"
          : "winLethal";
  const matchesHint =
    profile.matchesPlayed === 0
      ? t("profile.scoreHint.matchesZero")
      : t("profile.scoreHint.matchesSome", {
          n: toLocaleDigits(profile.matchesPlayed, locale),
        });
  const comboHint =
    profile.highestCombo <= 0
      ? t("profile.scoreHint.comboZero")
      : t("profile.scoreHint.comboHot");
  const streakHint =
    profile.dailyStreak > 0
      ? t("profile.scoreHint.streakLive", {
          n: toLocaleDigits(profile.dailyStreak, locale),
        })
      : profile.longestDailyStreak > 0
        ? t("profile.scoreHint.streakBest")
        : t("profile.scoreHint.streakZero");

  const secondaryStats = [
    {
      key: "win",
      label: t("profile.winRateShort"),
      value: `${toLocaleDigits(winRate, locale)}${locale === "fa" ? "٪" : "%"}`,
      iconSrc: "/icons/medal-gold.png",
      hint: t(`profile.scoreHint.${winHintKey}`),
    },
    {
      key: "streak",
      label: t("profile.bestStreak"),
      value: toLocaleDigits(profile.longestDailyStreak, locale),
      iconSrc: "/icons/streak.png",
      hint: streakHint,
    },
    {
      key: "combo",
      label: t("profile.bestCombo"),
      value: `${toLocaleDigits(profile.highestCombo, locale)}×`,
      iconSrc: "/icons/energy.png",
      hint: comboHint,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 22,
        delay: 0.08,
      }}
    >
      <GamePanel tone="emerald" className="p-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-e-10 top-0 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl"
        />

        <div className="relative mb-3 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/stadium.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-5 w-5 object-contain"
          />
          <h2 className="font-display text-sm font-black text-white">
            {t("profile.scoreboardTitle")}
          </h2>
        </div>

        {!hasMatches ? (
          <div className="relative rounded-2xl border border-dashed border-emerald-400/30 bg-black/35 px-4 py-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/stadium.png"
              alt=""
              aria-hidden
              draggable={false}
              className="mx-auto h-10 w-10 object-contain opacity-80"
            />
            <p className="mt-2 font-display text-sm font-bold leading-relaxed text-white/75">
              {t("profile.scoreboardEmpty")}
            </p>
            <Link
              href="/play"
              className="mt-4 game-cta game-cta-primary inline-flex h-11 min-w-40 items-center justify-center px-5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            >
              {t("profile.scoreboardEmptyCta")}
            </Link>
          </div>
        ) : (
          <>
            <div className="relative mb-2.5 flex items-center gap-3 rounded-2xl border border-emerald-300/25 bg-black/40 px-3 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/stadium.png"
                alt=""
                aria-hidden
                draggable={false}
                className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
              />
              <div className="min-w-0 flex-1 text-start">
                <p className="font-display text-[10px] font-black uppercase tracking-wider text-emerald-200/80">
                  {t("profile.matchesHero")}
                </p>
                <p className="font-display text-4xl font-black tabular-nums leading-none text-white">
                  {toLocaleDigits(profile.matchesPlayed, locale)}
                </p>
                <p className="mt-1 line-clamp-1 font-display text-[11px] font-bold text-white/50">
                  {matchesHint}
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-1.5">
              {secondaryStats.map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + i * 0.05 }}
                  className="rounded-2xl border border-white/12 bg-black/40 px-1.5 py-2.5 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.iconSrc}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="mx-auto h-6 w-6 object-contain"
                  />
                  <p className="mt-1 truncate font-display text-[10px] font-bold text-white/50">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-black tabular-nums text-white">
                    {s.value}
                  </p>
                  <p className="mt-0.5 line-clamp-2 px-0.5 font-display text-[10px] font-bold leading-tight text-white/45">
                    {s.hint}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </GamePanel>
    </motion.div>
  );
}
