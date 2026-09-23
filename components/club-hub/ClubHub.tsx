"use client";

import {
  useState,
  useTransition,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { upgradeClub } from "@/actions/upgradeClub";
import {
  claimDailyNews,
  type NewsPayload,
  type NewsState,
} from "@/actions/claimDailyNews";
import { refreshClubBusiness } from "@/actions/club/refreshBusiness";
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
import type { LastMatchLine } from "@/lib/club/lastMatch";
import { MatchDoor } from "@/components/club-hub/MatchDoor";
import { GamePanel } from "@/components/ui/game/GamePanel";
import {
  ClubHubDataProvider,
  useClubHubData,
} from "@/components/club-hub/clubHubData";

// Heavy / deferred hub panels — keep first Club paint lean (MatchDoor + HUD).
const MissionDrawer = dynamic(() =>
  import("@/components/profile/MissionDrawer").then((m) => m.MissionDrawer),
);
const Confetti = dynamic(() =>
  import("./Confetti").then((m) => m.Confetti),
);
const NewspaperModal = dynamic(() =>
  import("./NewspaperModal").then((m) => m.NewspaperModal),
);
const StadiumHero = dynamic(
  () => import("./StadiumHero").then((m) => m.StadiumHero),
  { loading: () => <StadiumHeroFallback /> },
);
const ClubManageSheet = dynamic(() =>
  import("./ClubManageSheet").then((m) => m.ClubManageSheet),
);
const FtueCoach = dynamic(() =>
  import("./FtueCoach").then((m) => m.FtueCoach),
);

function StadiumHeroFallback() {
  return (
    <div
      className="aspect-2/1 w-full animate-pulse rounded-bubble-xl bg-[hsl(var(--arena-mid)/0.55)] shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.12)]"
      aria-hidden
    />
  );
}

type ClubHubProps = {
  initialClub: ClubSnapshot;
  staminaRefillCost: number;
  coinsPerWin: number;
  matchPreview: {
    questionCount: number;
    approxCoins: number;
    staminaCost: number;
  };
  lastMatch?: LastMatchLine | null;
  openManage?: boolean;
  needsBusinessSettle?: boolean;
  /** Streamed rails (missions / today / duel) — pass Suspense as children. */
  children?: ReactNode;
};

export function ClubHub({
  initialClub,
  staminaRefillCost,
  coinsPerWin,
  matchPreview,
  lastMatch = null,
  openManage = false,
  needsBusinessSettle = false,
  children = null,
}: ClubHubProps) {
  const { t, locale } = useTranslation();
  const [club, setClub] = useState(initialClub);
  const [pendingKey, setPendingKey] = useState<UpgradeKey | null>(null);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justGraduated, setJustGraduated] = useState(false);
  const [manageOpen, setManageOpen] = useState(
    initialClub.tutorialStep === 1 || openManage,
  );
  // Keep sheet chunk unloaded until first open (except FTUE step 1 / deep link).
  const [manageMounted, setManageMounted] = useState(
    initialClub.tutorialStep === 1 || openManage,
  );
  const [, startTransition] = useTransition();
  const businessSettledRef = useRef(!needsBusinessSettle);

  const step = club.tutorialStep;
  const avatarKey = (club.avatar ?? "TACTICAL_COACH") as AvatarKey;
  const avatarName = t(`avatars.${avatarKey}.name`);
  const colorKey = club.colorKey ?? DEFAULT_CLUB_COLOR_KEY;
  const ftueComplete = step === 2;
  // FTUE step 1 locks the manage sheet open until the first stadium buy.
  const sheetOpen = step === 1 || manageOpen;

  function openManageSheet() {
    setManageMounted(true);
    setManageOpen(true);
  }

  useEffect(() => {
    if (!openManage) return;
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("manage=1")) return;
    window.history.replaceState(null, "", "/club");
  }, [openManage]);

  // Land at the top after match whistle / manage deep-link so MatchDoor is first.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, []);

  const [news, setNews] = useState<{
    payload: NewsPayload | null;
    state: NewsState;
  } | null>(null);
  const [newsPending, setNewsPending] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [missionsMounted, setMissionsMounted] = useState(false);
  const [missionsTab, setMissionsTab] = useState<"daily" | "campaign">(
    "daily",
  );
  const [goalSpotlightKey, setGoalSpotlightKey] = useState<UpgradeKey | null>(
    null,
  );

  const openMissions = useCallback((tab: "daily" | "campaign") => {
    setMissionsTab(tab);
    setMissionsMounted(true);
    setMissionsOpen(true);
  }, []);

  const onBalances = useCallback((balances: { coins: number; xp: number }) => {
    setClub((c) => ({ ...c, coins: balances.coins }));
  }, []);

  const onNewsExpired = useCallback(() => {
    setClub((c) => ({ ...c, activeNewsBooster: null }));
  }, []);

  const handleDailyNews = useCallback(() => {
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
  }, [newsPending]);

  function focusUpgrade(key: UpgradeKey) {
    openManageSheet();
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
    if (!sheetOpen || businessSettledRef.current) return;
    businessSettledRef.current = true;
    startTransition(async () => {
      const res = await refreshClubBusiness();
      if (res.ok) setClub(res.club);
    });
  }, [sheetOpen]);

  const canClaimNews = club.newsClaimable;
  const milestoneInput = {
    coins: club.coins,
    stadiumLevel: club.stadiumLevel,
    medicalLevel: club.medicalLevel,
    trainingGroundLevel: club.trainingGroundLevel,
  };
  const upgradeReady =
    ftueComplete && Boolean(nextMilestone(milestoneInput)?.affordable);

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
    <ClubHubDataProvider
      openMissions={openMissions}
      onOpenNews={handleDailyNews}
      onNewsExpired={onNewsExpired}
      onBalances={onBalances}
      setClub={setClub}
    >
      <section className="relative flex flex-1 flex-col">
        <div className="flex flex-col gap-2">
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
                    <MissionBadgeButton
                      onOpen={() => {
                        haptic(HAPTIC.light);
                        openMissions("daily");
                      }}
                      label={t("missions.openDrawer")}
                      locale={locale}
                    />

                    {canClaimNews && (
                      <button
                        type="button"
                        onClick={handleDailyNews}
                        disabled={newsPending}
                        aria-label={t("club.dailyNews")}
                        className="game-icon-btn relative active:scale-90"
                      >
                        <HubIcon kind="news" size="md" />
                        <span className="absolute -inset-e-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-display text-[10px] font-black text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
                          {toLocaleDigits(1, locale)}
                        </span>
                      </button>
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
              coins={club.coins}
              staminaRefillCost={staminaRefillCost}
              onClubUpdate={setClub}
              milestoneInput={milestoneInput}
              lastMatch={lastMatch}
            />
          )}

          {ftueComplete ? children : null}

          <div
            className="relative"
            style={{ contentVisibility: "auto", containIntrinsicSize: "0 180px" }}
          >
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
              onOpenManage={openManageSheet}
            />
          </div>
        </div>

        {manageMounted && (
          <ClubManageSheet
            open={sheetOpen}
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
        )}
        {news ? (
          <NewspaperModal
            key="newspaper"
            news={news.payload}
            state={news.state}
            onClaim={() => setNews(null)}
          />
        ) : null}

        {ftueComplete && missionsMounted && (
          <HubMissionDrawer
            open={missionsOpen}
            onOpenChange={setMissionsOpen}
            preferredTab={missionsTab}
            onEconomyUpdate={(balances) => {
              window.setTimeout(() => {
                setClub((c) => ({ ...c, coins: balances.coins }));
              }, 820);
            }}
          />
        )}

        {step === 0 ? (
          <div
            key="ftue-gate"
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 pb-[calc(var(--spacing-nav)+1rem)] backdrop-blur-sm animate-status-sheet-fade sm:pb-4"
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
          </div>
        ) : null}

        {justGraduated ? (
          <div
            key="ftue-graduated"
            className="pointer-events-none fixed inset-0 z-60 flex items-center justify-center px-4 pb-[calc(var(--spacing-nav)+1rem)] animate-status-sheet-fade sm:items-start sm:pt-3 sm:pb-0"
          >
            <div className="relative w-full max-w-mobile">
              <Confetti />
              <div className="animate-status-sheet-rise">
                <FtueCoach
                  avatarKey={avatarKey}
                  name={avatarName}
                  line={t("ftue.gradLine")}
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </ClubHubDataProvider>
  );
}

function MissionBadgeButton({
  onOpen,
  label,
  locale,
}: {
  onOpen: () => void;
  label: string;
  locale: "en" | "fa";
}) {
  const { boards } = useClubHubData();
  const missionReadyCount = countMissionRewardsReady(
    boards.dailyBoard,
    boards.missionBoard,
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="game-icon-btn relative active:scale-90"
    >
      <HubIcon kind="mission" size="md" priority />
      {missionReadyCount > 0 && (
        <span className="absolute -inset-e-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-display text-[10px] font-black text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]">
          {toLocaleDigits(Math.min(missionReadyCount, 9), locale)}
          {missionReadyCount > 9 ? "+" : ""}
        </span>
      )}
    </button>
  );
}

function HubMissionDrawer({
  open,
  onOpenChange,
  preferredTab,
  onEconomyUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferredTab: "daily" | "campaign";
  onEconomyUpdate: (balances: { coins: number; xp: number }) => void;
}) {
  const { boards } = useClubHubData();
  return (
    <MissionDrawer
      open={open}
      onOpenChange={onOpenChange}
      preferredTab={preferredTab}
      dailyBoard={boards.dailyBoard}
      missionBoard={boards.missionBoard}
      chapters={boards.campaignSeason?.chapters ?? []}
      onEconomyUpdate={onEconomyUpdate}
    />
  );
}
