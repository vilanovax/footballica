"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { playSound } from "@/lib/audio/SoundManager";
import {
  THEME_PRESETS,
  isLiveOpsThemeKey,
  type LiveOpsThemeKey,
} from "@/lib/game/liveOpsTheme";
import { GamePanel } from "@/components/ui/game/GamePanel";

export type ThemeWeekBannerProps = {
  themeKey: string | null;
  titleEn: string;
  titleFa: string;
  blurbEn: string;
  blurbFa: string;
  /** Deep-link when a themed RecordChallenge is live. */
  href?: string;
  ctaLabel?: string;
};

/**
 * Play-screen Live-Ops banner for an active theme week (Phase C).
 * Not a permanent mode card — sits above Match Cards / GotD.
 */
export function ThemeWeekBanner({
  themeKey,
  titleEn,
  titleFa,
  blurbEn,
  blurbFa,
  href = "/play/survival",
  ctaLabel,
}: ThemeWeekBannerProps) {
  const { t, locale } = useTranslation();
  if (!themeKey && !titleEn && !titleFa) return null;

  const key: LiveOpsThemeKey | null = isLiveOpsThemeKey(themeKey)
    ? themeKey
    : null;
  const preset = key ? THEME_PRESETS[key] : null;
  const title =
    (locale === "fa" ? titleFa || titleEn : titleEn || titleFa) ||
    preset?.labelEn ||
    t("play.themeWeek");
  const blurb =
    (locale === "fa" ? blurbFa || blurbEn : blurbEn || blurbFa) ||
    t("play.themeWeekBlurb");

  return (
    <GamePanel tone="amber" className="p-4">
      <p className="relative font-display text-xs font-black text-amber-200/90">
        {t("play.themeWeek")}
      </p>
      <p className="relative mt-1 font-display text-lg font-black text-white">
        {title}
      </p>
      <p className="relative mt-0.5 font-display text-sm font-bold text-white/70">
        {blurb}
      </p>
      <Link
        href={href}
        onClick={() => playSound("click")}
        className="game-cta game-cta-accent relative mt-3 w-full text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
      >
        {ctaLabel ?? t("play.themeWeekCta")}
      </Link>
    </GamePanel>
  );
}
