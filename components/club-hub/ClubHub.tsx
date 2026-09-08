"use client";

import { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { upgradeClub } from "@/actions/upgradeClub";
import {
  claimDailyNews,
  type NewsPayload,
  type NewsState,
} from "@/actions/claimDailyNews";
import {
  UPGRADE_LIST,
  getClubLevel,
  getUpgradeCost,
  type ClubSnapshot,
  type UpgradeKey,
} from "@/lib/club/upgrades";
import { type AvatarKey } from "@/lib/onboarding/avatars";
import {
  clubAccentRingStyle,
  clubAccentWashStyle,
  DEFAULT_CLUB_COLOR_KEY,
} from "@/lib/onboarding/clubColors";
import { AvatarImage } from "@/components/common/AvatarImage";
import { HubIcon } from "@/components/common/HubIcon";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { countMissionRewardsReady } from "@/lib/game/missionRewards";
import { StatusBar } from "./StatusBar";
import { StadiumHero } from "./StadiumHero";
import { UpgradeCard } from "./UpgradeCard";
import { FtueCoach } from "./FtueCoach";
import { DuelInboxBanner } from "@/components/duel/DuelInboxBanner";
import type { DuelInboxItem } from "@/actions/duel/getInboxCount";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import { NextGoalCard } from "@/components/club-hub/NextGoalCard";
import { HubTodayRail } from "@/components/club-hub/HubTodayRail";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

// Heavy / deferred hub panels — keep first Club paint lean.
const BusinessPanel = dynamic(() =>
  import("@/components/club-hub/BusinessPanel").then((m) => m.BusinessPanel),
);
const MissionDrawer = dynamic(() =>
  import("@/components/profile/MissionDrawer").then((m) => m.MissionDrawer),
);
const Confetti = dynamic(() =>
  import("./Confetti").then((m) => m.Confetti),
);
const NewspaperModal = dynamic(() =>
  import("./NewspaperModal").then((m) => m.NewspaperModal),
);

type ClubHubProps = {
  initialClub: ClubSnapshot;
  /** Soft-currency stamina top-up cost from GameConfig. */
  staminaRefillCost: number;
  /** Typical coins from a win — drives Next Goal wins-away. */
  coinsPerWin: number;
  /** Active Draft Duel turns waiting for the manager. */
  duelInboxCount?: number;
  duelInboxItems?: DuelInboxItem[];
  missionBoard?: EvaluateMissionsResult | null;
  dailyBoard?: EvaluateMissionsResult | null;
  /** ADR 002 Campaign metagame snapshot (missions + RecordChallenge chapters). */
  campaignSeason?: CampaignSeasonView | null;
};

export function ClubHub({
  initialClub,
  staminaRefillCost,
  coinsPerWin,
  duelInboxCount = 0,
  duelInboxItems = [],
  missionBoard = null,
  dailyBoard = null,
  campaignSeason = null,
}: ClubHubProps) {
  const { t, locale } = useTranslation();
  const [club, setClub] = useState(initialClub);
  const [pendingKey, setPendingKey] = useState<UpgradeKey | null>(null);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Transient "You're ready!" greeting shown once on the 1 → 2 transition.
  const [justGraduated, setJustGraduated] = useState(false);
  const [, startTransition] = useTransition();

  const step = club.tutorialStep;
  const avatarKey = (club.avatar ?? "TACTICAL_COACH") as AvatarKey;
  const avatarName = t(`avatars.${avatarKey}.name`);
  const colorKey = club.colorKey ?? DEFAULT_CLUB_COLOR_KEY;
  // Daily News only unlocks once the FTUE is fully complete (tutorialStep 2).
  const ftueComplete = step === 2;

  // Newspaper booster state
  const [news, setNews] = useState<{
    payload: NewsPayload | null;
    state: NewsState;
  } | null>(null);
  const [newsPending, setNewsPending] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  // Keep drawer mounted after first open so exit animation works, but skip
  // downloading the MissionDrawer chunk until the manager taps missions.
  const [missionsMounted, setMissionsMounted] = useState(false);
  const [missionsTab, setMissionsTab] = useState<"daily" | "campaign">(
    "daily",
  );
  /** Temporary spotlight from Next Goal → upgrade card jump. */
  const [goalSpotlightKey, setGoalSpotlightKey] = useState<UpgradeKey | null>(
    null,
  );

  const openMissions = (tab: "daily" | "campaign") => {
    setMissionsTab(tab);
    setMissionsMounted(true);
    setMissionsOpen(true);
  };

  function focusUpgrade(key: UpgradeKey) {
    setGoalSpotlightKey(key);
    const jump = () => {
      document
        .getElementById(`club-upgrade-${key}`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    };
    jump();
    window.requestAnimationFrame(jump);
    window.setTimeout(() => setGoalSpotlightKey(null), 2200);
  }

  const canClaimNews = club.newsClaimable;
  const missionReadyCount = countMissionRewardsReady(dailyBoard, missionBoard);

  // Replay onboarding whistle once after createClub redirect (tutorialStep 0).
  useEffect(() => {
    if (step !== 0) return;
    try {
      if (sessionStorage.getItem("fb_onboard_chime") === "1") {
        sessionStorage.removeItem("fb_onboard_chime");
        playSound("whistle");
      }
    } catch {
      /* private mode */
    }
  }, [step]);

  function handleDailyNews() {
    if (newsPending) return;
    setError(null);
    setNewsPending(true);
    startTransition(async () => {
      const result = await claimDailyNews();
      setNewsPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNews({ payload: result.news, state: result.state });
      // Fresh / still-active → sync hub chip; cooldown clears claimable.
      if (result.state === "fresh" || result.state === "active") {
        const payload = result.news;
        setClub((c) => ({
          ...c,
          newsClaimable: false,
          activeNewsBooster: payload
            ? {
                type: payload.type,
                multiplier: payload.multiplier,
                headline: payload.headline,
                expiresAt: payload.expiresAt,
              }
            : c.activeNewsBooster,
        }));
        if (result.state === "fresh") {
          playSound("upgrade");
          haptic([30, 30, 60]);
        } else {
          haptic(HAPTIC.light);
        }
      } else {
        setClub((c) => ({ ...c, newsClaimable: false }));
        haptic(HAPTIC.light);
      }
    });
  }


  function handleUpgrade(key: UpgradeKey) {
    if (pendingKey) return;
    setError(null);
    setPendingKey(key);

    startTransition(async () => {
      const result = await upgradeClub(key);
      setPendingKey(null);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // FTUE graduation: the forced first upgrade just flipped step 1 → 2.
      if (step === 1 && result.club.tutorialStep === 2) {
        setJustGraduated(true);
        playSound("upgrade");
        haptic([30, 40, 60]);
        window.setTimeout(() => setJustGraduated(false), 3200);
      }

      setClub(result.club);
      setCelebrateKey((k) => k + 1);
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 1700);

      playSound("upgrade");
      haptic(HAPTIC.tap);
    });
  }

  return (
    <section className="relative flex flex-1 flex-col">
      {/* World: HUD + stadium share one pitch, not a stack of islands */}
      <div className="flex flex-col gap-2">
      {/* Hub top bar — Arena panel chrome */}
      <GamePanel tone="emerald" className="p-2.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-40"
          style={clubAccentWashStyle(colorKey)}
        />

        <header className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/profile"
              aria-label={t("profile.eyebrow")}
              className="game-icon-btn shrink-0 rounded-full p-0 transition-transform active:scale-95"
              style={clubAccentRingStyle(colorKey)}
            >
              <AvatarImage
                avatarKey={avatarKey}
                colorKey={colorKey}
                priority
                sizes="48px"
                className="h-12 w-12 rounded-full shadow-[0_3px_0_0_rgba(0,0,0,0.35)] ring-2 ring-white/20"
              />
            </Link>
            <h1 className="truncate font-display text-lg font-black leading-tight text-white drop-shadow-sm sm:text-xl">
              {club.name}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 rounded-2xl bg-black/30 p-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_3px_0_0_rgba(0,0,0,0.28)]">
            {ftueComplete && (
              <>
                <motion.button
                  type="button"
                  onClick={() => {
                    haptic(HAPTIC.light);
                    openMissions("daily");
                  }}
                  aria-label={t("missions.openDrawer")}
                  className="game-icon-btn relative"
                  whileTap={{ scale: 0.9 }}
                >
                  <HubIcon kind="mission" size="md" priority />
                  {missionReadyCount > 0 && (
                    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-display text-[10px] font-black text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
                      {toLocaleDigits(Math.min(missionReadyCount, 9), locale)}
                      {missionReadyCount > 9 ? "+" : ""}
                    </span>
                  )}
                </motion.button>

                {canClaimNews && (
                  <motion.button
                    type="button"
                    onClick={handleDailyNews}
                    disabled={newsPending}
                    aria-label={t("club.dailyNews")}
                    className="game-icon-btn relative"
                    whileTap={{ scale: 0.9 }}
                  >
                    <HubIcon kind="news" size="md" />
                    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-display text-[10px] font-black text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
                      {toLocaleDigits(1, locale)}
                    </span>
                  </motion.button>
                )}
              </>
            )}

            <Link
              href="/settings"
              aria-label={t("nav.settings")}
              onClick={() => playSound("click")}
              className="game-icon-btn active:scale-90"
            >
              <HubIcon kind="settings" size="md" />
            </Link>
          </div>
        </header>

        <div className="relative mt-2.5">
          <StatusBar
            coins={club.coins}
            stamina={club.stamina}
            maxStamina={club.maxStamina}
            msUntilNext={club.msUntilNext}
            medicalLevel={club.medicalLevel}
            staminaRefillCost={staminaRefillCost}
            onClubUpdate={setClub}
          />
        </div>
      </GamePanel>

      {/* First viewport essence: stadium world */}
      <div className="relative">
        <p className="mb-1 px-1 font-display text-xs font-black text-arena-muted">
          {t("club.yourStadium")}
        </p>
        <StadiumHero
          stadiumLevel={club.stadiumLevel}
          fans={club.fans}
          trainingGroundLevel={club.trainingGroundLevel}
          medicalLevel={club.medicalLevel}
          maxStamina={club.maxStamina}
          celebrateKey={celebrateKey}
          celebrating={celebrating}
        />
      </div>
      </div>

      {ftueComplete && (
        <NextGoalCard
          coinsPerWin={coinsPerWin}
          milestoneInput={{
            coins: club.coins,
            stadiumLevel: club.stadiumLevel,
            medicalLevel: club.medicalLevel,
            trainingGroundLevel: club.trainingGroundLevel,
          }}
          onFocusUpgrade={focusUpgrade}
        />
      )}

      <div className="hub-deck mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <GameIconWell size="sm" src="/icons/upgrade.png" />
          <h2 className="font-display text-lg font-black text-arena-fg">
            {t("club.upgrades")}
          </h2>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-display text-xs font-bold text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {UPGRADE_LIST.map((def) => {
          const level = getClubLevel(club, def.key);
          const cost = getUpgradeCost(def.key, level);
          const canAfford = cost !== null && club.coins >= cost;
          const isForcedStadium = step === 1 && def.key === "STADIUM";
          const locked =
            step === 0 || (step === 1 && def.key !== "STADIUM");
          return (
            <UpgradeCard
              key={def.key}
              id={`club-upgrade-${def.key}`}
              def={def}
              level={level}
              maxStamina={club.maxStamina}
              cost={cost}
              canAfford={canAfford}
              pending={pendingKey === def.key}
              locked={locked}
              spotlight={isForcedStadium || goalSpotlightKey === def.key}
              onUpgrade={() => handleUpgrade(def.key)}
            />
          );
        })}
      </div>

      {ftueComplete && (
        <div className="hub-deck mt-4 flex flex-col gap-2">
          <HubTodayRail
            mysteryStreak={club.mysteryStreak}
            campaignSeason={campaignSeason}
            activeNews={club.activeNewsBooster}
            onOpenCampaign={() => openMissions("campaign")}
            onOpenNews={handleDailyNews}
            onNewsExpired={() =>
              setClub((c) => ({ ...c, activeNewsBooster: null }))
            }
          />

          <DuelInboxBanner
            count={duelInboxCount}
            items={duelInboxItems}
            variant="club"
          />

          <BusinessPanel club={club} onClubUpdate={setClub} />
        </div>
      )}

      <AnimatePresence>
        {news && (
          <NewspaperModal
            key="newspaper"
            news={news.payload}
            state={news.state}
            onClaim={() => setNews(null)}
          />
        )}
      </AnimatePresence>

      {ftueComplete && missionsMounted && (
        <MissionDrawer
          open={missionsOpen}
          onOpenChange={setMissionsOpen}
          preferredTab={missionsTab}
          dailyBoard={dailyBoard}
          missionBoard={missionBoard}
          chapters={campaignSeason?.chapters ?? []}
          onEconomyUpdate={(balances) => {
            // Tick Hub coins when flying coins land on the status pill.
            window.setTimeout(() => {
              setClub((c) => ({ ...c, coins: balances.coins }));
            }, 820);
          }}
        />
      )}

      {/* FTUE Step 0 — full mask + coach CTA (above bottom nav, centered). */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            key="ftue-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 pb-[calc(theme(spacing.nav)+1rem)] backdrop-blur-sm sm:pb-4"
          >
            <FtueCoach
              avatarKey={avatarKey}
              name={avatarName}
              line={t("ftue.step0Line")}
              cta={{
                href: "/play/penalty?tutorial=true",
                label: t("ftue.step0Cta"),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FTUE Step 1 — dim the hub, spotlight the Stadium card (raised above). */}
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            key="ftue-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            key="ftue-coach-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4"
          >
            <FtueCoach
              avatarKey={avatarKey}
              name={avatarName}
              line={t("ftue.step1Line")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FTUE graduation — coach toast + confetti (clears bottom nav). */}
      <AnimatePresence>
        {justGraduated && (
          <motion.div
            key="ftue-graduated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center px-4 pb-[calc(theme(spacing.nav)+1rem)] sm:items-start sm:pt-3 sm:pb-0"
          >
            <div className="relative w-full max-w-mobile">
              <Confetti />
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1.04, 1] }}
                transition={{ duration: 0.45 }}
              >
                <FtueCoach
                  avatarKey={avatarKey}
                  name={avatarName}
                  line={t("ftue.gradLine")}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
