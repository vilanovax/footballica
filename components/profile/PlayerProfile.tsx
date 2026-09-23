"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import type { ProfileSnapshot } from "@/lib/player/current";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { isAvatarKey, type AvatarKey } from "@/lib/onboarding/avatars";
import { getFlag, type FlagKey } from "@/lib/onboarding/flags";
import {
  DEFAULT_CLUB_COLOR_KEY,
  isClubColorKey,
  type ClubColorKey,
} from "@/lib/onboarding/clubColors";
import { countMissionRewardsReady } from "@/lib/game/missionRewards";
import { calculateLevel, MAX_LEVEL } from "@/lib/game/economy";
import { playerTitleBand } from "@/lib/game/playerTitle";
import { ACHIEVEMENTS, type PlayerStats } from "@/lib/game/achievements";
import type { BadgePresentation } from "@/lib/game/badgeTypes";
import { resolveBadgeImageUrl } from "@/lib/game/badgeArt";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { ProfileHero } from "./ProfileHero";
import { PlayerStatsPanel } from "./PlayerStatsPanel";
import { NextHonorCard } from "./NextHonorCard";
import { TrophyShowcase } from "./TrophyShowcase";
import { TrophyInspectSheet } from "./TrophyInspectSheet";
import {
  buildTrophyCabinet,
  type DisplayAchievement,
} from "./profileShared";

// Modals / drawer — mount chunks only when opened (ClubHub MissionDrawer pattern).
const ProfileEditModal = dynamic(() =>
  import("./ProfileEditModal").then((m) => m.ProfileEditModal),
);
const FlagPickerModal = dynamic(() =>
  import("./FlagPickerModal").then((m) => m.FlagPickerModal),
);
const MissionDrawer = dynamic(() =>
  import("@/components/profile/MissionDrawer").then((m) => m.MissionDrawer),
);
const PerfectedBanksShelf = dynamic(() =>
  import("@/components/profile/PerfectedBanksShelf").then(
    (m) => m.PerfectedBanksShelf,
  ),
);

/** Stable default — avoid `= []` recreating referential identity each render. */
const EMPTY_BADGE_CATALOG: BadgePresentation[] = [];

export function PlayerProfile({
  profile,
  badgeCatalog = EMPTY_BADGE_CATALOG,
  missionBoard = null,
  dailyBoard = null,
}: {
  profile: ProfileSnapshot;
  /** Admin-editable titles / art / rewards (from BadgeDefinition). */
  badgeCatalog?: BadgePresentation[];
  missionBoard?: EvaluateMissionsResult | null;
  dailyBoard?: EvaluateMissionsResult | null;
}) {
  const { locale } = useTranslation();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pickingFlag, setPickingFlag] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [inspectSlug, setInspectSlug] = useState<string | null>(null);
  const missionReadyCount = countMissionRewardsReady(dailyBoard, missionBoard);
  const hasMissionBoards = Boolean(
    dailyBoard?.batchId || missionBoard?.batchId,
  );

  const level = calculateLevel(profile.xp);
  const titleBand = playerTitleBand(level.level);
  const xpRemaining = Math.max(0, level.nextLevelXp - level.currentLevelXp);
  const atMaxLevel = level.level >= MAX_LEVEL;
  const flag = getFlag(profile.flag);

  const avatarKey: AvatarKey =
    profile.avatar && isAvatarKey(profile.avatar)
      ? profile.avatar
      : "TACTICAL_COACH";
  const colorKey: ClubColorKey = isClubColorKey(profile.colorKey)
    ? profile.colorKey
    : DEFAULT_CLUB_COLOR_KEY;
  const ownedSlugs = profile.badges.map((b) => b.slug);

  const owned = useMemo(
    () => new Map(profile.badges.map((b) => [b.slug, b.unlockedAt])),
    [profile.badges],
  );
  const catalogBySlug = useMemo(
    () => new Map(badgeCatalog.map((b) => [b.slug, b])),
    [badgeCatalog],
  );

  /** Code unlock rules + admin presentation overlay (+ bundled art fallback). */
  const displayAchievements: DisplayAchievement[] = useMemo(
    () =>
      ACHIEVEMENTS.map((a) => {
        const p = catalogBySlug.get(a.slug);
        if (!p) {
          return {
            ...a,
            imageUrl: resolveBadgeImageUrl(a.slug, null),
            hidden: false,
          };
        }
        return {
          ...a,
          nameEn: p.nameEn,
          nameFa: p.nameFa,
          descriptionEn: p.descriptionEn,
          descriptionFa: p.descriptionFa,
          emoji: p.emoji || a.emoji,
          tier: p.tier || a.tier,
          reward: { coins: p.rewardCoins, xp: p.rewardXp },
          imageUrl: resolveBadgeImageUrl(a.slug, p.imageUrl),
          hidden: !p.isActive && !owned.has(a.slug),
        };
      }).filter((a) => !a.hidden),
    [catalogBySlug, owned],
  );

  const playerStats: PlayerStats = useMemo(
    () => ({
      matchesPlayed: profile.matchesPlayed,
      matchesWon: profile.matchesWon,
      goalsTotal: profile.goalsTotal,
      highestCombo: profile.highestCombo,
      dailyStreak: profile.dailyStreak,
      longestDailyStreak: profile.longestDailyStreak,
      mysteryStreak: profile.mysteryStreak,
      longestMysteryStreak: profile.longestMysteryStreak,
      mysterySolves: profile.mysterySolves,
      gridStreak: profile.gridStreak,
      longestGridStreak: profile.longestGridStreak,
      gridSolves: profile.gridSolves,
      penaltyPerfectCategories: profile.penaltyPerfectCategories,
    }),
    [profile],
  );

  const { nextGoal, unlockedHonors, otherByCategory } = useMemo(
    () => buildTrophyCabinet(displayAchievements, owned, playerStats),
    [displayAchievements, owned, playerStats],
  );

  const inspectAchievement = inspectSlug
    ? displayAchievements.find((x) => x.slug === inspectSlug)
    : undefined;

  function openInspect(slug: string) {
    haptic(HAPTIC.light);
    setInspectSlug(slug);
  }

  return (
    <section className="flex flex-1 flex-col gap-3.5 pb-1">
      <ProfileHero
        profile={profile}
        locale={locale}
        avatarKey={avatarKey}
        colorKey={colorKey}
        flagEmoji={flag.emoji}
        titleBand={titleBand}
        level={level}
        atMaxLevel={atMaxLevel}
        xpRemaining={xpRemaining}
        hasMissionBoards={hasMissionBoards}
        missionReadyCount={missionReadyCount}
        onEdit={() => setEditing(true)}
        onPickFlag={() => setPickingFlag(true)}
        onOpenMissions={() => setMissionsOpen(true)}
      />

      <PlayerStatsPanel profile={profile} locale={locale} />

      {nextGoal && (
        <NextHonorCard
          achievement={nextGoal}
          player={playerStats}
          locale={locale}
          onInspect={() => openInspect(nextGoal.slug)}
        />
      )}

      <TrophyShowcase
        unlockedHonors={unlockedHonors}
        otherByCategory={otherByCategory}
        totalCount={displayAchievements.length}
        owned={owned}
        player={playerStats}
        locale={locale}
        onInspect={openInspect}
      />

      <PerfectedBanksShelf banks={profile.perfectedBanks} />

      {hasMissionBoards && (
        <MissionDrawer
          open={missionsOpen}
          onOpenChange={setMissionsOpen}
          dailyBoard={dailyBoard}
          missionBoard={missionBoard}
          onEconomyUpdate={() => {
            router.refresh();
          }}
        />
      )}

      <ProfileEditModal
        open={editing}
        initial={{
          managerName: profile.managerName,
          clubName: profile.clubName,
          stadiumName: profile.stadiumName ?? "",
          avatar: avatarKey,
          colorKey,
        }}
        ownedBadgeSlugs={ownedSlugs}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
      />

      <FlagPickerModal
        open={pickingFlag}
        current={flag.key as FlagKey}
        level={level.level}
        onClose={() => setPickingFlag(false)}
        onSaved={() => {
          setPickingFlag(false);
          router.refresh();
        }}
      />

      <AnimatePresence>
        {inspectAchievement && (
          <TrophyInspectSheet
            key={inspectAchievement.slug}
            achievement={inspectAchievement}
            unlockedAt={owned.get(inspectAchievement.slug)}
            player={playerStats}
            locale={locale}
            onClose={() => setInspectSlug(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
