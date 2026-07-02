"use client";

import { useEffect, useRef, useState } from "react";
import { makeDeck } from "@/lib/questions";
import { useGame } from "@/lib/store";
import { rewardBomb } from "@/lib/economy";
import { faNum, faMoney } from "@/lib/format";
import { ReportButton } from "@/components/ui/ReportButton";
import { PowerUpBar } from "@/components/ui/PowerUpBar";
import { powerUpsForMode, POWERUP_CONFIG } from "@/lib/powerups";

interface BombModeProps {
  onExit: () => void;
}

const START_FUSE = 100;
const REWARD_CORRECT = 28;
const PENALTY_WRONG = 34;

const BOMB_PU = powerUpsForMode("bomb");

export function BombMode({ onExit }: BombModeProps) {
  const applyActivityReward = useGame((s) => s.applyActivityReward);
  const saveBomb = useGame((s) => s.saveBomb);
  const addTotalCorrect = useGame((s) => s.addTotalCorrect);
  const recordDailyPlay = useGame((s) => s.recordDailyPlay);
  const powerups = useGame((s) => s.powerups);
  const usePowerUp = useGame((s) => s.usePowerUp);

  const [deck] = useState(() => makeDeck());
  const [phase, setPhase] = useState<"play" | "boom">("play");
  const [fuse, setFuse] = useState(START_FUSE);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [defuseUsed, setDefuseUsed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [shakePu, setShakePu] = useState<string | null>(null);

  const scoreRef = useRef(0);
  const rewarded = useRef(false);

  const q = deck[step % deck.length];
  const low = fuse <= 30;

  useEffect(() => {
    if (phase !== "play") return;
    const iv = setInterval(() => {
      setFuse((f) =>
        Math.max(0, f - (1.6 + Math.min(2.6, scoreRef.current * 0.1))),
      );
    }, 100);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (fuse <= 0 && phase === "play") {
      setPhase("boom");
      if (!rewarded.current) {
        rewarded.current = true;
        const s = scoreRef.current;
        const rewards = rewardBomb(s);
        applyActivityReward(rewards);
        addTotalCorrect(s);
        recordDailyPlay();
        saveBomb(s);
      }
    }
  }, [fuse, phase, applyActivityReward, addTotalCorrect, recordDailyPlay, saveBomb]);

  function handleDefuse() {
    if (defuseUsed || phase !== "play") return;
    if (!usePowerUp("defuse")) {
      setShakePu("defuse");
      setTimeout(() => setShakePu(null), 400);
      return;
    }
    setDefuseUsed(true);
    const bonus = POWERUP_CONFIG.defuseBonus;
    setFuse((f) => Math.min(START_FUSE, f + bonus));
    setHint(`💣 +${faNum(bonus)} فتیله`);
    setTimeout(() => setHint(null), 1400);
  }

  function answer(i: number) {
    if (phase !== "play") return;
    if (i === q.correct) {
      scoreRef.current += 1;
      setScore((s) => s + 1);
      setFuse((f) => Math.min(START_FUSE, f + REWARD_CORRECT));
    } else {
      setFuse((f) => Math.max(0, f - PENALTY_WRONG));
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 300);
    }
    setStep((s) => s + 1);
  }

  function restart() {
    rewarded.current = false;
    scoreRef.current = 0;
    setScore(0);
    setFuse(START_FUSE);
    setStep(0);
    setPhase("play");
    setDefuseUsed(false);
    setHint(null);
  }

  const endRewards = rewardBomb(scoreRef.current);

  return (
    <div
      className={`pitch-stripes min-h-dvh flex flex-col ${
        wrongFlash ? "animate-shake" : ""
      }`}
      style={
        wrongFlash
          ? { boxShadow: "inset 0 0 80px rgba(229,71,63,0.5)" }
          : undefined
      }
    >
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={onExit}
          className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold"
          aria-label="خروج"
        >
          ‹
        </button>
        <h1 className="text-xl font-extrabold">💣 حالت بمب</h1>
        <div className="glass rounded-2xl px-4 py-2 text-center">
          <p className="text-xs text-white/55 leading-none">امتیاز</p>
          <p className="text-xl font-extrabold leading-tight">{faNum(score)}</p>
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center gap-3">
          <span className={`text-4xl ${low ? "fuse-pulse" : ""}`} aria-hidden>
            💣
          </span>
          <div className="relative flex-1 h-5 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-100 ease-linear"
              style={{
                width: `${fuse}%`,
                background: low
                  ? "linear-gradient(90deg,#e5473f,#ff8a3d)"
                  : "linear-gradient(90deg,#f5c542,#ff8a3d)",
              }}
            />
            <span
              className="absolute top-1/2 -translate-y-1/2 text-sm"
              style={{ insetInlineStart: `calc(${fuse}% - 8px)` }}
              aria-hidden
            >
              🔥
            </span>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-white/55">
          {low ? "!زود باش، داره منفجر می‌شه" : "قبل از انفجار جواب بده"}
        </p>
      </div>

      {hint && (
        <p className="mx-5 mt-2 text-center text-sm font-bold text-gold-400 animate-pop">
          {hint}
        </p>
      )}

      <PowerUpBar
        defs={BOMB_PU}
        inventory={powerups}
        disabled={{ defuse: defuseUsed }}
        onUse={() => handleDefuse()}
        shakeId={shakePu}
      />

      <div className="mx-5 mt-4 rounded-3xl bg-[#eef3ee] text-pitch-900 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <ReportButton questionId={q.id} />
          <span className="rounded-lg bg-team-foe/15 px-2.5 py-1 text-xs font-bold text-team-foe">
            💥 {q.league} · سریع جواب بده
          </span>
        </div>
        <p className="mt-3 text-xl font-extrabold leading-8 text-right">{q.text}</p>
      </div>

      <div className="px-5 mt-4 space-y-3 pb-8">
        {q.options.map((opt, i) => (
          <button
            key={`${step}-${i}`}
            onClick={() => answer(i)}
            className="w-full flex items-center gap-3 rounded-2xl border-2 border-pitch-500 bg-pitch-600 px-4 py-4 text-right font-bold active:scale-[0.98] transition"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/25 text-sm">
              {faNum(i + 1)}
            </span>
            <span className="flex-1">{opt}</span>
          </button>
        ))}
      </div>

      {phase === "boom" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 px-8 text-center">
          <div className="text-8xl animate-pop">💥</div>
          <h2 className="mt-4 text-4xl font-extrabold">منفجر شدی!</h2>
          <p className="mt-3 text-white/70">
            {faNum(scoreRef.current)} جوابِ درست پشتِ‌سرهم
          </p>

          <div className="glass mt-6 w-full max-w-xs rounded-3xl p-5 space-y-3">
            {endRewards.xp > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-extrabold">+{faNum(endRewards.xp)} ⭐</span>
                <span className="text-white/70">XP</span>
              </div>
            )}
            {endRewards.fans > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-grass-400">
                  +{faNum(endRewards.fans)} 🎽
                </span>
                <span className="text-white/70">هوادار</span>
              </div>
            )}
            {endRewards.vaultMoney > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-gold-400">
                  +{faMoney(endRewards.vaultMoney)} 🔐
                </span>
                <span className="text-white/70">گاوصندوق</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span
                className={`font-extrabold ${endRewards.cards > 0 ? "text-gold-400" : "text-white/40"}`}
              >
                {endRewards.cards > 0 ? "+۱ ⚡" : "—"}
              </span>
              <span className="text-white/70">
                کارت {endRewards.cards > 0 ? "" : "(۵ جواب لازم بود)"}
              </span>
            </div>
          </div>

          <div className="mt-6 w-full max-w-xs space-y-3">
            <button
              onClick={restart}
              className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold"
            >
              💣 دوباره
            </button>
            <button
              onClick={onExit}
              className="w-full rounded-2xl bg-white/10 py-3.5 font-bold text-white/80"
            >
              بازگشت به خانه
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
