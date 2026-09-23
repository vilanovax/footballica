"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ProfileSnapshot } from "@/lib/player/current";
import type { Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { AvatarKey } from "@/lib/onboarding/avatars";
import type { ClubColorKey } from "@/lib/onboarding/clubColors";
import {
  clubAccentRingStyle,
  getClubColor,
} from "@/lib/onboarding/clubColors";
import type { PlayerTitleBand } from "@/lib/game/playerTitle";
import type { LevelInfo } from "@/lib/game/economy";
import { AvatarImage } from "@/components/common/AvatarImage";
import { HubIcon } from "@/components/common/HubIcon";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { FractionText } from "./profileShared";

type ProfileHeroProps = {
  profile: ProfileSnapshot;
  locale: Locale;
  avatarKey: AvatarKey;
  colorKey: ClubColorKey;
  flagEmoji: string;
  titleBand: PlayerTitleBand;
  level: LevelInfo;
  atMaxLevel: boolean;
  xpRemaining: number;
  hasMissionBoards: boolean;
  missionReadyCount: number;
  onEdit: () => void;
  onPickFlag: () => void;
  onOpenMissions: () => void;
};

export function ProfileHero({
  profile,
  locale,
  avatarKey,
  colorKey,
  flagEmoji,
  titleBand,
  level,
  atMaxLevel,
  xpRemaining,
  hasMissionBoards,
  missionReadyCount,
  onEdit,
  onPickFlag,
  onOpenMissions,
}: ProfileHeroProps) {
  const { t } = useTranslation();
  const clubColor = getClubColor(colorKey);
  const clubNameClass =
    profile.clubName.length > 22
      ? "text-sm"
      : profile.clubName.length > 14
        ? "text-base"
        : "text-lg";

  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
    >
      <GamePanel tone="emerald" className="p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              `radial-gradient(ellipse 80% 55% at 50% -10%, ${clubColor.washHex}55, transparent 60%)`,
              `radial-gradient(circle at 85% 20%, ${clubColor.hex}33, transparent 45%)`,
              "radial-gradient(ellipse 120% 40% at 50% 110%, rgba(0,0,0,0.45), transparent 55%)",
            ].join(", "),
          }}
        />

        <div className="relative flex items-start gap-3.5">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 16,
              delay: 0.1,
            }}
            className="relative shrink-0 rounded-full p-1"
            style={{
              ...clubAccentRingStyle(colorKey),
              boxShadow: `0 0 0 3px ${clubColor.hex}, 0 4px 0 0 rgba(0,0,0,0.35), 0 0 24px ${clubColor.hex}55`,
            }}
          >
            <AvatarImage
              avatarKey={avatarKey}
              colorKey={colorKey}
              className="h-24 w-24 rounded-full shadow-fantasy ring-2 ring-black/40"
            />
            <div
              className="absolute -inset-s-1 -top-1 flex h-10 min-w-10 flex-col items-center justify-center rounded-full bg-linear-to-b from-amber-200 via-yellow-400 to-amber-600 px-1 shadow-[0_0_0_2px_rgba(254,243,199,0.9),0_3px_0_0_rgba(120,70,0,0.45)]"
              aria-label={t("profile.level", {
                n: toLocaleDigits(level.level, locale),
              })}
            >
              <span className="font-display text-[8px] font-black leading-none tracking-wide text-amber-950/80">
                {t("profile.levelBadge")}
              </span>
              <span className="font-display text-sm font-black leading-none text-amber-950">
                {toLocaleDigits(level.level, locale)}
              </span>
            </div>
            <button
              type="button"
              onClick={onPickFlag}
              aria-label={t("profile.flag.title")}
              className="absolute -inset-e-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-2xl shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.45),0_3px_0_0_rgba(0,0,0,0.4)] transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
            >
              {flagEmoji}
            </button>
          </motion.div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-display text-xs font-black text-emerald-300/90">
              {t(`profile.title.${titleBand}`)}
            </p>
            <h1 className="mt-0.5 line-clamp-1 wrap-break-word font-display text-xl font-black leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              {profile.managerName}
            </h1>
            <p
              className={[
                "mt-0.5 line-clamp-1 wrap-break-word font-display font-bold text-white/70",
                clubNameClass,
              ].join(" ")}
            >
              <span className="text-white/45">{t("profile.clubByline")} · </span>
              {profile.clubName}
            </p>
            {profile.stadiumName ? (
              <p className="mt-1 line-clamp-1 font-display text-xs font-bold text-emerald-200/80">
                {profile.stadiumName}
                <span className="text-white/40">
                  {" "}
                  ·{" "}
                  {t("profile.stadiumLevelLabel", {
                    n: toLocaleDigits(profile.stadiumLevel, locale),
                  })}
                </span>
              </p>
            ) : (
              <div className="mt-1.5 flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      haptic(HAPTIC.light);
                      onEdit();
                    }}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 font-display text-[11px] font-black text-amber-100 transition-transform active:scale-95"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/icons/stadium.png"
                      alt=""
                      aria-hidden
                      draggable={false}
                      className="h-3.5 w-3.5 object-contain"
                    />
                    {t("profile.stadiumNameGoal")}
                  </button>
                  <Link
                    href="/club"
                    className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-black/35 px-2.5 py-1 font-display text-[11px] font-bold text-white/70 transition-transform active:scale-95"
                  >
                    {t("profile.stadiumViewClub")}
                  </Link>
                </div>
                <p className="font-display text-[10px] font-bold text-white/45">
                  {t("profile.stadiumLevelLabel", {
                    n: toLocaleDigits(profile.stadiumLevel, locale),
                  })}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onEdit}
            aria-label={t("profile.edit.button")}
            className="game-icon-btn flex shrink-0 items-center justify-center rounded-full bg-black/40 text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_3px_0_0_rgba(0,0,0,0.35)] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 fill-current"
              aria-hidden
            >
              <path d="M13.6 2.4a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1l-9.2 9.2a1.5 1.5 0 0 1-.7.4l-3.3.7a.75.75 0 0 1-.9-.9l.7-3.3a1.5 1.5 0 0 1 .4-.7l9-9.4Zm1.1 1.1-9 9.4-.3 1.5 1.5-.3 9-9.4-1.2-1.2Z" />
            </svg>
          </button>
        </div>

        {hasMissionBoards && (
          <motion.button
            type="button"
            onClick={() => {
              haptic(HAPTIC.light);
              onOpenMissions();
            }}
            aria-label={t("missions.openDrawer")}
            whileTap={{ scale: 0.98 }}
            className={[
              "relative mt-3.5 flex min-h-touch w-full items-center justify-center gap-2 rounded-bubble-xl font-display text-sm font-black shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_3px_0_0_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring",
              missionReadyCount > 0
                ? "bg-linear-to-b from-amber-500/35 to-amber-900/50 text-amber-50 shadow-[0_0_0_1px_hsl(var(--arena-ring-amber)/0.45),0_3px_0_0_rgba(0,0,0,0.35)]"
                : "bg-black/40 text-white",
            ].join(" ")}
          >
            <HubIcon kind="mission" size="sm" />
            <span>{t("profile.missionsChip")}</span>
            {missionReadyCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-display text-[11px] font-black text-accent-foreground ring-1 ring-amber-200/50">
                {toLocaleDigits(Math.min(missionReadyCount, 9), locale)}
                {missionReadyCount > 9 ? "+" : ""}
              </span>
            )}
          </motion.button>
        )}

        <div className="relative mt-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1 font-display text-[11px] font-black text-emerald-200/85">
              {atMaxLevel ? (
                t("profile.xpMaxLevel")
              ) : (
                <>
                  <ResourceIcon kind="xp" size="sm" className="h-3.5 w-3.5" />
                  {t("profile.xpToNext", {
                    n: toLocaleDigits(xpRemaining, locale),
                  })}
                </>
              )}
            </p>
            <span className="inline-flex items-center gap-1 font-display text-xs font-bold tabular-nums text-white/55">
              {locale === "fa" ? (
                t("profile.xpOf", {
                  cur: toLocaleDigits(level.currentLevelXp, locale),
                  next: toLocaleDigits(level.nextLevelXp, locale),
                })
              ) : (
                <FractionText
                  cur={level.currentLevelXp}
                  next={level.nextLevelXp}
                  locale={locale}
                />
              )}
              <ResourceIcon kind="xp" size="sm" className="h-4 w-4" />
            </span>
          </div>
          <div className="relative h-3.5 w-full overflow-hidden rounded-full border border-white/15 bg-black/55 shadow-[inset_0_2px_6px_rgba(0,0,0,0.55)]">
            <motion.div
              className="relative h-full rounded-full bg-linear-to-r from-emerald-400 via-lime-300 to-amber-300 shadow-[0_0_12px_rgba(52,211,153,0.45)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(level.progress * 100)}%` }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/25"
              />
            </motion.div>
          </div>
        </div>
      </GamePanel>
    </motion.header>
  );
}
