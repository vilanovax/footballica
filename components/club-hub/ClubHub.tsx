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
import { nextMilestone } from "@/lib/club/milestones";
import { StatusBar } from "./StatusBar";
import { StadiumHero } from "./StadiumHero";
import { FtueCoach } from "./FtueCoach";
import { DuelInboxBanner } from "@/components/duel/DuelInboxBanner";
import type { DuelInboxItem } from "@/actions/duel/getInboxCount";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { CampaignSeasonView } from "@/lib/game/campaignSeason";
import type { LastMatchLine } from "@/lib/club/lastMatch";
import { HubTodayRail } from "@/components/club-hub/HubTodayRail";
import { HubDailyMissions } from "@/components/club-hub/HubDailyMissions";
import { MatchDoor } from "@/components/club-hub/MatchDoor";
import { ClubManageSheet } from "@/components/club-hub/ClubManageSheet";
import { GamePanel } from "@/components/ui/game/GamePanel";

// Heavy / deferred hub panels — keep first Club paint lean.
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
  /** Penalty door — same numbers as the Play screen. */
  matchPreview: {
    questionCount: number;
    approxCoins: number;
    staminaCost: number;
  };
  /** Active Draft Duel turns waiting for the manager. */
  duelInboxCount?: number;
  duelInboxItems?: DuelInboxItem[];
  missionBoard?: EvaluateMissionsResult | null;
  dailyBoard?: EvaluateMissionsResult | null;
  /** ADR 002 Campaign metagame snapshot (missions + RecordChallenge chapters). */
  campaignSeason?: CampaignSeasonView | null;
  lastMatch?: LastMatchLine | null;
  /** Open the manage sheet on mount (post-match upgrade deep link). */
  openManage?: boolean;
};

export function ClubHub({
  initialClub,
  staminaRefillCost,
  coinsPerWin,
  matchPreview,
  duelInboxCount = 0,
  duelInboxItems = [],
  missionBoard = null,
  dailyBoard = null,
  campaignSeason = null,
  lastMatch = null,
  openManage = false,
}: ClubHubProps) {
  const { t, locale } = useTranslation();
  const [club, setClub] = useState(initialClub);
  const [pendingKey, setPendingKey] = useState<UpgradeKey | null>(null);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Transient "You're ready!" greeting shown once on the 1 → 2 transition.
  const [justGraduated, setJustGraduated] = useState(false);
  const [manageOpen, setManageOpen] = useState(
    initialClub.tutorialStep === 1 || openManage,
  );
  const [, startTransition] = useTransition();

  const step = club.tutorialStep;
  const avatarKey = (club.avatar ?? "TACTICAL_COACH") as AvatarKey;
  const avatarName = t(`avatars.${avatarKey}.name`);
  const colorKey = club.colorKey ?? DEFAULT_CLUB_COLOR_KEY;
  // Daily News only unlocks once the FTUE is fully complete (tutorialStep 2).
  const ftueComplete = step === 2;

  // Clear ?manage=1 from the URL without remounting the hub.
  useEffect(() => {
    if (!openManage) return;
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("manage=1")) return;
    window.history.replaceState(null, "", "/club");
  }, [openManage]);

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
    setManageOpen(true);
    setGoalSpotlightKey(key);
    const jump = () => {
      document
        .getElementById(`club-upgrade-${key}`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    };
    window.requestAnimationFrame(jump);
    window.setTimeout(jump, 320);
    window.setTimeout(() => setGoalSpotlightKey(null), 2200);
  }

  useEffect(() => {
    if (step === 1) setManageOpen(true);
  }, [step]);

  const canClaimNews = club.newsClaimable;
  const missionReadyCount = countMissionRewardsReady(dailyBoard, missionBoard);
  const milestoneInput = {
    coins: club.coins,
    stadiumLevel: club.stadiumLevel,
    medicalLevel: club.medicalLevel,
    trainingGroundLevel: club.trainingGroundLevel,
  };
  const upgradeReady =
    ftueComplete && Boolean(nextMilestone(milestoneInput)?.affordable);

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
        setManageOpen(false);
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

      {ftueComplete && (
        <MatchDoor
          stamina={club.stamina}
          maxStamina={club.maxStamina}
          msUntilNext={club.msUntilNext}
          medicalLevel={club.medicalLevel}
          questionCount={matchPreview.questionCount}
          approxCoins={matchPreview.approxCoins}
          staminaCost={matchPreview.staminaCost}
          coinsPerWin={coinsPerWin}
          milestoneInput={milestoneInput}
          lastMatch={lastMatch}
        />
      )}

      {ftueComplete && (
        <HubDailyMissions
          board={dailyBoard}
          onOpen={() => openMissions("daily")}
        />
      )}

      {ftueComplete && (
        <div className="flex flex-col gap-2">
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
        </div>
      )}

      <div className="relative">
        <p className="mb-1 px-1 font-display text-xs font-black text-arena-muted">
          {t("club.yourStadium")}
        </p>
        <StadiumHero
          stadiumLevel={club.stadiumLevel}
          fans={club.fans}
          trainingGroundLevel={club.trainingGroundLevel}
          medicalLevel={club.medicalLevel}
          celebrateKey={celebrateKey}
          celebrating={celebrating}
          upgradeReady={upgradeReady}
          onOpenManage={() => setManageOpen(true)}
        />
      </div>
      </div>

      <ClubManageSheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        dismissible={step !== 1}
        club={club}
        coinsPerWin={coinsPerWin}
        pendingKey={pendingKey}
        goalSpotlightKey={goalSpotlightKey}
        error={error}
        showBusiness={ftueComplete}
        tutorialStep={step}
        onUpgrade={handleUpgrade}
        onFocusUpgrade={focusUpgrade}
        onClubUpdate={setClub}
        coach={
          step === 1 ? (
            <FtueCoach
              avatarKey={avatarKey}
              name={avatarName}
              line={t("ftue.step1Line")}
            />
          ) : undefined
        }
      />

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

      {/* FTUE Step 1 lives inside the manage sheet (coach + locked upgrades). */}
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
