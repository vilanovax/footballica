"use client";

import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import { nextStreakRewardInfo, isStreakMilestoneDay } from "@/lib/home";

export function HomeStreakBar() {
  const streakDays = useGame((s) => s.streakDays);
  const lastPlayDate = useGame((s) => s.lastPlayDate);

  const streakDisplay = Math.min(streakDays, 7);
  const reward = nextStreakRewardInfo(streakDays, lastPlayDate);
  const playedToday = reward?.playedToday ?? false;

  return (
    <div className="home-streak-bar mx-5 mt-4 rounded-2xl p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-1.5 shrink-0 pt-1">
          {Array.from({ length: 7 }).map((_, i) => {
            const filled = i < streakDisplay;
            const milestone = isStreakMilestoneDay(i);
            return (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  filled
                    ? milestone
                      ? "bg-gold-400 ring-2 ring-gold-400/35"
                      : "bg-gold-400"
                    : milestone
                      ? "bg-white/10 ring-1 ring-gold-400/40"
                      : "bg-white/15"
                }`}
                title={milestone ? `پاداش روز ${faNum(i + 1)}` : undefined}
              />
            );
          })}
        </div>
        <div className="flex-1 text-right min-w-0">
          <p className="text-sm font-extrabold text-white/90">
            🔥 استریک:{" "}
            <span className="text-gold-400">{faNum(streakDays)} روز</span>
            {playedToday && (
              <span className="mr-2 text-[11px] font-bold text-grass-400">
                · امروز ✓
              </span>
            )}
          </p>
          {reward ? (
            <p className="mt-1 text-[11px] text-white/55 leading-5">
              پاداش روز {faNum(reward.targetDay)}:{" "}
              <b className="text-gold-400">{reward.label}</b>
              <span className="text-white/40"> · {reward.hint}</span>
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-grass-400">
              ✓ همهٔ پاداش‌های هفتگی را گرفتی!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
