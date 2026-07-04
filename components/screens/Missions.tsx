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

function RewardLoot({ reward }: { reward: EconomyReward }) {
  const chips: { label: string; kind: "xp" | "fans" | "vault" | "cards" }[] = [];
  if (reward.xp > 0) chips.push({ label: `${faNum(reward.xp)} XP`, kind: "xp" });
  if (reward.fans > 0) chips.push({ label: `${faNum(reward.fans)} هوادار`, kind: "fans" });
  if (reward.vaultMoney > 0) chips.push({ label: faMoney(reward.vaultMoney), kind: "vault" });
  if (reward.cards > 0) chips.push({ label: `${faNum(reward.cards)} 🃏`, kind: "cards" });

  if (chips.length === 0) return null;

  return (
    <div className="mission-loot">
      {chips.map((c) => (
        <span key={c.label} className={`mission-loot__chip mission-loot__chip--${c.kind}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

function MissionCard({
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
      variant={claimed ? "locked" : "asset"}
      highlight={claimable}
      className={`mission-card ${claimable ? "mission-card--ready" : ""} ${
        claimed ? "mission-card--done" : ""
      } ${complete && !claimed ? "mission-card--complete" : ""} ${
        shake ? "animate-shake" : ""
      }`}
    >
      {claimable && <div className="mission-card__shine" aria-hidden />}

      <div className="flex items-start gap-3">
        <div
          className={`mission-icon-well ${claimed ? "mission-icon-well--done" : ""}`}
          aria-hidden
        >
          {def.emoji}
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-start justify-end gap-2 flex-wrap">
            <h4 className="mission-card__title">{def.title}</h4>
            {claimed && <span className="mission-badge mission-badge--done">✓ گرفتی</span>}
            {claimable && <span className="mission-badge mission-badge--ready">آماده</span>}
          </div>

          <p className="mission-card__detail">{def.detail}</p>
          <RewardLoot reward={def.reward} />

          {!claimed && (
            <div className="mission-progress mt-3">
              <div className="mission-progress__labels">
                <span className="mission-progress__pct">{faNum(Math.round(pct))}٪</span>
                <span className="mission-progress__count">
                  {faNum(progress)} / {faNum(def.target)}
                </span>
              </div>
              <ProgressBar
                value={progress}
                max={def.target}
                tone={complete ? "success" : "money"}
                trackClassName="mission-progress__track h-2"
                fillClassName={`mission-progress__fill ${
                  complete ? "mission-progress__fill--done" : ""
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {claimable && (
        <Button
          onClick={onClaim}
          variant="primary"
          size="md"
          fullWidth
          className="mission-claim-btn mt-3"
        >
          دریافت جایزه
        </Button>
      )}
    </GameCard>
  );
}

function MissionSection({
  title,
  sub,
  icon,
  items,
  onClaim,
  shakeId,
}: {
  title: string;
  sub?: string;
  icon: string;
  items: MissionStatus[];
  onClaim: (id: string) => void;
  shakeId: string | null;
}) {
  if (items.length === 0) return null;

  const ready = items.filter((s) => s.claimable).length;

  return (
    <section className="mission-section">
      <div className="mission-section__head">
        <div className="text-right">
          <h3 className="mission-section__title">{title}</h3>
          {sub && <p className="mission-section__sub">{sub}</p>}
        </div>
        <div className="mission-section__icon" aria-hidden>
          {icon}
        </div>
        {ready > 0 && (
          <span className="mission-section__ready">{faNum(ready)}</span>
        )}
      </div>
      <div className="mt-3 space-y-3">
        {items.map((s) => (
          <MissionCard
            key={s.def.id}
            status={s}
            shake={shakeId === s.def.id}
            onClaim={() => onClaim(s.def.id)}
          />
        ))}
      </div>
    </section>
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

  const onboardingDone = onboarding.filter((s) => s.claimed).length;
  const onboardingTotal = onboarding.length;
  const pathPct =
    onboardingTotal > 0 ? (onboardingDone / onboardingTotal) * 100 : 0;

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh pb-10">
      <header className="mission-header sticky top-0 z-10 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="mission-back-btn"
            aria-label="بازگشت"
          >
            ›
          </button>
          <div className="flex-1 text-center">
            <h1 className="mission-header__title">ماموریت‌ها</h1>
            <p className="mission-header__sub">راهنمای بازی + افتخارات</p>
          </div>
          {claimable > 0 ? (
            <span className="mission-header-badge">{faNum(claimable)}</span>
          ) : (
            <span className="w-10" aria-hidden />
          )}
        </div>

        <GameCard
          variant="asset"
          className="mission-path mt-4 rounded-2xl p-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="mission-path__count">
              {faNum(onboardingDone)}/{faNum(onboardingTotal)}
            </span>
            <span className="mission-path__label">🎯 مسیر یادگیری باشگاه</span>
          </div>
          <ProgressBar
            value={onboardingDone}
            max={onboardingTotal}
            tone="info"
            trackClassName="mission-path__track h-2.5"
            fillClassName="mission-path__fill"
          />
          <p className="mission-path__hint mt-2">
            {onboardingDone >= onboardingTotal
              ? "مسیر آموزشی تکمیل شد — افتخارات را ادامه بده"
              : `${faNum(onboardingTotal - onboardingDone)} ماموریت آموزشی باقی‌مانده`}
          </p>
        </GameCard>
      </header>

      <div className="px-5 mt-5 space-y-7">
        <MissionSection
          title="ماموریت‌های امروز"
          sub="هر شب reset می‌شوند"
          icon="📅"
          items={daily}
          onClaim={claim}
          shakeId={shakeId}
        />
        <MissionSection
          title="شروع بازی"
          sub="یک‌بار — کل loop را یاد بگیر"
          icon="🚀"
          items={onboarding.filter((s) => !s.claimed)}
          onClaim={claim}
          shakeId={shakeId}
        />
        {onboarding.some((s) => s.claimed) && (
          <MissionSection
            title="تکمیل‌شده"
            icon="✅"
            items={onboarding.filter((s) => s.claimed)}
            onClaim={claim}
            shakeId={shakeId}
          />
        )}
        <MissionSection
          title="افتخارات"
          sub="کلکسیون بلندمدت"
          icon="🏅"
          items={achievements}
          onClaim={claim}
          shakeId={shakeId}
        />
      </div>

      {toast && <div className="mission-toast animate-pop">{toast}</div>}
    </div>
  );
}
