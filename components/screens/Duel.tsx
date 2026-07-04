"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { GameCard } from "@/components/ui/GameCard";
import { Quiz } from "@/components/screens/Quiz";
import { faNum } from "@/lib/format";
import { OPPONENT, type DuelKind, type MatchResult } from "@/lib/types";
import { ECONOMY } from "@/lib/economy";
import { useGame } from "@/lib/store";
import { useClubAvatar } from "@/lib/clubAvatar";
import { levelInfo } from "@/lib/player";
import { DUEL_KIND_OPTIONS, duelKindLabel } from "@/lib/duel";

interface DuelProps {
  onFinish: (result: MatchResult) => void;
  onExit: () => void;
  defaultKind?: DuelKind;
}

export function Duel({ onFinish, onExit, defaultKind }: DuelProps) {
  const [kind, setKind] = useState<DuelKind | null>(defaultKind ?? null);
  const [started, setStarted] = useState(false);
  const club = useGame((s) => s.club);
  const clubAvatar = useClubAvatar();
  const xp = useGame((s) => s.xp);
  const arenaRating = useGame((s) => s.arenaRating);
  const { level } = levelInfo(xp);

  if (started && kind) {
    return (
      <Quiz mode="duel" duelKind={kind} opponent={OPPONENT} onFinish={onFinish} />
    );
  }

  if (!kind) {
    return (
      <div className="pitch-stripes min-h-dvh flex flex-col px-5 pb-10 pt-6" dir="rtl">
        <button
          onClick={onExit}
          className="glass self-end grid h-10 w-10 place-items-center rounded-2xl text-xl"
          aria-label="خروج"
        >
          ›
        </button>

        <header className="mt-4 text-right">
          <p className="duel-picker__eyebrow">⚔️ دوئل ۱به۱</p>
          <h1 className="duel-picker__title">کدام نوع رقابت؟</h1>
          <p className="duel-picker__sub">
            دوئل دوستانه برای تمرین و پاداش است؛ رنکد فقط skill را اندازه می‌گیرد.
          </p>
        </header>

        <div className="mt-6 space-y-3">
          {DUEL_KIND_OPTIONS.map((opt) => (
            <GameCard
              key={opt.id}
              as="button"
              variant="asset"
              onClick={() => setKind(opt.id)}
              className={`duel-kind-card duel-kind-card--${opt.id} w-full rounded-2xl p-4 text-right`}
            >
              <div className="flex items-start gap-3">
                <span className="duel-kind-card__emoji" aria-hidden>
                  {opt.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="duel-kind-card__title">{opt.title}</p>
                  <p className="duel-kind-card__detail">{opt.detail}</p>
                  <p className="duel-kind-card__rules">{opt.rules}</p>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      </div>
    );
  }

  const isRanked = kind === "ranked";

  return (
    <div className="pitch-stripes min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <button
        onClick={() => {
          if (defaultKind) onExit();
          else setKind(null);
        }}
        className="glass absolute top-6 right-5 grid h-10 w-10 place-items-center rounded-2xl text-xl"
        aria-label="بازگشت"
      >
        ›
      </button>

      <p className="text-white/60 font-bold">{duelKindLabel(kind)}</p>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex flex-col items-center gap-2 animate-rise">
          <Avatar label={clubAvatar.label} color={clubAvatar.color} size={92} />
          <p className="font-extrabold">{club.name}</p>
          <p className="text-xs text-white/50">سطح {faNum(level)}</p>
        </div>
        <span className="text-4xl font-extrabold text-gold-400 animate-pop">VS</span>
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
        {isRanked ? (
          <>
            رنکد: <b className="text-grass-400">رتبه Arena</b> · بدون پاورآپ
            <br />
            رتبه فعلی: <b className="text-gold-400">{faNum(arenaRating)}</b>
          </>
        ) : (
          <>
            برد:{" "}
            <b className="text-grass-400">+{faNum(ECONOMY.fans.duelWin)} هوادار</b> برای صعود
            <br />
            کمک تاکتیکی در این حالت مجاز است
          </>
        )}
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
