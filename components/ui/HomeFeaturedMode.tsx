"use client";

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
      <div className="home-featured mx-5 mt-4 rounded-3xl p-5 home-mode-card--disabled opacity-90">
        <div className="flex items-start gap-4">
          <span className="text-4xl grayscale opacity-50">{mode.emoji}</span>
          <div className="flex-1 text-right min-w-0">
            <span className="home-featured-badge home-mode-soon-badge inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold">
              ⭐ پیشنهادِ امروز
            </span>
            <h3 className="mt-2 text-lg font-extrabold text-white/45">{mode.title}</h3>
            <p className="text-sm text-white/35">{disabledReason ?? "فعلاً در دسترس نیست"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onPlay(mode.id)}
      className="home-featured home-featured--active mx-5 mt-4 w-[calc(100%-2.5rem)] rounded-3xl p-5 text-right active:scale-[0.98] transition-transform overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${mode.from}, ${mode.to})` }}
    >
      <span className="absolute -left-4 -bottom-4 text-[6rem] opacity-15 pointer-events-none">
        {mode.emoji}
      </span>
      <div className="relative flex items-start gap-4">
        <span className="text-4xl drop-shadow shrink-0">{mode.emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="home-featured-badge inline-block rounded-lg bg-black/25 px-2.5 py-0.5 text-[10px] font-bold">
            ⭐ پیشنهادِ امروز
          </span>
          <h3 className="mt-2 text-xl font-extrabold text-white">{mode.title}</h3>
          <p className="text-sm text-white/85 mt-0.5">{mode.subtitle}</p>
          <p className="mt-2 text-xs font-bold text-white/70">{mode.perk}</p>
        </div>
        <span className="shrink-0 self-center rounded-xl bg-gold-400 px-3 py-2 text-sm font-extrabold text-[#3a2600]">
          بازی ›
        </span>
      </div>
    </button>
  );
}
