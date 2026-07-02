"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Quiz } from "@/components/screens/Quiz";
import { faNum } from "@/lib/format";
import { OPPONENT, PLAYER, type MatchResult } from "@/lib/types";
import { ECONOMY } from "@/lib/economy";

interface DuelProps {
  onFinish: (result: MatchResult) => void;
  onExit: () => void;
}

export function Duel({ onFinish, onExit }: DuelProps) {
  const [started, setStarted] = useState(false);

  if (started) {
    return <Quiz mode="duel" opponent={OPPONENT} onFinish={onFinish} />;
  }

  return (
    <div className="pitch-stripes min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <button
        onClick={onExit}
        className="glass absolute top-6 right-5 grid h-10 w-10 place-items-center rounded-2xl text-xl"
        aria-label="خروج"
      >
        ›
      </button>

      <p className="text-white/60 font-bold">⚔️ دوئل ۱به۱</p>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex flex-col items-center gap-2 animate-rise">
          <Avatar label="تو" color="you" size={92} />
          <p className="font-extrabold">{PLAYER.name}</p>
          <p className="text-xs text-white/50">سطح {faNum(PLAYER.level)}</p>
        </div>
        <span className="text-4xl font-extrabold text-gold-400 animate-pop">
          VS
        </span>
        <div
          className="flex flex-col items-center gap-2 animate-rise"
          style={{ animationDelay: "0.12s" }}
        >
          <Avatar label={OPPONENT.short} color="foe" size={92} />
          <p className="font-extrabold">{OPPONENT.name}</p>
          <p className="text-xs text-white/50">حریفِ هم‌رده</p>
        </div>
      </div>

      <div className="glass mt-10 rounded-2xl px-5 py-4 text-sm leading-7 text-white/70">
        ۵ سؤال · فقط <b className="text-white">دانش و سرعت</b> تعیین‌کننده است
        <br />
        برد: <b className="text-grass-400">+{faNum(ECONOMY.fans.winDuel)} هوادار</b>{" "}
        برای صعود
      </div>

      <button
        onClick={() => setStarted(true)}
        className="btn-gold mt-8 w-full max-w-xs rounded-2xl py-4 text-xl font-extrabold"
      >
        شروع دوئل
      </button>
    </div>
  );
}
