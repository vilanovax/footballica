"use client";

import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import { faMoney, faNum } from "@/lib/format";
import {
  ONBOARDING_MISSIONS,
  DAILY_MISSIONS,
  ACHIEVEMENT_MISSIONS,
  buildMissionSnapshot,
  dailyMissionCtaLabel,
  dailyMissionNavTarget,
  firstClaimableMission,
  missionStatus,
  rewardLabel,
  type MissionNavTarget,
  type MissionStatus,
} from "@/lib/missions";
import type { ActivityReward as EconomyReward } from "@/lib/economy";
import {
  buildPromotionSnapshot,
  currentDivisionLabel,
  promotionGateStatus,
  type PromotionGateStatus,
  type PromotionRequirementStatus,
} from "@/lib/promotion";

function RewardLoot({
  reward,
  compact,
}: {
  reward: EconomyReward;
  compact?: boolean;
}) {
  const chips: { label: string; kind: "xp" | "fans" | "vault" | "cards" }[] = [];
  if (reward.xp > 0) chips.push({ label: `${faNum(reward.xp)} XP`, kind: "xp" });
  if (reward.fans > 0) chips.push({ label: `${faNum(reward.fans)} هوادار`, kind: "fans" });
  if (reward.vaultMoney > 0) chips.push({ label: faMoney(reward.vaultMoney), kind: "vault" });
  if (reward.cards > 0) chips.push({ label: `${faNum(reward.cards)} 🃏`, kind: "cards" });

  if (chips.length === 0) return null;

  return (
    <div className={`mission-loot ${compact ? "mission-loot--compact" : ""}`}>
      {chips.map((c) => (
        <span key={c.label} className={`mission-loot__chip mission-loot__chip--${c.kind}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

function SeasonPathOverview({
  gate,
  divisionLabel,
}: {
  gate: PromotionGateStatus;
  divisionLabel: string;
}) {
  const done = gate.completeCount;
  const total = gate.totalCount;
  const currentIdx = gate.requirements.findIndex((s) => !s.complete);

  return (
    <GameCard variant="hero" className="club-path-overview mt-4 rounded-2xl p-3.5">
      <div className="club-path-overview__head">
        <div className="club-path-overview__copy">
          <p className="club-path-overview__eyebrow">{gate.seasonTitle}</p>
          <p className="club-path-overview__title">{gate.title}</p>
        </div>
        <span className="club-path-overview__count">
          {faNum(done)} از {faNum(total)}
        </span>
      </div>

      <div className="club-path-steps" aria-hidden>
        {gate.requirements.map((s, i) => {
          const state = s.complete
            ? "done"
            : i === currentIdx
              ? "current"
              : i < currentIdx
                ? "done"
                : "locked";
          return (
            <div key={s.def.id} className={`club-path-step club-path-step--${state}`}>
              <span className="club-path-step__node">
                {state === "done" ? "✓" : faNum(i + 1)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="club-path-overview__hint">
        {gate.complete
          ? gate.terminal
            ? `${divisionLabel} تثبیت شده است — حالا افتخارات را ادامه بده`
            : "همه شرط‌ها کامل‌اند — صعود را claim کن"
          : gate.nextRequirement
            ? `مرحلهٔ بعد: ${gate.nextRequirement.def.label}`
            : `${faNum(total - done)} مرحله باقی‌مانده`}
      </p>
    </GameCard>
  );
}

function SeasonRequirementCard({
  status,
}: {
  status: PromotionRequirementStatus;
}) {
  const stateLabel =
    status.complete ? "تکمیل شد" : status.state === "near" ? "نزدیک است" : "مانده";

  return (
    <GameCard
      variant="asset"
      highlight={status.state === "near" && !status.complete}
      className="rounded-2xl p-4 text-right"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`club-season-gate__chip club-season-gate__chip--${status.state}`}>
          {stateLabel}
        </span>
        <div className="flex-1 min-w-0">
          <p className="club-season-gate__item-title">{status.def.label}</p>
          <p className="club-season-gate__item-progress">{status.progressLabel}</p>
          <p className="club-season-gate__item-hint">{status.def.hint}</p>
        </div>
      </div>
    </GameCard>
  );
}

function ReadyRewardsBanner({
  count,
  first,
  onClaim,
}: {
  count: number;
  first: MissionStatus;
  onClaim: () => void;
}) {
  return (
    <GameCard variant="asset" highlight className="mission-ready-banner">
      <div className="mission-ready-banner__row">
        <div className="mission-ready-banner__copy">
          <p className="mission-ready-banner__title">
            {faNum(count)} جایزه آماده دریافت داری
          </p>
          <p className="mission-ready-banner__sub">
            {first.def.title}
            <span className="mission-ready-banner__reward"> · {rewardLabel(first.def.reward)}</span>
          </p>
        </div>
        <Button onClick={onClaim} variant="primary" size="sm" className="shrink-0">
          دریافت
        </Button>
      </div>
    </GameCard>
  );
}

function DailyMissionCard({
  status,
  onClaim,
  onNavigate,
  shake,
}: {
  status: MissionStatus;
  onClaim: () => void;
  onNavigate: (target: MissionNavTarget) => void;
  shake: boolean;
}) {
  const { def, progress, claimed, claimable } = status;
  const navTarget = dailyMissionNavTarget(def.id);
  const ctaLabel = claimed
    ? "دریافت شد"
    : claimable
      ? "دریافت"
      : dailyMissionCtaLabel(def.id);

  return (
    <GameCard
      variant="asset"
      highlight={claimable}
      className={`mission-daily-card ${claimable ? "mission-daily-card--ready" : ""} ${
        shake ? "animate-shake" : ""
      }`}
    >
      <div className="mission-daily-card__row">
        <span className="mission-daily-card__icon" aria-hidden>
          {def.emoji}
        </span>
        <div className="mission-daily-card__main">
          <div className="mission-daily-card__title-row">
            <h4 className="mission-daily-card__title">{def.title}</h4>
            {claimable && (
              <span className="mission-badge mission-badge--ready">آماده</span>
            )}
          </div>
          <p className="mission-daily-card__detail">{def.detail}</p>
          <RewardLoot reward={def.reward} compact />
        </div>
        <Button
          onClick={claimed ? undefined : claimable ? onClaim : () => onNavigate(navTarget)}
          variant={claimable ? "primary" : claimed ? "success" : "secondary"}
          size="sm"
          className={`mission-daily-card__claim shrink-0 px-3 ${
            claimed ? "pointer-events-none" : ""
          }`}
        >
          {ctaLabel}
        </Button>
      </div>
      {!claimed && (
        <div className="mission-daily-card__progress">
          <ProgressBar
            value={progress}
            max={def.target}
            tone="success"
            trackClassName="mission-daily-card__track h-1.5"
          />
          <p className="mission-daily-card__count">
            {faNum(progress)} از {faNum(def.target)}
          </p>
        </div>
      )}
    </GameCard>
  );
}

function OnboardingStepCard({
  status,
  step,
  onClaim,
  shake,
}: {
  status: MissionStatus;
  step: number;
  onClaim: () => void;
  shake: boolean;
}) {
  const { def, progress, complete, claimed, claimable } = status;

  return (
    <GameCard
      variant={claimed ? "locked" : "asset"}
      highlight={claimable}
      className={`mission-step-card ${claimable ? "mission-step-card--ready" : ""} ${
        claimed ? "mission-step-card--done" : ""
      } ${shake ? "animate-shake" : ""}`}
    >
      <div className="mission-step-card__row">
        <div
          className={`mission-step-card__badge ${claimed ? "mission-step-card__badge--done" : ""}`}
        >
          {claimed ? "✓" : faNum(step)}
        </div>
        <span className="mission-step-card__emoji" aria-hidden>
          {def.emoji}
        </span>
        <div className="mission-step-card__main">
          <h4 className="mission-step-card__title">{def.title}</h4>
          <p className="mission-step-card__detail">{def.detail}</p>
          <RewardLoot reward={def.reward} compact />

          {!claimed && (
            <div className="mission-step-card__progress">
              <ProgressBar
                value={progress}
                max={def.target}
                tone="info"
                trackClassName="mission-step-card__track h-1.5"
              />
              <p className="mission-step-card__count">
                {faNum(progress)} از {faNum(def.target)}
              </p>
            </div>
          )}
        </div>
      </div>

      {claimable && (
        <Button
          onClick={onClaim}
          variant="primary"
          size="sm"
          fullWidth
          className="mission-step-card__claim"
        >
          دریافت جایزه
        </Button>
      )}
    </GameCard>
  );
}

function AchievementMedalCard({
  status,
  onClaim,
  shake,
}: {
  status: MissionStatus;
  onClaim: () => void;
  shake: boolean;
}) {
  const { def, progress, complete, claimed, claimable } = status;
  const locked = !complete && !claimable && !claimed;
  const statusTone = claimable
    ? "ready"
    : claimed
      ? "earned"
      : progress > 0
        ? "progress"
        : "locked";
  const statusLabel = claimable
    ? "قابل دریافت"
    : claimed
      ? "دریافت شد"
      : progress > 0
        ? "در مسیر"
        : "قفل";

  return (
    <GameCard
      variant={locked ? "locked" : "asset"}
      highlight={claimable}
      className={`mission-medal ${claimed ? "mission-medal--earned" : ""} ${
        claimable ? "mission-medal--ready" : ""
      } ${locked ? "mission-medal--locked" : ""} ${shake ? "animate-shake" : ""}`}
    >
      <div className="mission-medal__row">
        <div className="mission-medal__frame">
          <span className="mission-medal__emoji" aria-hidden>
            {def.emoji}
          </span>
          {claimed && <span className="mission-medal__earned-mark">✓</span>}
          {locked && <span className="mission-medal__lock">🔒</span>}
        </div>
        <div className="mission-medal__copy">
          <div className="mission-medal__title-row">
            <h4 className="mission-medal__title">{def.title}</h4>
            <span className={`mission-medal__status mission-medal__status--${statusTone}`}>
              {statusLabel}
            </span>
          </div>
          <p className="mission-medal__detail">{def.detail}</p>
        </div>
      </div>

      {!claimed && (
        <div className="mission-medal__progress">
          <ProgressBar
            value={progress}
            max={def.target}
            tone="money"
            trackClassName="mission-medal__track h-1.5"
            fillClassName={claimable ? "mission-progress__fill--done" : undefined}
          />
          <p className="mission-medal__count">
            {faNum(progress)} از {faNum(def.target)}
          </p>
        </div>
      )}

      {claimable && (
        <Button
          onClick={onClaim}
          variant="primary"
          size="sm"
          fullWidth
          className="mission-medal__claim"
        >
          دریافت
        </Button>
      )}
    </GameCard>
  );
}

function SectionHeader({
  title,
  sub,
  icon,
  ready,
}: {
  title: string;
  sub?: string;
  icon: string;
  ready?: number;
}) {
  return (
    <div className="mission-section__head">
      <span className="mission-section__icon" aria-hidden>
        {icon}
      </span>
      <div className="mission-section__copy">
        <h3 className="mission-section__title">{title}</h3>
        {sub && <p className="mission-section__sub">{sub}</p>}
      </div>
      {ready != null && ready > 0 && (
        <span className="mission-section__ready">{faNum(ready)}</span>
      )}
    </div>
  );
}

interface MissionsProps {
  onBack: () => void;
  onGoToGames: () => void;
  onGoToClub: () => void;
}

export function Missions({ onBack, onGoToGames, onGoToClub }: MissionsProps) {
  const gamesPlayed = useGame((s) => s.gamesPlayed);
  const totalCorrect = useGame((s) => s.totalCorrect);
  const unitCollectCount = useGame((s) => s.unitCollectCount);
  const vaultFillCount = useGame((s) => s.vaultFillCount);
  const matchesWon = useGame((s) => s.matchesWon);
  const streakDays = useGame((s) => s.streakDays);
  const bombBest = useGame((s) => s.bombBest);
  const fans = useGame((s) => s.fans);
  const setupDone = useGame((s) => s.setupDone);
  const units = useGame((s) => s.units);
  const hired = useGame((s) => s.hired);
  const assign = useGame((s) => s.assign);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const dailyProgress = useGame((s) => s.dailyProgress);
  const dailyDate = useGame((s) => s.dailyDate);
  const missionClaimed = useGame((s) => s.missionClaimed);
  const claimMission = useGame((s) => s.claimMission);
  const ensureDailyMissions = useGame((s) => s.ensureDailyMissions);
  const seasonStep = useGame((s) => s.seasonStep);
  const xp = useGame((s) => s.xp);

  const [shakeId, setShakeId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    ensureDailyMissions();
  }, [ensureDailyMissions]);

  const snap = useMemo(
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

  const onboarding = ONBOARDING_MISSIONS.map((d) => missionStatus(d, snap));
  const daily = DAILY_MISSIONS.map((d) => missionStatus(d, snap));
  const achievements = ACHIEVEMENT_MISSIONS.map((d) => missionStatus(d, snap));

  const claimable = [...onboarding, ...daily, ...achievements].filter(
    (s) => s.claimable,
  ).length;

  const dailyReady = daily.filter((s) => s.claimable).length;
  const pathReady = onboarding.filter((s) => s.claimable).length;
  const trophyReady = achievements.filter((s) => s.claimable).length;
  const firstReady = firstClaimableMission(snap);

  const activeOnboarding = onboarding.filter((s) => !s.claimed);
  const doneOnboarding = onboarding.filter((s) => s.claimed);

  function claim(id: string) {
    const res = claimMission(id);
    if (res === "ok") {
      setToast("جایزه دریافت شد ✓");
      setTimeout(() => setToast(null), 1800);
    } else {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  function goToTarget(target: MissionNavTarget) {
    if (target === "club") {
      onGoToClub();
      return;
    }
    onGoToGames();
  }

  return (
    <div className="missions-screen quiz-screen pitch-stripes min-h-dvh pb-10" dir="rtl">
      <header className="mission-header sticky top-0 z-10 px-5 pt-5 pb-4">
        <div className="mission-header__bar">
          <button
            type="button"
            onClick={onBack}
            className="mission-back-btn"
            aria-label="بازگشت"
          >
            ‹
          </button>
          <div className="mission-header__copy">
            <h1 className="mission-header__title">مسیر باشگاه</h1>
            <p className="mission-header__sub">
              {promotionGate.seasonTitle} · {currentDivisionLabel(seasonStep)}
            </p>
          </div>
          <span className="mission-header__spacer" aria-hidden />
        </div>

        <SeasonPathOverview
          gate={promotionGate}
          divisionLabel={currentDivisionLabel(seasonStep)}
        />
      </header>

      <div className="missions-screen__body px-5 mt-5 space-y-7">
        {firstReady && (
          <ReadyRewardsBanner
            count={claimable}
            first={firstReady}
            onClaim={() => claim(firstReady.def.id)}
          />
        )}

        <section className="mission-section">
          <SectionHeader
            title={promotionGate.title}
            sub={promotionGate.seasonTitle}
            icon="🏁"
            ready={promotionGate.complete && !promotionGate.terminal ? 1 : 0}
          />
          <div className="mission-section__list mission-section__list--steps">
            {promotionGate.requirements.map((req) => (
              <SeasonRequirementCard key={req.def.id} status={req} />
            ))}
          </div>
        </section>

        <section className="mission-section">
          <SectionHeader
            title="مأموریت‌های امروز"
            sub="هر شب از نو می‌شوند"
            icon="📅"
            ready={dailyReady}
          />
          <div className="mission-section__list">
            {daily.map((s) => (
              <DailyMissionCard
                key={s.def.id}
                status={s}
                onNavigate={goToTarget}
                shake={shakeId === s.def.id}
                onClaim={() => claim(s.def.id)}
              />
            ))}
          </div>
        </section>

        {activeOnboarding.length > 0 && (
          <section className="mission-section">
            <SectionHeader
              title="آموزش اولیه باشگاه"
              sub="یک‌بار — برای یادگیری loop پایه"
              icon="🚀"
              ready={pathReady}
            />
            <div className="mission-section__list mission-section__list--steps">
              {activeOnboarding.map((s) => (
                <OnboardingStepCard
                  key={s.def.id}
                  status={s}
                  step={onboarding.findIndex((o) => o.def.id === s.def.id) + 1}
                  shake={shakeId === s.def.id}
                  onClaim={() => claim(s.def.id)}
                />
              ))}
            </div>
          </section>
        )}

        {doneOnboarding.length > 0 && (
          <section className="mission-section">
            <SectionHeader title="آموزش‌های تکمیل‌شده" icon="✅" />
            <div className="mission-section__list mission-section__list--steps">
              {doneOnboarding.map((s) => (
                <OnboardingStepCard
                  key={s.def.id}
                  status={s}
                  step={onboarding.findIndex((o) => o.def.id === s.def.id) + 1}
                  shake={false}
                  onClaim={() => claim(s.def.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mission-section">
          <SectionHeader
            title="تالار افتخارات باشگاه"
            sub="کلکسیون بلندمدت"
            icon="🏅"
            ready={trophyReady}
          />
          <div className="mission-medal-grid">
            {achievements.map((s) => (
              <AchievementMedalCard
                key={s.def.id}
                status={s}
                shake={shakeId === s.def.id}
                onClaim={() => claim(s.def.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {toast && <div className="mission-toast animate-pop">{toast}</div>}
    </div>
  );
}
