"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { BadgeCategory, PlayerStats } from "@/lib/game/achievements";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { GameChip } from "@/components/ui/game/GameChip";
import { GamePanel, type GamePanelTone } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";
import {
  FractionText,
  TIER_MEDAL_GLOW,
  TIER_PANEL,
  TIER_RING,
  resolveTrophyState,
  type DisplayAchievement,
} from "./profileShared";

type TrophyShowcaseProps = {
  unlockedHonors: DisplayAchievement[];
  otherByCategory: { cat: BadgeCategory; items: DisplayAchievement[] }[];
  totalCount: number;
  owned: Map<string, string>;
  player: PlayerStats;
  locale: Locale;
  onInspect: (slug: string) => void;
};

export function TrophyShowcase({
  unlockedHonors,
  otherByCategory,
  totalCount,
  owned,
  player,
  locale,
  onInspect,
}: TrophyShowcaseProps) {
  const { t } = useTranslation();
  const [othersOpen, setOthersOpen] = useState(false);
  const honorsUseScroll = unlockedHonors.length % 3 !== 0;

  return (
    <GamePanel tone="emerald" className="p-3">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-s-8 top-4 h-24 w-24 rounded-full bg-amber-300/12 blur-3xl"
      />
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/crown.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-5 w-5 shrink-0 object-contain"
          />
          <h2 className="truncate font-display text-base font-black text-white drop-shadow-sm">
            {t("profile.trophies")}
          </h2>
        </div>
        <GameChip tone="emerald" className="shrink-0 text-[11px]">
          {locale === "fa" ? (
            t("profile.trophiesCountLabel", {
              unlocked: toLocaleDigits(unlockedHonors.length, locale),
              total: toLocaleDigits(totalCount, locale),
            })
          ) : (
            <bdi dir="ltr">
              {t("profile.trophiesCountLabel", {
                unlocked: String(unlockedHonors.length),
                total: String(totalCount),
              })}
            </bdi>
          )}
        </GameChip>
      </div>

      <div className="relative flex flex-col gap-3.5">
        {unlockedHonors.length > 0 && (
          <div>
            <p className="mb-2 font-display text-[10px] font-black text-emerald-200/90">
              {t("profile.trophyHonors")}
            </p>
            {honorsUseScroll ? (
              <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden">
                {unlockedHonors.map((a, i) => (
                  <div
                    key={a.slug}
                    className="w-[31%] min-w-27 shrink-0 snap-start"
                  >
                    <BadgeTile
                      achievement={a}
                      unlockedAt={owned.get(a.slug)}
                      player={player}
                      locale={locale}
                      delay={0.06 + i * 0.04}
                      onInspect={() => onInspect(a.slug)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {unlockedHonors.map((a, i) => (
                  <BadgeTile
                    key={a.slug}
                    achievement={a}
                    unlockedAt={owned.get(a.slug)}
                    player={player}
                    locale={locale}
                    delay={0.06 + i * 0.04}
                    onInspect={() => onInspect(a.slug)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {otherByCategory.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <button
              type="button"
              onClick={() => {
                haptic(HAPTIC.light);
                setOthersOpen((v) => !v);
              }}
              className="flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2.5"
              aria-expanded={othersOpen}
            >
              <span className="font-display text-[10px] font-black text-white/65">
                {t("profile.trophyOther")}
              </span>
              <span className="flex items-center gap-1.5 font-display text-[10px] font-bold text-white/55">
                {othersOpen
                  ? t("profile.trophyOtherHide")
                  : t("profile.trophyOtherShow")}
                <span
                  aria-hidden
                  className={[
                    "inline-block text-sm leading-none transition-transform",
                    othersOpen ? "rotate-180" : "",
                  ].join(" ")}
                >
                  ▾
                </span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {othersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-3 px-3 pb-3">
                    {otherByCategory.map(({ cat, items }) => (
                      <div key={cat}>
                        <p className="mb-1.5 font-display text-[11px] font-black text-amber-200/80">
                          {t(`profile.cat.${cat}`)}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {items.map((a, i) => (
                            <BadgeTile
                              key={a.slug}
                              achievement={a}
                              unlockedAt={owned.get(a.slug)}
                              player={player}
                              locale={locale}
                              delay={i * 0.03}
                              onInspect={() => onInspect(a.slug)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </GamePanel>
  );
}

type BadgeTileProps = {
  achievement: DisplayAchievement;
  unlockedAt: string | undefined;
  player: PlayerStats;
  locale: Locale;
  delay: number;
  onInspect: () => void;
};

function BadgeTile({
  achievement: a,
  unlockedAt,
  player,
  locale,
  delay,
  onInspect,
}: BadgeTileProps) {
  const { t } = useTranslation();
  const name = locale === "fa" ? a.nameFa : a.nameEn;
  const imageUrl = a.imageUrl;
  const prog = !unlockedAt ? a.progress?.(player) : undefined;
  const state = resolveTrophyState(unlockedAt, prog);
  const pct = prog
    ? Math.min(100, Math.round((prog.current / prog.target) * 100))
    : 0;
  const stepsLeft = prog ? Math.max(0, prog.target - prog.current) : 0;
  const hasArt = Boolean(imageUrl);

  const panelTone: GamePanelTone =
    state === "unlocked"
      ? TIER_PANEL[a.tier]
      : state === "progress"
        ? "rose"
        : "emerald";

  return (
    <motion.button
      type="button"
      onClick={onInspect}
      initial={
        state === "unlocked"
          ? { opacity: 0, scale: 0.6, y: 12 }
          : { opacity: 0, scale: 0.92 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        state === "unlocked"
          ? { delay, type: "spring", stiffness: 320, damping: 16 }
          : { delay, type: "spring", stiffness: 260, damping: 20 }
      }
      whileTap={{ scale: 0.96 }}
      className="w-full"
      aria-label={name}
    >
      <GamePanel
        tone={panelTone}
        className={cn(
          "flex min-h-33 w-full flex-col items-center gap-1.5 px-2 py-2.5 text-center",
          state === "unlocked" && a.tier === "gold" && "ring-1 ring-arena-amber/50",
          state !== "unlocked" && state !== "progress" && "opacity-90",
        )}
      >
        {hasArt ? (
          <span
            className="relative flex h-16 w-full items-center justify-center"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl!}
              alt=""
              className={[
                "h-full w-auto max-w-full object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]",
                state === "locked" ? "grayscale opacity-45" : "",
                state === "progress" ? "opacity-95" : "",
              ].join(" ")}
            />
            {state === "locked" && (
              <span className="absolute inset-e-0 top-0 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-slate-900 text-[10px] shadow-sm">
                🔒
              </span>
            )}
          </span>
        ) : (
          <span
            className={[
              "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-2xl",
              state === "unlocked"
                ? `bg-linear-to-b ${TIER_RING[a.tier]} ${TIER_MEDAL_GLOW[a.tier]}`
                : state === "progress"
                  ? "border border-white/20 bg-black/35"
                  : "border border-white/10 bg-black/40 grayscale opacity-55",
            ].join(" ")}
            aria-hidden
          >
            {a.emoji}
            {state === "locked" && (
              <span className="absolute -inset-e-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-slate-900 text-[9px] leading-none shadow-sm">
                🔒
              </span>
            )}
          </span>
        )}

        <p className="relative line-clamp-1 w-full font-display text-[11px] font-black text-white drop-shadow-sm">
          {name}
        </p>

        {state === "unlocked" ? null : prog ? (
          <div className="relative w-full px-0.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-orange-400 via-amber-300 to-yellow-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 font-display text-[10px] font-black text-amber-100/90">
              <FractionText
                cur={prog.current}
                next={prog.target}
                locale={locale}
              />
            </p>
            {state === "progress" && stepsLeft > 0 && stepsLeft <= 3 && (
              <p className="font-display text-[9px] font-bold text-lime-300">
                {t("profile.trophyStepsLeft", {
                  n: toLocaleDigits(stepsLeft, locale),
                })}
              </p>
            )}
          </div>
        ) : (
          <span className="relative font-display text-[10px] font-bold text-white/45">
            {t("profile.trophyLocked")}
          </span>
        )}
      </GamePanel>
    </motion.button>
  );
}
