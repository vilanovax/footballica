"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { makeDeck, drawOneExcluding } from "@/lib/questions";
import { rewardSurvival } from "@/lib/economy";
import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import { ReportButton } from "@/components/ui/ReportButton";
import { PowerUpBar } from "@/components/ui/PowerUpBar";
import {
  powerUpsForMode,
  powerUpCount,
  POWERUP_CONFIG,
  type PowerUpId,
} from "@/lib/powerups";

interface SurvivalProps {
  onExit: () => void;
}

const START_LIVES = 3;

const SURVIVAL_PU = powerUpsForMode("survival").filter((p) => p.id !== "glove");

function timeForScore(score: number): number {
  return Math.max(4, 10 - Math.floor(score / 3));
}

export function Survival({ onExit }: SurvivalProps) {
  const applyActivityReward = useGame((s) => s.applyActivityReward);
  const saveSurvival = useGame((s) => s.saveSurvival);
  const addTotalCorrect = useGame((s) => s.addTotalCorrect);
  const recordDailyPlay = useGame((s) => s.recordDailyPlay);
  const best = useGame((s) => s.survivalBest);
  const powerups = useGame((s) => s.powerups);
  const usePowerUp = useGame((s) => s.usePowerUp);

  const [deck, setDeck] = useState(() => makeDeck());
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [timeLimit, setTimeLimit] = useState(timeForScore(0));
  const [secondsLeft, setSecondsLeft] = useState<number>(timeForScore(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"play" | "over">("play");
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(() => new Set());
  const [usedOnQuestion, setUsedOnQuestion] = useState({
    half: false,
    time: false,
    swap: false,
  });
  const [gloveUsedMatch, setGloveUsedMatch] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [shakePu, setShakePu] = useState<string | null>(null);

  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const finalized = useRef(false);
  const isRecordRef = useRef(false);

  const q = deck[step % deck.length];

  useEffect(() => {
    if (phase !== "play" || revealed) return;
    if (secondsLeft <= 0) {
      answer(null);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, revealed, phase]);

  function resetQuestionState(nextScore: number) {
    const base = timeForScore(nextScore);
    setHiddenOptions(new Set());
    setUsedOnQuestion({ half: false, time: false, swap: false });
    setTimeLimit(base);
    setSecondsLeft(base);
    setSelected(null);
    setRevealed(false);
    setHint(null);
  }

  function answer(choice: number | null) {
    if (revealed || phase !== "play") return;

    if (
      choice !== null &&
      choice !== q.correct &&
      !gloveUsedMatch &&
      powerUpCount(powerups, "glove") > 0 &&
      usePowerUp("glove")
    ) {
      setGloveUsedMatch(true);
      setHint("🥅 دستکش طلایی! دوباره تلاش کن");
      setTimeout(() => setHint(null), 1400);
      return;
    }

    const correct = choice === q.correct;
    setSelected(choice);
    setRevealed(true);

    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
    }

    setTimeout(() => {
      if (livesRef.current <= 0) {
        finish();
      } else {
        setStep((s) => s + 1);
        resetQuestionState(scoreRef.current);
      }
    }, 850);
  }

  function handlePowerUp(id: string) {
    if (revealed || phase !== "play") return;
    const pid = id as PowerUpId;

    if (usedOnQuestion[pid as keyof typeof usedOnQuestion]) {
      setShakePu(id);
      setTimeout(() => setShakePu(null), 400);
      return;
    }
    if (!usePowerUp(pid)) {
      setShakePu(id);
      setTimeout(() => setShakePu(null), 400);
      return;
    }

    if (pid === "half") {
      const wrong = ([0, 1, 2, 3] as const).filter((i) => i !== q.correct);
      const pick = wrong[Math.floor(Math.random() * wrong.length)];
      setHiddenOptions((prev) => new Set(prev).add(pick));
      setUsedOnQuestion((u) => ({ ...u, half: true }));
      setHint("🧤 یک گزینهٔ غلط حذف شد");
    } else if (pid === "time") {
      const bonus = POWERUP_CONFIG.timeBonusSeconds;
      setSecondsLeft((s) => s + bonus);
      setTimeLimit((t) => t + bonus);
      setUsedOnQuestion((u) => ({ ...u, time: true }));
      setHint(`⏱️ +${faNum(bonus)} ثانیه`);
    } else if (pid === "swap") {
      const ids = deck.map((d) => d.id);
      const replacement = drawOneExcluding(ids);
      const idx = step % deck.length;
      setDeck((d) => d.map((item, i) => (i === idx ? replacement : item)));
      resetQuestionState(scoreRef.current);
      setUsedOnQuestion({ half: false, time: false, swap: true });
      setHint("🔄 سؤال عوض شد");
    }
    setTimeout(() => setHint(null), 1200);
  }

  function finish() {
    if (finalized.current) return;
    finalized.current = true;
    const s = scoreRef.current;
    applyActivityReward(rewardSurvival(s));
    addTotalCorrect(s);
    recordDailyPlay();
    isRecordRef.current = saveSurvival(s);
    if (isRecordRef.current && s > 0) {
      confetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#f5c542", "#2f9e5f", "#ffffff", "#2f6fed"],
      });
    }
    setPhase("over");
  }

  function optionClass(i: number) {
    if (!revealed) return "bg-pitch-600 border-pitch-500 active:scale-[0.98]";
    if (i === q.correct) return "bg-grass-500/90 border-grass-400";
    if (i === selected) return "bg-team-foe/80 border-team-foe animate-shake";
    return "bg-pitch-700 border-pitch-600 opacity-60";
  }

  if (phase === "over") {
    const s = scoreRef.current;
    return (
      <div className="pitch-stripes min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="text-7xl animate-pop">
          {isRecordRef.current && s > 0 ? "🏅" : "❤️"}
        </div>
        <h2 className="mt-3 text-3xl font-extrabold">
          {isRecordRef.current && s > 0 ? "رکوردِ جدید!" : "پایانِ بقا"}
        </h2>
        <p className="mt-2 text-white/70">
          {faNum(s)} جوابِ درستِ پشت‌سرهم
        </p>

        <div className="glass mt-6 w-full max-w-xs rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold">{faNum(score)}</span>
            <span className="text-white/70">امتیازِ این دور</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-gold-400">🏅 {faNum(best)}</span>
            <span className="text-white/70">بهترین رکورد</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-extrabold text-gold-400">
              +{faNum(s * 5)} ⭐ XP
            </span>
            <span className="text-white/70">جایزه</span>
          </div>
        </div>

        <div className="mt-6 w-full max-w-xs space-y-3">
          <button
            onClick={onExit}
            className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold"
          >
            بازگشت به خانه
          </button>
        </div>
      </div>
    );
  }

  const danger = secondsLeft <= 3;

  return (
    <div className="pitch-stripes min-h-dvh flex flex-col pb-8">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={onExit}
          className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold"
          aria-label="خروج"
        >
          ‹
        </button>
        <div className="flex gap-1 text-2xl">
          {Array.from({ length: START_LIVES }).map((_, i) => (
            <span key={i} className={i < lives ? "" : "grayscale opacity-30"}>
              ❤️
            </span>
          ))}
        </div>
        <div className="glass rounded-2xl px-4 py-2 text-center">
          <p className="text-xs text-white/55 leading-none">🏅 {faNum(best)}</p>
          <p className="text-xl font-extrabold leading-tight">{faNum(score)}</p>
        </div>
      </div>

      <p className="mt-4 text-center text-sm font-bold text-white/55">
        ❤️ بقا · تا آخرین جانت جواب بده
      </p>

      <div className="mx-5 mt-4 h-2.5 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${Math.min(100, (secondsLeft / timeLimit) * 100)}%`,
            background: danger
              ? "linear-gradient(90deg,#e5473f,#ff8a3d)"
              : "linear-gradient(90deg,#2f9e5f,#5ee08a)",
          }}
        />
      </div>

      {hint && (
        <p className="mx-5 mt-3 text-center text-sm font-bold text-gold-400 animate-pop">
          {hint}
        </p>
      )}

      <PowerUpBar
        defs={SURVIVAL_PU}
        inventory={powerups}
        disabled={{
          half: usedOnQuestion.half,
          time: usedOnQuestion.time,
          swap: usedOnQuestion.swap,
        }}
        onUse={handlePowerUp}
        shakeId={shakePu}
      />

      <div className="mx-5 mt-4 rounded-3xl bg-[#eef3ee] text-pitch-900 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <ReportButton questionId={q.id} />
          <span className="rounded-lg bg-grass-500/15 px-2.5 py-1 text-xs font-bold text-grass-500">
            ⏱ {faNum(secondsLeft)} ثانیه · {q.difficulty}
          </span>
        </div>
        <p className="mt-3 text-xl font-extrabold leading-8 text-right">{q.text}</p>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {q.options.map((opt, i) => {
          if (hiddenOptions.has(i)) return null;
          return (
            <button
              key={`${step}-${i}`}
              disabled={revealed}
              onClick={() => answer(i)}
              className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-right font-bold transition ${optionClass(i)}`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/25 text-sm">
                {faNum(i + 1)}
              </span>
              <span className="flex-1">{opt}</span>
              {revealed && i === q.correct && <span>✅</span>}
              {revealed && i === selected && i !== q.correct && <span>❌</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
