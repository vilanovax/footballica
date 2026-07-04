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
  missionStatus,
  type MissionStatus,
} from "@/lib/missions";
import type { ActivityReward as EconomyReward } from "@/lib/economy";

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

function ClubPathOverview({ items }: { items: MissionStatus[] }) {
  const done = items.filter((s) => s.claimed).length;
  const total = items.length;
  const currentIdx = items.findIndex((s) => !s.claimed);

  return (
    <GameCard variant="hero" className="club-path-overview mt-4 rounded-2xl p-3.5">
      <div className="club-path-overview__head">
        <div className="club-path-overview__copy">
          <p className="club-path-overview__eyebrow">فصل ۱</p>
          <p className="club-path-overview__title">ساخت باشگاه</p>
        </div>
        <span className="club-path-overview__count">
          {faNum(done)} از {faNum(total)}
        </span>
      </div>

      <div className="club-path-steps" aria-hidden>
        {items.map((s, i) => {
          const state = s.claimed
            ? "done"
            : i === currentIdx
              ? "current"
              : i < currentIdx
                ? "done"
                : "locked";
          return (
            <div key={s.def.id} className={`club-path-step club-path-step--${state}`}>
              <span className="club-path-step__node">
                {state === "done" ? "✓" : s.def.emoji}
              </span>
            </div>
          );
        })}
      </div>

      <p className="club-path-overview__hint">
        {done >= total
          ? "مسیر شروع تکمیل شد — تالار افتخارات را ادامه بده"
          : currentIdx >= 0
            ? `مرحلهٔ بعد: ${items[currentIdx]!.def.title}`
            : `${faNum(total - done)} مرحله باقی‌مانده`}
      </p>
    </GameCard>
  );
}

function DailyMissionCard({
  status,
  onClaim,
  shake,
}: {
  status: MissionStatus;
  onClaim: () => void;
  shake: boolean;
}) {
  const { def, progress, complete, claimed, claimable, pct } = status;

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
          <RewardLoot reward={def.reward} compact />
        </div>
        {claimable ? (
          <Button
            onClick={onClaim}
            variant="primary"
            size="sm"
            className="mission-daily-card__claim shrink-0 px-3"
          >
            دریافت
          </Button>
        ) : (
          <span className="mission-daily-card__pct shrink-0">{faNum(Math.round(pct))}٪</span>
        )}
      </div>
      {!claimed && (
        <div className="mission-daily-card__progress">
          <ProgressBar
            value={progress}
            max={def.target}
            tone={complete ? "success" : "money"}
            trackClassName="mission-daily-card__track h-1.5"
            fillClassName={complete ? "mission-progress__fill--done" : undefined}
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
                tone={complete ? "success" : "info"}
                trackClassName="h-1.5"
                fillClassName={complete ? "mission-progress__fill--done" : undefined}
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
          <h4 className="mission-medal__title">{def.title}</h4>
          <p className="mission-medal__detail">{def.detail}</p>
        </div>
      </div>

      {!claimed && !locked && (
        <div className="mission-medal__progress">
          <ProgressBar
            value={progress}
            max={def.target}
            tone={complete ? "money" : "success"}
            trackClassName="h-1"
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
}

export function Missions({ onBack }: MissionsProps) {
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

  const onboarding = ONBOARDING_MISSIONS.map((d) => missionStatus(d, snap));
  const daily = DAILY_MISSIONS.map((d) => missionStatus(d, snap));
  const achievements = ACHIEVEMENT_MISSIONS.map((d) => missionStatus(d, snap));

  const claimable = [...onboarding, ...daily, ...achievements].filter(
    (s) => s.claimable,
  ).length;

  const dailyReady = daily.filter((s) => s.claimable).length;
  const pathReady = onboarding.filter((s) => s.claimable).length;
  const trophyReady = achievements.filter((s) => s.claimable).length;

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
            <p className="mission-header__sub">مأموریت، جایزه، افتخار</p>
          </div>
          {claimable > 0 ? (
            <span className="mission-header-badge">{faNum(claimable)}</span>
          ) : (
            <span className="mission-header__spacer" aria-hidden />
          )}
        </div>

        <ClubPathOverview items={onboarding} />
      </header>

      <div className="missions-screen__body px-5 mt-5 space-y-7">
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
                shake={shakeId === s.def.id}
                onClaim={() => claim(s.def.id)}
              />
            ))}
          </div>
        </section>

        {activeOnboarding.length > 0 && (
          <section className="mission-section">
            <SectionHeader
              title="مسیر شروع باشگاه"
              sub="یک‌بار — کل loop را یاد بگیر"
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
            <SectionHeader title="مراحل تکمیل‌شده" icon="✅" />
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
            title="تالار افتخارات"
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
