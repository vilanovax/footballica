"use client";

import { motion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { PlayerStats } from "@/lib/game/achievements";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { GamePanel } from "@/components/ui/game/GamePanel";
import {
  FractionText,
  TIER_MEDAL_GLOW,
  TIER_RING,
  TIER_SHEET_WASH,
  resolveTrophyState,
  type DisplayAchievement,
} from "./profileShared";

type TrophyInspectSheetProps = {
  achievement: DisplayAchievement;
  unlockedAt: string | undefined;
  player: PlayerStats;
  locale: Locale;
  onClose: () => void;
};

export function TrophyInspectSheet({
  achievement: a,
  unlockedAt,
  player,
  locale,
  onClose,
}: TrophyInspectSheetProps) {
  const { t } = useTranslation();
  const name = locale === "fa" ? a.nameFa : a.nameEn;
  const desc = locale === "fa" ? a.descriptionFa : a.descriptionEn;
  const imageUrl = a.imageUrl;
  const prog = !unlockedAt ? a.progress?.(player) : undefined;
  const state = resolveTrophyState(unlockedAt, prog);
  const pct = prog
    ? Math.min(100, Math.round((prog.current / prog.target) * 100))
    : 0;
  const stepsLeft = prog ? Math.max(0, prog.target - prog.current) : 0;
  const hasReward = a.reward.coins > 0 || a.reward.xp > 0;

  return (
    <motion.div
      className="fixed inset-0 z-70 flex items-end justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-12 sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        aria-label={t("profile.trophyClose")}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="trophy-inspect-title"
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-mobile shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)]"
      >
        <GamePanel tone="emerald" className="rounded-[1.75rem]">
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5">
            <span
              aria-hidden
              className="h-1.5 w-11 rounded-full bg-white/25"
            />
          </div>

          <div
            className={[
              "relative bg-linear-to-b px-5 pb-5 pt-7 text-center",
              TIER_SHEET_WASH[a.tier],
            ].join(" ")}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 20%, rgba(255,255,255,0.14), transparent 60%)",
              }}
            />

            <motion.span
              initial={{ scale: 0.7, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 16 }}
              className={[
                "relative mx-auto flex items-center justify-center",
                imageUrl
                  ? "h-36 w-full max-w-56"
                  : [
                      "h-22 w-22 overflow-hidden rounded-full text-5xl",
                      state === "unlocked"
                        ? `bg-linear-to-b ${TIER_RING[a.tier]} ${TIER_MEDAL_GLOW[a.tier]}`
                        : "bg-white/10 grayscale opacity-70 ring-2 ring-white/15",
                    ].join(" "),
              ].join(" ")}
              aria-hidden
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className={[
                    "h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
                    state === "locked" ? "grayscale opacity-55" : "",
                    state === "progress" ? "opacity-95" : "",
                  ].join(" ")}
                />
              ) : (
                a.emoji
              )}
              {state === "locked" && (
                <span className="absolute -inset-e-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/80 text-sm shadow-md">
                  🔒
                </span>
              )}
            </motion.span>

            <div className="relative mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full border border-white/20 bg-black/35 px-2.5 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-amber-100">
                {t(`profile.tier.${a.tier}`)}
              </span>
              <span
                className={[
                  "rounded-full border px-2.5 py-0.5 font-display text-[10px] font-black",
                  state === "unlocked"
                    ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
                    : state === "progress"
                      ? "border-amber-300/40 bg-amber-400/20 text-amber-100"
                      : "border-white/15 bg-white/10 text-white/70",
                ].join(" ")}
              >
                {state === "unlocked"
                  ? t("profile.trophyUnlocked")
                  : state === "progress"
                    ? t("profile.trophyInProgress")
                    : t("profile.trophyLocked")}
              </span>
            </div>

            <h3
              id="trophy-inspect-title"
              className="relative mt-2 font-display text-2xl font-black text-white drop-shadow-sm"
            >
              {name}
            </h3>
          </div>

          <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
            <div className="rounded-2xl border border-white/12 bg-black/40 px-3.5 py-3 text-start shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <p className="font-display text-[10px] font-black uppercase tracking-wider text-emerald-300/90">
                {state === "unlocked"
                  ? t("profile.trophyRequirement")
                  : t("profile.trophyHowTo")}
              </p>
              <p className="mt-1 font-display text-sm font-bold leading-relaxed text-white/80">
                {desc}
              </p>
            </div>

            {state !== "unlocked" && prog && (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-3.5 py-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="font-display text-[10px] font-black uppercase tracking-wider text-amber-200">
                    {t("profile.trophyProgress")}
                  </p>
                  <p className="font-display text-xs font-black text-amber-100">
                    <FractionText
                      cur={prog.current}
                      next={prog.target}
                      locale={locale}
                    />
                  </p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/45 ring-1 ring-white/10">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-amber-300 to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                  />
                </div>
                {stepsLeft > 0 && stepsLeft <= 3 && (
                  <p className="mt-1.5 font-display text-[11px] font-bold text-lime-300">
                    {t("profile.trophyStepsLeft", {
                      n: toLocaleDigits(stepsLeft, locale),
                    })}
                  </p>
                )}
              </div>
            )}

            {hasReward && (
              <div className="rounded-2xl border border-amber-300/35 bg-black/40 px-3.5 py-3">
                <p className="font-display text-[10px] font-black uppercase tracking-wider text-amber-200">
                  {state === "unlocked"
                    ? t("profile.rewardEarned")
                    : t("profile.rewardOnUnlock")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.reward.coins > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1.5 font-display text-sm font-black text-amber-100">
                      <ResourceIcon kind="coin" size="sm" />
                      {toLocaleDigits(a.reward.coins, locale)}
                    </span>
                  )}
                  {a.reward.xp > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/40 bg-sky-500/15 px-3 py-1.5 font-display text-sm font-black text-sky-100">
                      <ResourceIcon kind="xp" size="sm" />
                      {toLocaleDigits(a.reward.xp, locale)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="game-cta game-cta-primary relative w-full font-display text-base font-black"
            >
              {t("profile.trophyClose")}
            </button>
          </div>
        </GamePanel>
      </motion.div>
    </motion.div>
  );
}
