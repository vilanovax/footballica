"use client";

import { GameCard } from "@/components/ui/GameCard";
import type { FeaturedModeDef, FeaturedModeId } from "@/lib/home";

interface HomeFeaturedModeProps {
  mode: FeaturedModeDef;
  disabled?: boolean;
  disabledReason?: string;
  onPlay: (id: FeaturedModeId) => void;
}

export function HomeFeaturedMode({
  mode,
  disabled,
  disabledReason,
  onPlay,
}: HomeFeaturedModeProps) {
  if (disabled) {
    return (
      <GameCard
        variant="locked"
        className="home-featured-compact home-mode-card--disabled mx-5 mt-3 rounded-2xl p-3.5 opacity-90"
      >
        <div className="flex items-center gap-3">
          <span className="home-featured__emoji text-2xl grayscale opacity-50 shrink-0">{mode.emoji}</span>
          <div className="flex-1 text-right min-w-0">
            <p className="home-loop-card__eyebrow">پیشنهاد امروز</p>
            <p className="text-sm font-extrabold text-white/45">{mode.title}</p>
            <p className="text-[11px] text-white/35">{disabledReason}</p>
          </div>
        </div>
      </GameCard>
    );
  }

  return (
    <GameCard
      as="button"
      variant="hero"
      onClick={() => onPlay(mode.id)}
      className="home-featured-compact home-featured-compact--active mx-5 mt-3 w-[calc(100%-2.5rem)] rounded-2xl p-3.5 text-right"
      style={{ background: `linear-gradient(135deg, ${mode.from}, ${mode.to})` }}
    >
      <div className="relative flex items-center gap-3">
        <span className="home-featured__cta shrink-0 self-center rounded-lg bg-gold-400 px-2.5 py-1.5 text-[11px] font-extrabold text-[#3a2600]">
          ورود
        </span>
        <div className="flex-1 min-w-0">
          <p className="home-loop-card__eyebrow home-loop-card__eyebrow--light">پیشنهاد امروز</p>
          <p className="text-base font-extrabold text-white leading-tight">
            <span className="home-featured__emoji">{mode.emoji}</span> {mode.title}
          </p>
          <p className="text-[11px] text-white/80 mt-0.5">{mode.perk}</p>
        </div>
      </div>
    </GameCard>
  );
}
