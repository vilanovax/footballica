"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Avatar } from "@/components/ui/Avatar";
import { faNum, faMoney } from "@/lib/format";
import { useGame } from "@/lib/store";
import type { MatchResult } from "@/lib/types";
import { OPPONENT } from "@/lib/types";

interface ResultProps {
  result: MatchResult;
  onHome: () => void;
  onReplay: () => void;
}

export function Result({ result, onHome, onReplay }: ResultProps) {
  const won = result.youScore >= result.foeScore;
  const isDuel = result.mode === "duel";
  const applyActivityReward = useGame((s) => s.applyActivityReward);
  const addTotalCorrect = useGame((s) => s.addTotalCorrect);
  const recordDailyPlay = useGame((s) => s.recordDailyPlay);
  const recordWin = useGame((s) => s.recordWin);
  const club = useGame((s) => s.club);
  const credited = useRef(false);
  const [vaultOverflow, setVaultOverflow] = useState(0);

  const correctCount = result.outcomes.filter((o) => o.youCorrect).length;

  useEffect(() => {
    if (credited.current) return;
    credited.current = true;
    const { overflow } = applyActivityReward({
      xp: result.xpEarned,
      fans: result.fansEarned,
      vaultMoney: result.vaultEarned,
      cards: result.cardsEarned,
    });
    if (overflow > 0) setVaultOverflow(overflow);
    addTotalCorrect(correctCount);
    recordDailyPlay();
    if (won) recordWin();
  }, [
    result,
    won,
    correctCount,
    applyActivityReward,
    addTotalCorrect,
    recordDailyPlay,
    recordWin,
  ]);

  useEffect(() => {
    if (!won) return;
    const end = Date.now() + 900;
    const tick = () => {
      confetti({
        particleCount: 4,
        spread: 70,
        startVelocity: 45,
        origin: { x: Math.random(), y: 0 },
        colors: ["#f5c542", "#2f9e5f", "#2f6fed", "#e5473f", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [won]);

  return (
    <div className="pitch-stripes min-h-dvh flex flex-col items-center px-5 pt-8 pb-8">
      <div className="text-6xl animate-pop">{won ? "🏆" : "😔"}</div>
      <h1 className="mt-3 text-4xl font-extrabold">
        {won ? (isDuel ? "دوئل را بردی!" : "بردی!") : "باختی"}
      </h1>

      <div className="mt-4 w-full max-w-sm space-y-2">
        {result.xpEarned > 0 && (
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="font-extrabold text-white/90">
              +{faNum(result.xpEarned)} ⭐ XP
            </span>
            <span className="text-sm text-white/50">تجربه</span>
          </div>
        )}
        {result.fansEarned > 0 && (
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="font-extrabold text-grass-400">
              +{faNum(result.fansEarned)} 🎽 هوادار
            </span>
            <span className="text-sm text-white/50">محبوبیت</span>
          </div>
        )}
        {result.vaultEarned > 0 && (
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between ring-1 ring-gold-500/30">
            <span className="font-extrabold text-gold-400">
              +{faMoney(result.vaultEarned)} 🔐
            </span>
            <span className="text-sm text-white/50 text-left leading-5">
              درآمد مسابقه
              <br />
              <span className="text-gold-400/80">وارد گاوصندوق شد</span>
            </span>
          </div>
        )}
        {result.cardsEarned > 0 && (
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="font-extrabold text-gold-400">
              +{faNum(result.cardsEarned)} ⚡ کارت
            </span>
            <span className="text-sm text-white/50">تاکتیکی</span>
          </div>
        )}
        {vaultOverflow > 0 && (
          <p className="text-center text-xs text-team-foe leading-5">
            گاوصندوق پر بود — {faMoney(vaultOverflow)} از درآمد از دست رفت.
            برداشت یا ارتقا بده.
          </p>
        )}
      </div>

      {isDuel && (
        <p className="mt-3 text-sm text-white/55">
          {won ? "به صعودت نزدیک‌تر شدی" : "این‌بار نشد — دوباره تلاش کن"}
        </p>
      )}

      {/* کارتِ VS */}
      <div className="glass mt-6 w-full rounded-3xl p-5 flex items-center justify-between">
        <div className="flex flex-col items-center gap-2">
          <Avatar label={OPPONENT.short} color="foe" size={68} />
          <p className="text-sm text-white/70">{OPPONENT.name}</p>
          <p className="text-3xl font-extrabold">{faNum(result.foeScore)}</p>
        </div>
        <div className="text-center">
          <span className="rounded-lg border border-gold-500/50 px-3 py-1.5 text-sm font-extrabold text-gold-400">
            VS
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar label={club.crest} color={club.color} size={68} crown={won} />
          <p className="text-sm text-white/70">{club.name}</p>
          <p className="text-3xl font-extrabold text-gold-400">
            {faNum(result.youScore)}
          </p>
        </div>
      </div>

      {/* مرورِ سؤال‌ها */}
      <p className="mt-6 mb-3 text-white/60 font-bold">
        {faNum(result.outcomes.length)} سؤالِ این راند
      </p>
      <div className="w-full space-y-2.5">
        {result.outcomes.map((o, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="flex gap-2">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-sm ${o.foeCorrect ? "bg-grass-500/30 text-grass-400" : "bg-team-foe/25 text-team-foe"}`}
              >
                {o.foeCorrect ? "✓" : "✕"}
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-sm ${o.youCorrect ? "bg-team-you/30 text-blue-300" : "bg-team-foe/25 text-team-foe"}`}
              >
                {o.youCorrect ? "✓" : "✕"}
              </span>
            </div>
            <p className="flex-1 min-w-0 truncate text-right font-bold text-sm">
              {o.label}
            </p>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-500/20 text-gold-400 text-sm font-extrabold">
              {faNum(i + 1)}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full flex items-center justify-center gap-3 mt-3 text-sm text-white/60">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-team-you inline-block" /> تو
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-team-foe inline-block" /> حریف
        </span>
      </div>

      {/* دکمه‌ها */}
      <div className="w-full mt-6 space-y-3">
        <button
          onClick={onReplay}
          className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold"
        >
          ⚡ بازیِ دوباره
        </button>
        <button
          onClick={onHome}
          className="w-full rounded-2xl bg-white/10 py-3.5 font-bold text-white/80"
        >
          بازگشت به خانه
        </button>
      </div>
    </div>
  );
}
