"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubBankSheet } from "@/components/ui/ClubBankSheet";
import { Button } from "@/components/ui/Button";
import { ClubHomeBanner } from "@/components/ui/ClubHomeBanner";
import { GameCard } from "@/components/ui/GameCard";
import { HomeStreakBar } from "@/components/ui/HomeStreakBar";
import { HomeFeaturedMode } from "@/components/ui/HomeFeaturedMode";
import { HomeMissionBanner } from "@/components/ui/HomeMissionBanner";
import { MODE_THEME_MAP } from "@/lib/designSystem";
import { unitDef, unitUpgradeCost } from "@/lib/units";
import { unitIncomeSnapshot } from "@/lib/clubEconomy";
import { useGame } from "@/lib/store";
import { faNum, faVaultM } from "@/lib/format";
import { levelInfo, formatRegenCountdown, msUntilNextLife } from "@/lib/player";
import { featuredModeForDate, type FeaturedModeId } from "@/lib/home";
import { vaultCapacity, vaultUpgradeCost, isBank } from "@/lib/vault";
import {
  buildPromotionSnapshot,
  currentDivisionLabel,
  promotionGateStatus,
  seasonAdvisorMessage,
} from "@/lib/promotion";

interface HomeProps {
  onPlayQuick: () => void;
  onOpenClub: () => void;
  onOpenMissions: () => void;
  onPlayBomb: () => void;
  onOpenGames: () => void;
  onPlayDuel: () => void;
  onPlayPenalty: () => void;
  onPlaySurvival: () => void;
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
        className="home-mode-card home-mode-card--disabled h-32 rounded-2xl p-3.5 text-right flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="home-mode-card__emoji opacity-40 grayscale">{emoji}</span>
          {disabledBadge && (
            <span className="rounded-full home-mode-soon-badge px-2 py-0.5 text-[10px] font-bold">
              {disabledBadge}
            </span>
          )}
        </div>
        <div>
          <p className="home-mode-card__eyebrow">فعلا بسته</p>
          <h3 className="text-base font-extrabold text-white/45">{title}</h3>
          <p className="mt-1 text-[11px] text-white/35 leading-5">{subtitle}</p>
        </div>
      </GameCard>
    );
  }

  return (
    <GameCard
      as="button"
      variant="hero"
      onClick={onClick}
      className="home-mode-card h-32 rounded-2xl p-3.5 text-right flex flex-col justify-between"
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="home-mode-card__emoji drop-shadow">{emoji}</span>
        <span className="home-mode-card__cta">بازی کن</span>
      </div>
      <div>
        <p className="home-mode-card__eyebrow">حالت بازی</p>
        <h3 className="text-base font-extrabold text-white">{title}</h3>
        <p className="mt-1 text-[11px] text-white/80 leading-5">{subtitle}</p>
      </div>
    </GameCard>
  );
}

const MODE_DEFS = [
  {
    id: "bomb" as const,
    title: "حالت بمب",
    subtitle: "سرعتی · XP بیشتر",
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
    subtitle: "۵ ضربه · بدون جان",
    emoji: MODE_THEME_MAP.penalty.emoji,
    from: MODE_THEME_MAP.penalty.from,
    to: MODE_THEME_MAP.penalty.to,
    play: "penalty" as const,
  },
  {
    id: "survival" as const,
    title: "مود بقا",
    subtitle: "بدون جان · رکورد",
    emoji: MODE_THEME_MAP.survival.emoji,
    from: MODE_THEME_MAP.survival.from,
    to: MODE_THEME_MAP.survival.to,
    play: "survival" as const,
  },
] as const;

export function Home({
  onPlayQuick,
  onOpenClub,
  onOpenMissions,
  onPlayBomb,
  onOpenGames,
  onPlayDuel,
  onPlayPenalty,
  onPlaySurvival,
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
  const syncLives = useGame((s) => s.syncLives);
  const ensureDailyMissions = useGame((s) => s.ensureDailyMissions);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);

  const { level } = levelInfo(xp);
  const regenIn = formatRegenCountdown(msUntilNextLife(lives, livesUpdatedAt));
  const canDuel = lives > 0;
  const featured = featuredModeForDate();
  const bank = isBank(vaultLevel);
  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const vaultCap = vaultCapacity(vaultLevel);
  const shopLevel = units.shop?.level ?? 1;
  const hiredCount = Object.values(hired).filter(Boolean).length;
  const assignedCount = Object.values(assign).filter(Boolean).length;
  const shopUpgradeCost = unitUpgradeCost(unitDef("shop"), shopLevel);
  const foodUpgradeCost = unitUpgradeCost(unitDef("food"), units.food?.level ?? 1);
  const parkingUpgradeCost = unitUpgradeCost(unitDef("parking"), units.parking?.level ?? 1);
  const nextVaultUpgradeCost = vaultUpgradeCost(vaultLevel);
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

  function playFeatured(id: FeaturedModeId) {
    if (id === "bomb") onPlayBomb();
    else if (id === "duel") onPlayDuel();
    else if (id === "penalty") onPlayPenalty();
    else onPlaySurvival();
  }

  function playMode(id: (typeof MODE_DEFS)[number]["play"]) {
    if (id === "bomb") onPlayBomb();
    else if (id === "duel") onPlayDuel();
    else if (id === "penalty") onPlayPenalty();
    else onPlaySurvival();
  }

  const featuredDisabled = featured.id === "duel" && !canDuel;
  const featuredDisabledReason =
    featured.id === "duel" && !canDuel
      ? regenIn
        ? `نیاز ۱ ❤️ · ${regenIn}`
        : "نیاز ۱ ❤️"
      : undefined;

  const gridModes = MODE_DEFS.filter((m) => m.id !== featured.id);
  const playableModes = MODE_DEFS.filter((m) => m.id !== "duel" || canDuel).length;
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
      nextVaultUpgradeCost,
    ],
  );

  return (
    <div className="pitch-stripes min-h-dvh pb-32">
      <header className="px-5 pt-5">
        <button
          type="button"
          onClick={onOpenClub}
          className="home-topbar w-full text-right active:scale-[0.98] transition-transform"
        >
          <Avatar label={club.crest} color={club.color} size={52} />
          <div className="flex-1 min-w-0">
            <p className="home-topbar__eyebrow">اتاق فرمان امروز</p>
            <p className="text-lg font-extrabold leading-tight truncate text-white">
              {club.name}
            </p>
            <p className="text-xs text-gold-400 font-bold truncate mt-0.5">
              سطح {faNum(level)} · {currentDivisionLabel(seasonStep)}
            </p>
          </div>
          <span className="home-topbar__action">ورود به باشگاه</span>
        </button>

        <div className="mt-3 home-header-stats">
          <button
            type="button"
            onClick={() => setBankOpen(true)}
            className="home-header-stat home-header-stat--wide flex-1 min-w-0 rounded-xl px-3 py-2.5 text-right active:scale-[0.98]"
          >
            <p className="home-header-stat__label">خزانه</p>
            <p className="home-header-stat__value text-gold-400 tabular-nums truncate">
              {bank ? (
                <>🏦 {faVaultM(safeBudget)}م+</>
              ) : (
                <>
                  🔐 {faVaultM(safeBudget)}/{faVaultM(vaultCap)}م
                </>
              )}
            </p>
          </button>
          <div className="home-header-stat rounded-xl px-3 py-2.5 text-center shrink-0 min-w-16">
            <p className="home-header-stat__label">کارت</p>
            <p className="home-header-stat__value">🃏 {faNum(cards)}</p>
          </div>
          <div
            className="home-header-stat rounded-xl px-3 py-2.5 text-center shrink-0 min-w-16"
            title={regenIn && lives < 5 ? `جان بعدی: ${regenIn}` : undefined}
          >
            <p className="home-header-stat__label">جان</p>
            <p className="home-header-stat__value">
              ❤️ {faNum(lives)}/۵
            </p>
          </div>
        </div>
      </header>

      <ClubBankSheet open={bankOpen} onClose={() => setBankOpen(false)} />

      <div className="home-section-head px-5 mt-5">
        <span className="home-section-head__eyebrow">
          {promotionGate.seasonTitle} · {faNum(promotionGate.completeCount)} از {faNum(promotionGate.totalCount)} شرط
        </span>
        <h2 className="home-section-head__title">الان مهم‌ترین قدم برای صعود چیست؟</h2>
      </div>

      <HomeMissionBanner
        onOpenMissions={onOpenMissions}
        seasonTitle={promotionGate.seasonTitle}
        seasonFocus={homeAdvisor.focus}
      />

      <GameCard
        variant="hero"
        className="home-hero home-hero--primary home-command-hero mx-5 mt-4 rounded-3xl p-5"
      >
        <span className="absolute -left-4 -bottom-4 text-[7rem] opacity-12 leading-none pointer-events-none">
          ⚽
        </span>
        <div className="relative">
          <p className="home-command-hero__eyebrow">{homeAdvisor.eyebrow}</p>
          <h2 className="text-2xl font-extrabold text-white text-right mt-1">
            {homeAdvisor.title}
          </h2>
          <p className="mt-1.5 text-sm text-white/70 text-right leading-6">
            {homeAdvisor.detail}
          </p>
        </div>
        <div className="home-command-hero__chips">
          <span className="home-command-hero__chip">{homeAdvisor.focus}</span>
          <span className="home-command-hero__chip">{faNum(promotionGate.completeCount)} شرط کامل</span>
          <span className="home-command-hero__chip">
            {homeAdvisor.action === "play" ? "حرکت در زمین" : "حرکت در باشگاه"}
          </span>
        </div>
        <Button
          onClick={homeAdvisor.action === "play" ? onPlayQuick : onOpenClub}
          variant="primary"
          size="lg"
          fullWidth
          className="relative mt-4 text-lg"
        >
          {homeAdvisor.action === "play" ? "⚽ شروع بازی" : "🏟️ برو به باشگاه"}
        </Button>
      </GameCard>

      <HomeFeaturedMode
        mode={featured}
        disabled={featuredDisabled}
        disabledReason={featuredDisabledReason}
        onPlay={playFeatured}
      />

      <ClubHomeBanner
        onOpenClub={onOpenClub}
        seasonTitle={promotionGate.seasonTitle}
        advisorTitle={homeAdvisor.title}
        advisorAction={homeAdvisor.action}
        advisorFocus={homeAdvisor.focus}
      />

      <HomeStreakBar />

      <div className="home-section-head home-section-head--games px-5 mt-6 mb-2">
        <button
          type="button"
          onClick={onOpenGames}
          className="home-section-head__link active:opacity-70"
        >
          همه مودها ›
        </button>
        <div className="text-right">
          <span className="home-section-head__eyebrow">{faNum(playableModes)} مود قابل بازی</span>
          <h3 className="home-section-head__title">مودهای بازی</h3>
        </div>
      </div>

      <div className="px-5 grid grid-cols-2 gap-2.5">
        {gridModes.map((m) => {
          const subtitle =
            m.id === "survival"
              ? `بدون جان · رکورد ${faNum(survivalBest)}`
              : m.id === "duel" && !canDuel
                ? regenIn
                  ? `نیاز ۱ ❤️ · ${regenIn}`
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

      <GameCard
        as="button"
        variant="locked"
        onClick={onOpenGames}
        className="home-soon-link home-soon-card mx-5 mt-5 mb-2 w-[calc(100%-2.5rem)] rounded-2xl p-4 text-right"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="home-soon-card__lock">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="home-soon-card__eyebrow">به‌زودی</p>
            <p className="home-soon-card__title">تورنمنت و رقابت آنلاین</p>
            <p className="home-soon-card__sub">
              لیگ زنده، جدول هم‌زمان و رقابت مستقیم با بازیکن‌های دیگر.
            </p>
          </div>
        </div>
      </GameCard>
    </div>
  );
}
