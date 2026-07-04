"use client";

import { GameCard } from "@/components/ui/GameCard";
import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import { nextStreakRewardInfo, isStreakMilestoneDay } from "@/lib/home";

export function HomeStreakBar() {
  const streakDays = useGame((s) => s.streakDays);
  const lastPlayDate = useGame((s) => s.lastPlayDate);

  const streakDisplay = Math.min(streakDays, 7);
  const reward = nextStreakRewardInfo(streakDays, lastPlayDate);
  const playedToday = reward?.playedToday ?? false;

  if (streakDays === 0 && !playedToday) {
    return (
      <GameCard
        variant="locked"
        className="home-streak-bar home-streak-bar--slim mx-5 mt-3 rounded-xl px-3 py-2.5 text-right"
      >
        <p className="home-loop-card__eyebrow">استریک</p>
        <p className="text-[11px] text-white/58 leading-5">
          ۳ روز پیاپی بازی کن و <span className="text-gold-400/80">+۱ کارت</span> بگیر.
        </p>
      </GameCard>
    );
  }

  return (
    <GameCard
      variant="asset"
      className="home-streak-bar home-streak-bar--slim mx-5 mt-3 rounded-xl px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 shrink-0">
          {Array.from({ length: 7 }).map((_, i) => {
            const filled = i < streakDisplay;
            const milestone = isStreakMilestoneDay(i);
            return (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  filled
                    ? milestone
                      ? "bg-gold-400"
                      : "bg-gold-400/80"
                    : milestone
                      ? "bg-white/10 ring-1 ring-gold-400/30"
                      : "bg-white/12"
                }`}
              />
            );
          })}
        </div>
        <div className="flex-1 text-right min-w-0">
          <p className="home-loop-card__eyebrow">استریک</p>
          <p className="text-[11px] font-extrabold text-white/80 truncate">
            {faNum(streakDays)} روز
            {playedToday && <span className="text-grass-400 mr-1">· امروز ✓</span>}
            {reward && (
              <span className="text-white/40 font-bold mr-1">
                {" "}
                · {reward.hint}
              </span>
            )}
          </p>
        </div>
      </div>
    </GameCard>
  );
}
