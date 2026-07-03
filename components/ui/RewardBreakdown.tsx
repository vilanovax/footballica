"use client";

import { faNum, faMoney } from "@/lib/format";

export interface RewardBreakdownProps {
  xp?: number;
  fans?: number;
  vault?: number;
  cards?: number;
  vaultNote?: string;
  compact?: boolean;
}

export function RewardBreakdown({
  xp = 0,
  fans = 0,
  vault = 0,
  cards = 0,
  vaultNote,
  compact,
}: RewardBreakdownProps) {
  const hasAny = xp > 0 || fans > 0 || vault > 0 || cards > 0;
  if (!hasAny) return null;

  return (
    <div className={`w-full space-y-2 ${compact ? "" : "max-w-sm"}`}>
      {xp > 0 && (
        <div className="quiz-reward-row">
          <span className="text-sm font-medium text-white/60">تجربه</span>
          <span className="flex items-center gap-1.5 font-extrabold text-gold-400">
            <span className="result-xp-star" aria-hidden>⭐</span>
            +{faNum(xp)} XP
          </span>
        </div>
      )}
      {fans > 0 && (
        <div className="quiz-reward-row">
          <span className="text-sm text-white/50">هوادار</span>
          <span className="font-extrabold text-grass-400">+{faNum(fans)} 🎽</span>
        </div>
      )}
      {vault > 0 && (
        <div className="quiz-reward-row quiz-reward-row--gold">
          <span className="text-sm text-white/50 text-left leading-5">
            درآمد
            {vaultNote && (
              <>
                <br />
                <span className="text-gold-400/75 text-xs">{vaultNote}</span>
              </>
            )}
          </span>
          <span className="font-extrabold text-gold-400">+{faMoney(vault)} 🔐</span>
        </div>
      )}
      {cards > 0 && (
        <div className="quiz-reward-row">
          <span className="text-sm text-white/50">تاکتیکی</span>
          <span className="font-extrabold text-gold-400">+{faNum(cards)} 🃏</span>
        </div>
      )}
    </div>
  );
}
