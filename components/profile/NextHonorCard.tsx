"use client";

import { motion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { PlayerStats } from "@/lib/game/achievements";
import { GamePanel } from "@/components/ui/game/GamePanel";
import type { DisplayAchievement } from "./profileShared";

type NextHonorCardProps = {
  achievement: DisplayAchievement;
  player: PlayerStats;
  locale: Locale;
  onInspect: () => void;
};

/** Star chase card — the single next honor, bigger than collection tiles. */
export function NextHonorCard({
  achievement: a,
  player,
  locale,
  onInspect,
}: NextHonorCardProps) {
  const { t } = useTranslation();
  const name = locale === "fa" ? a.nameFa : a.nameEn;
  const imageUrl = a.imageUrl;
  const prog = a.progress?.(player);
  const pct = prog
    ? Math.min(100, Math.round((prog.current / prog.target) * 100))
    : 0;
  const stepsLeft = prog ? Math.max(0, prog.target - prog.current) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.1 }}
    >
      <GamePanel tone="amber" className="p-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-s-6 top-0 h-24 w-24 rounded-full bg-amber-300/20 blur-3xl"
        />
        <div className="relative mb-2.5 flex items-center gap-2">
          <p className="font-display text-[11px] font-black uppercase tracking-wider text-amber-200">
            {t("profile.nextHonorTitle")}
          </p>
        </div>

        <motion.button
          type="button"
          onClick={onInspect}
          whileTap={{ scale: 0.98 }}
          className="relative flex w-full items-center gap-3 rounded-2xl border border-amber-300/40 bg-black/45 px-3 py-3 text-start shadow-[0_3px_0_0_rgba(0,0,0,0.3)]"
          aria-label={name}
        >
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/40"
            aria-hidden
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-12 w-12 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.4)]"
              />
            ) : (
              <span className="text-3xl">{a.emoji}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-black text-white">
              {name}
            </p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-amber-300 via-yellow-300 to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 font-display text-[11px] font-bold text-lime-300">
              {stepsLeft > 0
                ? stepsLeft <= 3
                  ? t("profile.trophyStepsLeft", {
                      n: toLocaleDigits(stepsLeft, locale),
                    })
                  : t("profile.nextHonorAlmost", { name })
                : t("profile.nextHonorAlmost", { name })}
            </p>
          </div>
        </motion.button>
      </GamePanel>
    </motion.div>
  );
}
