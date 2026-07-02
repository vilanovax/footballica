"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { makeDeck } from "@/lib/questions";
import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import { ReportButton } from "@/components/ui/ReportButton";

interface SurvivalProps {
  onExit: () => void;
}

const START_LIVES = 3;
const COINS_PER_CORRECT = 10;

// زمانِ هر سؤال با پیشرفت کم می‌شود (سخت‌تر): ۱۰ → کفِ ۴ ثانیه
function timeForScore(score: number): number {
  return Math.max(4, 10 - Math.floor(score / 3));
}


export function Survival({ onExit }: SurvivalProps) {
  const addCoins = useGame((s) => s.addCoins);
  const saveSurvival = useGame((s) => s.saveSurvival);
  const best = useGame((s) => s.survivalBest);

  const [deck] = useState(() => makeDeck());
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [secondsLeft, setSecondsLeft] = useState<number>(timeForScore(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"play" | "over">("play");

  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const finalized = useRef(false);
  const isRecordRef = useRef(false);

  const q = deck[step % deck.length];
  const totalTime = timeForScore(score);

  // تایمر
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

  function answer(choice: number | null) {
    if (revealed || phase !== "play") return;
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
        setSelected(null);
        setRevealed(false);
        setSecondsLeft(timeForScore(scoreRef.current));
      }
    }, 850);
  }

  function finish() {
    if (finalized.current) return;
    finalized.current = true;
    const s = scoreRef.current;
    addCoins(s * COINS_PER_CORRECT);
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
              +{faNum(s * COINS_PER_CORRECT)} 🪙
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
    <div className="pitch-stripes min-h-dvh flex flex-col">
      {/* هدر: جان‌ها + امتیاز + رکورد */}
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={onExit}
          className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl"
          aria-label="خروج"
        >
          ›
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

      {/* نوارِ تایمر */}
      <div className="mx-5 mt-4 h-2.5 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${(secondsLeft / totalTime) * 100}%`,
            background: danger
              ? "linear-gradient(90deg,#e5473f,#ff8a3d)"
              : "linear-gradient(90deg,#2f9e5f,#5ee08a)",
          }}
        />
      </div>

      {/* کارتِ سؤال */}
      <div className="mx-5 mt-5 rounded-3xl bg-[#eef3ee] text-pitch-900 p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <ReportButton questionId={q.id} />
          <span className="rounded-lg bg-grass-500/15 px-2.5 py-1 text-xs font-bold text-grass-500">
            ⏱ {faNum(secondsLeft)} ثانیه · {q.difficulty}
          </span>
        </div>
        <p className="mt-3 text-xl font-extrabold leading-8 text-right">
          {q.text}
        </p>
      </div>

      {/* گزینه‌ها */}
      <div className="px-5 mt-4 space-y-3">
        {q.options.map((opt, i) => (
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
        ))}
      </div>
    </div>
  );
}
