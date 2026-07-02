"use client";

import { ECONOMY } from "@/lib/economy";
import { formatRegenCountdown, msUntilNextLife } from "@/lib/player";
import { faNum } from "@/lib/format";

interface NoLivesModalProps {
  lives: number;
  livesUpdatedAt: number;
  onClose: () => void;
}

export function NoLivesModal({
  lives,
  livesUpdatedAt,
  onClose,
}: NoLivesModalProps) {
  const ms = msUntilNextLife(lives, livesUpdatedAt);
  const countdown = formatRegenCountdown(ms);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 px-5 pb-10">
      <div className="w-full max-w-[460px] animate-rise rounded-3xl bg-pitch-800 p-6 text-center">
        <div className="text-5xl">❤️</div>
        <h2 className="mt-3 text-2xl font-extrabold">جان تمام شد!</h2>
        <p className="mt-2 text-sm text-white/60 leading-7">
          بازی سریع و دوئل هر کدام {faNum(1)} جان می‌گیرند.
          <br />
          هر {faNum(ECONOMY.lives.regenMinutes)} دقیقه یک جان برمی‌گردد
          {countdown ? ` · بعدی: ${countdown}` : ""}.
        </p>
        <button
          onClick={onClose}
          className="btn-gold mt-6 w-full rounded-2xl py-4 text-lg font-extrabold"
        >
          باشه
        </button>
      </div>
    </div>
  );
}
