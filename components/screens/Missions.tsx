"use client";

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

function formatReward(r: EconomyReward): string {
  const parts: string[] = [];
  if (r.xp > 0) parts.push(`${faNum(r.xp)} XP`);
  if (r.fans > 0) parts.push(`${faNum(r.fans)} هوادار`);
  if (r.vaultMoney > 0) parts.push(faMoney(r.vaultMoney));
  if (r.cards > 0) parts.push(`${faNum(r.cards)} 🃏`);
  return parts.join(" · ") || "—";
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
    <div
      className={`mission-card rounded-2xl p-4 ${
        claimable ? "mission-card--ready" : ""
      } ${claimed ? "mission-card--done" : ""} ${shake ? "animate-shake" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`text-3xl shrink-0 ${claimed ? "opacity-50 grayscale" : ""}`}
        >
          {def.emoji}
        </span>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {claimed && (
              <span className="mission-badge mission-badge--done text-[10px] font-bold px-2 py-0.5 rounded-md">
                ✓ گرفتی
              </span>
            )}
            {claimable && (
              <span className="mission-badge mission-badge--ready text-[10px] font-bold px-2 py-0.5 rounded-md">
                آماده
              </span>
            )}
            <p className="font-extrabold text-white">{def.title}</p>
          </div>
          <p className="mt-1 text-xs text-white/55 leading-5">{def.detail}</p>
          <p className="mt-1.5 text-[11px] font-bold text-gold-400/90">
            جایزه: {formatReward(def.reward)}
          </p>
          {!claimed && (
            <>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/45">
                <span>{faNum(Math.round(pct))}٪</span>
                <span>
                  {faNum(progress)} / {faNum(def.target)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full rounded-full transition-all ${
                    complete ? "bg-gold-400" : "bg-grass-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {claimable && (
        <button
          onClick={onClaim}
          className="btn-gold mt-3 w-full rounded-xl py-2.5 text-sm font-extrabold active:scale-[0.98] transition-transform"
        >
          دریافت جایزه
        </button>
      )}
    </div>
  );
}

function MissionSection({
  title,
  sub,
  items,
  onClaim,
  shakeId,
}: {
  title: string;
  sub?: string;
  items: MissionStatus[];
  onClaim: (id: string) => void;
  shakeId: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-lg font-extrabold text-white text-right">{title}</h3>
      {sub && <p className="mt-0.5 text-xs text-white/45 text-right">{sub}</p>}
      <div className="mt-3 space-y-2.5">
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
  const vaultWithdrawCount = useGame((s) => s.vaultWithdrawCount);
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
        vaultWithdrawCount,
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
      vaultWithdrawCount,
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
      setTimeout(() => setToast(null), 1500);
    } else {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
    }
  }

  const onboardingDone = onboarding.filter((s) => s.claimed).length;
  const onboardingTotal = onboarding.length;

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh pb-10">
      <header className="sticky top-0 z-10 mission-header px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="quiz-header-btn grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold"
            aria-label="بازگشت"
          >
            ›
          </button>
          <div className="text-right flex-1 px-3">
            <h1 className="text-xl font-extrabold text-white">ماموریت‌ها</h1>
            <p className="text-xs text-white/50 mt-0.5">
              راهنمای بازی + افتخارات
            </p>
          </div>
          {claimable > 0 && (
            <span className="mission-header-badge rounded-xl px-3 py-1.5 text-sm font-extrabold">
              {faNum(claimable)}
            </span>
          )}
        </div>

        <div className="mission-progress-summary mt-4 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-xs text-white/50">
            {faNum(onboardingDone)}/{faNum(onboardingTotal)} آموزشی
          </span>
          <span className="text-sm font-bold text-white/80">
            🎯 مسیر یادگیری باشگاه
          </span>
        </div>
      </header>

      {toast && (
        <p className="mx-5 mt-2 text-center text-sm font-bold text-grass-400 animate-pop">
          {toast}
        </p>
      )}

      <div className="px-5 mt-4 space-y-7">
        <MissionSection
          title="ماموریت‌های امروز"
          sub="هر شب reset می‌شوند"
          items={daily}
          onClaim={claim}
          shakeId={shakeId}
        />
        <MissionSection
          title="شروع بازی"
          sub="یک‌بار — کل loop را یاد بگیر"
          items={onboarding.filter((s) => !s.claimed)}
          onClaim={claim}
          shakeId={shakeId}
        />
        {onboarding.some((s) => s.claimed) && (
          <MissionSection
            title="تکمیل‌شده"
            items={onboarding.filter((s) => s.claimed)}
            onClaim={claim}
            shakeId={shakeId}
          />
        )}
        <MissionSection
          title="افتخارات"
          sub="کلکسیون بلندمدت"
          items={achievements}
          onClaim={claim}
          shakeId={shakeId}
        />
      </div>
    </div>
  );
}
