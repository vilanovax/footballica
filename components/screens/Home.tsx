"use client";

import { useEffect, useMemo, useState } from "react";
import { ClubBankSheet } from "@/components/ui/ClubBankSheet";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { MODE_THEME_MAP } from "@/lib/designSystem";
import { unitDef, unitUpgradeCost } from "@/lib/units";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { useGame } from "@/lib/store";
import { faNum, faVaultM } from "@/lib/format";
import { levelInfo, formatRegenCountdown, msUntilNextLife } from "@/lib/player";
import { vaultCapacity, vaultUpgradeCost, isBank } from "@/lib/vault";
import {
  buildPromotionSnapshot,
  currentDivisionLabel,
  promotionGateStatus,
  seasonAdvisorMessage,
} from "@/lib/promotion";
import { fairPlayScore } from "@/lib/leaderboards";
import {
  buildMissionSnapshot,
  DAILY_MISSION_IDS,
  firstClaimableMission,
  rewardLabel,
} from "@/lib/missions";
import type { DuelKind } from "@/lib/types";

interface HomeProps {
  onPlayQuick: () => void;
  onOpenClub: () => void;
  onOpenMissions: () => void;
  onPlayBomb: () => void;
  onOpenGames: () => void;
  onPlayDuel: (kind?: DuelKind) => void;
  onPlayPenalty: () => void;
  onPlaySurvival: () => void;
  onOpenFairPlayLeaderboard?: () => void;
}

const MODE_DEFS = [
  {
    id: "bomb" as const,
    title: "حالت بمب",
    subtitle: "سرعتی · XP",
    emoji: MODE_THEME_MAP.bomb.emoji,
    from: MODE_THEME_MAP.bomb.from,
    to: MODE_THEME_MAP.bomb.to,
    play: "bomb" as const,
  },
  {
    id: "duel" as const,
    title: "دوئل ۱به۱",
    subtitle: "۵ سؤال · ۱ ❤️",
    emoji: MODE_THEME_MAP.duel.emoji,
    from: MODE_THEME_MAP.duel.from,
    to: MODE_THEME_MAP.duel.to,
    play: "duel" as const,
  },
  {
    id: "penalty" as const,
    title: "پنالتی",
    subtitle: "۵ ضربه",
    emoji: MODE_THEME_MAP.penalty.emoji,
    from: MODE_THEME_MAP.penalty.from,
    to: MODE_THEME_MAP.penalty.to,
    play: "penalty" as const,
  },
  {
    id: "survival" as const,
    title: "مود بقا",
    subtitle: "رکورد",
    emoji: MODE_THEME_MAP.survival.emoji,
    from: MODE_THEME_MAP.survival.from,
    to: MODE_THEME_MAP.survival.to,
    play: "survival" as const,
  },
] as const;

function HomeCompactHeader({
  clubName,
  level,
  divisionLabel,
  vaultLabel,
  cards,
  lives,
  onOpenVault,
}: {
  clubName: string;
  level: number;
  divisionLabel: string;
  vaultLabel: string;
  cards: number;
  lives: number;
  onOpenVault: () => void;
}) {
  return (
    <header className="home-v2-header px-5 pt-5 text-right">
      <div className="home-v2-header__shell">
        <div className="home-v2-header__top">
          <div className="home-v2-header__identity">
            <p className="home-v2-header__eyebrow">باشگاه تو</p>
            <h1 className="home-v2-header__title">{clubName}</h1>
            <div className="home-v2-header__meta">
              <span className="home-v2-header__chip">سطح {faNum(level)}</span>
              <span className="home-v2-header__chip home-v2-header__chip--accent">{divisionLabel}</span>
            </div>
          </div>

          <button type="button" onClick={onOpenVault} className="home-v2-header__vault">
            <span className="home-v2-header__vault-label">خزانه</span>
            <span className="home-v2-header__vault-value text-gold-400 tabular-nums">{vaultLabel}</span>
          </button>
        </div>

        <div className="home-v2-header__stats">
          <div className="home-v2-stat">
            <span className="home-v2-stat__label">کارت</span>
            <span className="home-v2-stat__value tabular-nums">{faNum(cards)}</span>
          </div>
          <div className="home-v2-stat">
            <span className="home-v2-stat__label">جان</span>
            <span className="home-v2-stat__value tabular-nums">{faNum(lives)}/۵</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function HomeLoopHeroes({
  arenaFirst,
  arenaRating,
  fairPlayValue,
  streakDays,
  canRanked,
  divisionLabel,
  vaultLabel,
  pendingIncome,
  onPlayQuick,
  onPlayRanked,
  onOpenClub,
  onOpenFairPlayLeaderboard,
}: {
  arenaFirst: boolean;
  arenaRating: number;
  fairPlayValue: number;
  streakDays: number;
  canRanked: boolean;
  divisionLabel: string;
  vaultLabel: string;
  pendingIncome: string | null;
  onPlayQuick: () => void;
  onPlayRanked: () => void;
  onOpenClub: () => void;
  onOpenFairPlayLeaderboard?: () => void;
}) {
  const arenaCard = (
    <GameCard variant="asset" className="home-loop-hero__card home-loop-hero__card--arena rounded-2xl p-3.5">
      <p className="home-loop-hero__eyebrow">زمین مسابقه</p>
      <p className="home-loop-hero__title">بازی سریع، رنک، دوئل</p>
      <p className="home-loop-hero__meta">
        رنک {faNum(arenaRating)} · Fair Play {faNum(fairPlayValue)} · استریک {faNum(streakDays)}
      </p>
      <div className="home-loop-hero__actions">
        <Button onClick={onPlayQuick} variant="primary" size="sm" fullWidth className="home-loop-hero__cta">
          بازی سریع
        </Button>
        <button
          type="button"
          onClick={onPlayRanked}
          disabled={!canRanked}
          className="home-loop-hero__secondary"
        >
          {canRanked ? "دوئل رنکد" : "نیاز ۱ ❤️"}
        </button>
        {onOpenFairPlayLeaderboard && (
          <button type="button" onClick={onOpenFairPlayLeaderboard} className="home-loop-hero__link">
            جدول
          </button>
        )}
      </div>
    </GameCard>
  );

  const clubCard = (
    <GameCard variant="asset" className="home-loop-hero__card home-loop-hero__card--club rounded-2xl p-3.5">
      <p className="home-loop-hero__eyebrow">باشگاه من</p>
      <p className="home-loop-hero__title">{divisionLabel}</p>
      <p className="home-loop-hero__meta">
        خزانه {vaultLabel}
        {pendingIncome ? ` · درآمد آماده ${pendingIncome}` : ""}
      </p>
      <div className="home-loop-hero__actions">
        <Button onClick={onOpenClub} variant="primary" size="sm" fullWidth className="home-loop-hero__cta">
          ورود به باشگاه
        </Button>
      </div>
    </GameCard>
  );

  return (
    <div className="home-loop-hero mx-5 mt-4 grid grid-cols-2 gap-2.5">
      {arenaFirst ? (
        <>
          {arenaCard}
          {clubCard}
        </>
      ) : (
        <>
          {clubCard}
          {arenaCard}
        </>
      )}
    </div>
  );
}

function HomeNextStep({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <GameCard variant="asset" className="home-next-step mx-5 mt-3 rounded-2xl p-3.5 text-right">
      <p className="home-next-step__eyebrow">قدم بعدی تو</p>
      <p className="home-next-step__title">{title}</p>
      <p className="home-next-step__detail">{detail}</p>
      <Button onClick={onAction} variant="primary" size="sm" fullWidth className="home-next-step__cta mt-3">
        {actionLabel}
      </Button>
    </GameCard>
  );
}

function HomeRewardReady({
  count,
  missionTitle,
  reward,
  onClaim,
  onOpenMissions,
}: {
  count: number;
  missionTitle: string;
  reward: string;
  onClaim: () => void;
  onOpenMissions: () => void;
}) {
  return (
    <GameCard variant="asset" className="home-reward-ready mx-5 mt-3 rounded-2xl p-3 text-right">
      <div className="flex items-center gap-3">
        <Button onClick={onClaim} variant="primary" size="sm" className="shrink-0">
          دریافت
        </Button>
        <button type="button" onClick={onOpenMissions} className="min-w-0 flex-1 text-right">
          <p className="home-reward-ready__title">جایزه آماده دریافت است</p>
          <p className="home-reward-ready__sub truncate">
            {missionTitle} · {reward}
          </p>
        </button>
        <span className="home-reward-ready__count">{faNum(count)}</span>
      </div>
    </GameCard>
  );
}

function HomeTodayStrip({
  claimableCount,
  dailyCount,
  arenaRating,
}: {
  claimableCount: number;
  dailyCount: number;
  arenaRating: number;
}) {
  return (
    <div className="home-today-strip mx-5 mt-3 rounded-xl px-3 py-2.5 text-right">
      <p className="home-today-strip__label">امروز</p>
      <p className="home-today-strip__value">
        {faNum(claimableCount)} جایزه آماده · {faNum(dailyCount)} مأموریت روزانه · رنک Arena{" "}
        {faNum(arenaRating)}
      </p>
    </div>
  );
}

function ModeCard({
  title,
  subtitle,
  emoji,
  from,
  to,
  disabled,
  disabledBadge,
  onClick,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  from: string;
  to: string;
  disabled?: boolean;
  disabledBadge?: string;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <GameCard
        variant="locked"
        className="home-mode-tile home-mode-tile--disabled rounded-2xl p-3 text-right"
      >
        <span className="home-mode-tile__emoji opacity-40 grayscale">{emoji}</span>
        <p className="home-mode-tile__title text-white/45">{title}</p>
        <p className="home-mode-tile__sub">{subtitle}</p>
        {disabledBadge && <span className="home-mode-tile__badge">{disabledBadge}</span>}
      </GameCard>
    );
  }

  return (
    <GameCard
      as="button"
      variant="hero"
      onClick={onClick}
      className="home-mode-tile rounded-2xl p-3 text-right"
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
    >
      <span className="home-mode-tile__emoji">{emoji}</span>
      <p className="home-mode-tile__title">{title}</p>
      <p className="home-mode-tile__sub">{subtitle}</p>
    </GameCard>
  );
}

export function Home({
  onPlayQuick,
  onOpenClub,
  onOpenMissions,
  onPlayBomb,
  onOpenGames,
  onPlayDuel,
  onPlayPenalty,
  onPlaySurvival,
  onOpenFairPlayLeaderboard,
}: HomeProps) {
  const [bankOpen, setBankOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const cards = useGame((s) => s.cards);
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const xp = useGame((s) => s.xp);
  const club = useGame((s) => s.club);
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const hired = useGame((s) => s.hired);
  const matchesWon = useGame((s) => s.matchesWon);
  const fans = useGame((s) => s.fans);
  const seasonStep = useGame((s) => s.seasonStep);
  const lives = useGame((s) => s.lives);
  const livesUpdatedAt = useGame((s) => s.livesUpdatedAt);
  const survivalBest = useGame((s) => s.survivalBest);
  const bombBest = useGame((s) => s.bombBest);
  const syncLives = useGame((s) => s.syncLives);
  const ensureDailyMissions = useGame((s) => s.ensureDailyMissions);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);
  const playerFocus = useGame((s) => s.playerFocus);
  const streakDays = useGame((s) => s.streakDays);
  const arenaRating = useGame((s) => s.arenaRating);
  const rankedWins = useGame((s) => s.rankedWins);
  const rankedLosses = useGame((s) => s.rankedLosses);
  const gamesPlayed = useGame((s) => s.gamesPlayed);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const unitCollectCount = useGame((s) => s.unitCollectCount);
  const vaultFillCount = useGame((s) => s.vaultFillCount);
  const setupDone = useGame((s) => s.setupDone);
  const dailyProgress = useGame((s) => s.dailyProgress);
  const dailyDate = useGame((s) => s.dailyDate);
  const missionClaimed = useGame((s) => s.missionClaimed);
  const claimMission = useGame((s) => s.claimMission);
  const claimableMissions = useGame((s) => s.claimableMissions);

  const { level } = levelInfo(xp);
  const regenIn = formatRegenCountdown(msUntilNextLife(lives, livesUpdatedAt));
  const canDuel = lives > 0;
  const bank = isBank(vaultLevel);
  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const vaultCap = vaultCapacity(vaultLevel);
  const vaultLabel = bank
    ? `${faVaultM(safeBudget)}م+`
    : `${faVaultM(safeBudget)}/${faVaultM(vaultCap)}م`;

  const clubSnap = unitIncomeSnapshot({
    units,
    itemLevels,
    assign,
    xp,
    fans,
    vaultLevel,
    budget: safeBudget,
    now,
  });
  const canCollectFromHome =
    clubSnap.readyCount > 0 && clubSnap.vaultFree > 0 && !bank && clubSnap.totalPending > 0;
  const homeVaultFull = clubSnap.vaultFull && !bank;
  const pendingIncome =
    canCollectFromHome && clubSnap.totalPending > 0
      ? `${faVaultM(clubSnap.totalPending)}م`
      : null;

  useEffect(() => {
    syncLives();
    ensureDailyMissions();
    const livesTimer = setInterval(syncLives, 30_000);
    const clubTimer = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      clearInterval(livesTimer);
      clearInterval(clubTimer);
    };
  }, [syncLives, ensureDailyMissions]);

  const promotionSnapshot = useMemo(
    () =>
      buildPromotionSnapshot({
        fans,
        vaultLevel,
        matchesWon,
        xp,
        units,
        hired,
        assign,
      }),
    [fans, vaultLevel, matchesWon, xp, units, hired, assign],
  );

  const promotionGate = useMemo(
    () => promotionGateStatus(seasonStep, promotionSnapshot),
    [seasonStep, promotionSnapshot],
  );

  const shopUpgradeCost = unitUpgradeCost(unitDef("shop"), units.shop?.level ?? 1);
  const foodUpgradeCost = unitUpgradeCost(unitDef("food"), units.food?.level ?? 1);
  const parkingUpgradeCost = unitUpgradeCost(unitDef("parking"), units.parking?.level ?? 1);
  const ticketsUpgradeCost = unitUpgradeCost(unitDef("tickets"), units.tickets?.level ?? 1);
  const academyUpgradeCost = unitUpgradeCost(unitDef("academy"), units.academy?.level ?? 1);
  const sponsorUpgradeCost = unitUpgradeCost(unitDef("sponsor"), units.sponsor?.level ?? 1);
  const nextVaultUpgradeCost = vaultUpgradeCost(vaultLevel);

  const homeAdvisor = useMemo(
    () =>
      seasonAdvisorMessage({
        seasonStep,
        snapshot: promotionSnapshot,
        budget: safeBudget,
        pendingIncome: clubSnap.totalPending,
        canCollect: canCollectFromHome,
        vaultFull: homeVaultFull,
        showVaultTutorial,
        upgradeCosts: {
          shop: shopUpgradeCost,
          food: foodUpgradeCost,
          parking: parkingUpgradeCost,
          tickets: ticketsUpgradeCost,
          academy: academyUpgradeCost,
          sponsor: sponsorUpgradeCost,
          vault: nextVaultUpgradeCost,
        },
      }),
    [
      seasonStep,
      promotionSnapshot,
      safeBudget,
      clubSnap.totalPending,
      canCollectFromHome,
      homeVaultFull,
      showVaultTutorial,
      shopUpgradeCost,
      foodUpgradeCost,
      parkingUpgradeCost,
      ticketsUpgradeCost,
      academyUpgradeCost,
      sponsorUpgradeCost,
      nextVaultUpgradeCost,
    ],
  );

  const missionSnap = useMemo(
    () =>
      buildMissionSnapshot({
        gamesPlayed,
        totalCorrect,
        unitCollectCount,
        vaultFillCount,
        matchesWon,
        streakDays,
        bombBest,
        fans,
        setupDone,
        units,
        hired,
        assign,
        vaultLevel,
        dailyProgress,
        dailyDate,
        missionClaimed,
      }),
    [
      gamesPlayed,
      totalCorrect,
      unitCollectCount,
      vaultFillCount,
      matchesWon,
      streakDays,
      bombBest,
      fans,
      setupDone,
      units,
      hired,
      assign,
      vaultLevel,
      dailyProgress,
      dailyDate,
      missionClaimed,
    ],
  );

  const claimableCount = claimableMissions();
  const firstClaimable = firstClaimableMission(missionSnap, seasonStep);
  const fairPlayValue = fairPlayScore({ arenaRating, rankedWins, rankedLosses });
  const divisionLabel = currentDivisionLabel(seasonStep);
  const arenaFirst = playerFocus !== "club";

  const nextStepAction = (() => {
    if (promotionGate.complete && !promotionGate.terminal) {
      return {
        title: "صعود آمادهٔ ثبت است",
        detail: "همه شرط‌های این فصل کامل شده‌اند.",
        label: promotionGate.claimLabel ?? "ثبت صعود",
        onClick: onOpenClub,
      };
    }
    if (canCollectFromHome) {
      return {
        title: "درآمد فروشگاه آماده است",
        detail: "جمع‌آوری کن و خزانه را برای قدم بعدی پر کن.",
        label: "رفتن به باشگاه",
        onClick: onOpenClub,
      };
    }
    if (homeVaultFull) {
      return {
        title: "خزانه جا کم آورده است",
        detail: "درآمد را جمع کن یا ظرفیت خزانه را ارتقا بده.",
        label: "مدیریت خزانه",
        onClick: () => setBankOpen(true),
      };
    }
    if (homeAdvisor.action === "play") {
      return {
        title: homeAdvisor.title,
        detail: homeAdvisor.detail,
        label: `برو برای ${homeAdvisor.focus}`,
        onClick: onPlayQuick,
      };
    }
    return {
      title: homeAdvisor.title,
      detail: homeAdvisor.detail,
      label: `برو برای ${homeAdvisor.focus}`,
      onClick: onOpenClub,
    };
  })();

  function playMode(id: (typeof MODE_DEFS)[number]["play"]) {
    if (id === "bomb") onPlayBomb();
    else if (id === "duel") onPlayDuel();
    else if (id === "penalty") onPlayPenalty();
    else onPlaySurvival();
  }

  function quickClaim() {
    if (!firstClaimable) {
      onOpenMissions();
      return;
    }
    const result = claimMission(firstClaimable.def.id);
    if (result !== "ok") onOpenMissions();
  }

  return (
    <div className="pitch-stripes min-h-dvh pb-28" dir="rtl">
      <HomeCompactHeader
        clubName={club.name}
        level={level}
        divisionLabel={divisionLabel}
        vaultLabel={vaultLabel}
        cards={cards}
        lives={lives}
        onOpenVault={() => setBankOpen(true)}
      />

      <ClubBankSheet open={bankOpen} onClose={() => setBankOpen(false)} />

      <HomeLoopHeroes
        arenaFirst={arenaFirst}
        arenaRating={arenaRating}
        fairPlayValue={fairPlayValue}
        streakDays={streakDays}
        canRanked={canDuel}
        divisionLabel={divisionLabel}
        vaultLabel={vaultLabel}
        pendingIncome={pendingIncome}
        onPlayQuick={onPlayQuick}
        onPlayRanked={() => onPlayDuel("ranked")}
        onOpenClub={onOpenClub}
        onOpenFairPlayLeaderboard={onOpenFairPlayLeaderboard}
      />

      <HomeNextStep
        title={nextStepAction.title}
        detail={nextStepAction.detail}
        actionLabel={nextStepAction.label}
        onAction={nextStepAction.onClick}
      />

      {claimableCount > 0 && firstClaimable && (
        <HomeRewardReady
          count={claimableCount}
          missionTitle={firstClaimable.def.title}
          reward={rewardLabel(firstClaimable.def.reward)}
          onClaim={quickClaim}
          onOpenMissions={onOpenMissions}
        />
      )}

      <HomeTodayStrip
        claimableCount={claimableCount}
        dailyCount={DAILY_MISSION_IDS.length}
        arenaRating={arenaRating}
      />

      <div className="home-section-head home-section-head--games px-5 mt-5 mb-2">
        <button type="button" onClick={onOpenGames} className="home-section-head__link active:opacity-70">
          همه مودها ›
        </button>
        <div className="text-right">
          <span className="home-section-head__eyebrow">مودهای بیشتر</span>
          <h3 className="home-section-head__title">بازی‌ها</h3>
        </div>
      </div>

      <div className="home-modes-grid px-5 grid grid-cols-2 gap-2.5">
        {MODE_DEFS.map((m) => {
          const subtitle =
            m.id === "survival"
              ? `رکورد ${faNum(survivalBest)}`
              : m.id === "duel" && !canDuel
                ? regenIn
                  ? `۱ ❤️ · ${regenIn}`
                  : "نیاز ۱ ❤️"
                : m.subtitle;

          if (m.id === "duel" && !canDuel) {
            return (
              <ModeCard
                key={m.id}
                title={m.title}
                subtitle={subtitle}
                emoji={m.emoji}
                from={m.from}
                to={m.to}
                disabled
                disabledBadge="بدون جان"
              />
            );
          }

          return (
            <ModeCard
              key={m.id}
              title={m.title}
              subtitle={subtitle}
              emoji={m.emoji}
              from={m.from}
              to={m.to}
              onClick={() => playMode(m.play)}
            />
          );
        })}
      </div>
    </div>
  );
}
