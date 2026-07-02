"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { makeDeck } from "@/lib/questions";
import { useGame } from "@/lib/store";
import { rewardPenalty } from "@/lib/economy";
import { faNum, faMoney } from "@/lib/format";
import { ReportButton } from "@/components/ui/ReportButton";

interface PenaltyProps {
  onExit: () => void;
}

const KICKS = 5;
const TIME_PER_KICK = 7;

type KickResult = "goal" | "save";
type Phase = "aim" | "reveal" | "done";

export function Penalty({ onExit }: PenaltyProps) {
  const applyActivityReward = useGame((s) => s.applyActivityReward);
  const addTotalCorrect = useGame((s) => s.addTotalCorrect);
  const recordDailyPlay = useGame((s) => s.recordDailyPlay);
  const [rewardSummary, setRewardSummary] = useState<{
    xp: number;
    fans: number;
    vault: number;
    cards: number;
  } | null>(null);

  const [deck] = useState(() => makeDeck());
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(KickResult | null)[]>(
    Array(KICKS).fill(null),
  );
  const [phase, setPhase] = useState<Phase>("aim");
  const [secondsLeft, setSecondsLeft] = useState<number>(TIME_PER_KICK);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<KickResult | null>(null);
  const goalsRef = useRef(0); // مرجعِ حقیقتِ گل‌ها (مصون از stale-closure)
  const rewarded = useRef(false);

  const q = deck[index % deck.length];
  const goals = results.filter((r) => r === "goal").length;

  // تایمرِ هر پنالتی
  useEffect(() => {
    if (phase !== "aim") return;
    if (secondsLeft <= 0) {
      shoot(null);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  function shoot(choice: number | null) {
    if (phase !== "aim") return;
    const scored = choice === q.correct;
    const res: KickResult = scored ? "goal" : "save";
    if (scored) goalsRef.current += 1;

    setSelected(choice);
    setLastResult(res);
    setResults((prev) => {
      const next = [...prev];
      next[index] = res;
      return next;
    });
    setPhase("reveal");

    if (scored) {
      confetti({
        particleCount: 40,
        spread: 75,
        startVelocity: 38,
        origin: { y: 0.45 },
        colors: ["#f5c542", "#2f9e5f", "#ffffff"],
      });
    }

    setTimeout(nextKick, 1500);
  }

  function nextKick() {
    if (index === KICKS - 1) {
      // پایانِ شوت‌اوت — جایزه
      if (!rewarded.current) {
        rewarded.current = true;
        const g = goalsRef.current;
        const rewards = rewardPenalty(g, KICKS);
        applyActivityReward(rewards);
        setRewardSummary({
          xp: rewards.xp,
          fans: rewards.fans,
          vault: rewards.vaultMoney,
          cards: rewards.cards,
        });
        addTotalCorrect(g);
        recordDailyPlay();
      }
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setLastResult(null);
    setSecondsLeft(TIME_PER_KICK);
    setPhase("aim");
  }

  function optionClass(i: number) {
    if (phase === "aim")
      return "bg-pitch-600 border-pitch-500 active:scale-[0.98]";
    if (i === q.correct) return "bg-grass-500/90 border-grass-400";
    if (i === selected) return "bg-team-foe/80 border-team-foe";
    return "bg-pitch-700 border-pitch-600 opacity-60";
  }

  const finalGoals = goalsRef.current;

  return (
    <div className="pitch-stripes min-h-dvh flex flex-col">
      {/* هدر */}
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={onExit}
          className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl"
          aria-label="خروج"
        >
          ›
        </button>
        <h1 className="text-xl font-extrabold">🥅 پنالتی</h1>
        <div className="glass rounded-2xl px-4 py-2 text-center">
          <p className="text-xs text-white/55 leading-none">گل</p>
          <p className="text-xl font-extrabold leading-tight">
            {faNum(goals)}/{faNum(KICKS)}
          </p>
        </div>
      </div>

      {/* ردیفِ ضربه‌ها */}
      <div className="flex justify-center gap-2 pt-4">
        {results.map((r, i) => (
          <span
            key={i}
            className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${
              r === "goal"
                ? "bg-gold-400"
                : r === "save"
                  ? "bg-team-foe/70"
                  : i === index
                    ? "bg-white/20 ring-2 ring-white/40"
                    : "bg-white/10"
            }`}
          >
            {r === "goal" ? "⚽" : r === "save" ? "🧤" : ""}
          </span>
        ))}
      </div>

      {/* صحنهٔ دروازه */}
      <div className="relative mx-auto mt-4 h-44 w-72">
        <span className="absolute left-1/2 top-0 -translate-x-1/2 text-8xl">
          🥅
        </span>
        {/* دروازه‌بان */}
        <span
          className={`absolute left-1/2 top-8 -translate-x-1/2 text-4xl ${
            phase === "reveal"
              ? lastResult === "save"
                ? "keeper-save"
                : "keeper-wrong"
              : ""
          }`}
        >
          🧤
        </span>
        {/* توپ (فقط در reveal) */}
        {phase === "reveal" && (
          <span
            className={`absolute left-1/2 top-24 text-4xl ${
              lastResult === "goal" ? "ball-corner" : "ball-stopped"
            }`}
          >
            ⚽
          </span>
        )}
        {/* برچسبِ نتیجه */}
        {phase === "reveal" && (
          <span
            className={`animate-pop absolute inset-x-0 -bottom-2 text-center text-3xl font-extrabold drop-shadow ${
              lastResult === "goal" ? "text-gold-400" : "text-team-foe"
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            {lastResult === "goal" ? "گُــل!" : "مهار شد! 🧤"}
          </span>
        )}
      </div>

      {/* سؤال + گزینه‌ها (یا صفحهٔ پایان) */}
      {phase !== "done" ? (
        <>
          <div className="mx-5 mt-4 rounded-3xl bg-[#eef3ee] text-pitch-900 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="rounded-lg bg-team-foe/15 px-2 py-1 text-xs font-bold text-team-foe">
                  ⏱ {faNum(secondsLeft)} ثانیه
                </span>
                <ReportButton questionId={q.id} />
              </div>
              <span className="text-xs font-bold text-pitch-800/60">
                ضربهٔ {faNum(index + 1)} از {faNum(KICKS)}
              </span>
            </div>
            <p className="mt-2 text-lg font-extrabold leading-7 text-right">
              {q.text}
            </p>
          </div>

          <div className="px-5 mt-3 space-y-2.5 pb-6">
            {q.options.map((opt, i) => (
              <button
                key={`${index}-${i}`}
                disabled={phase !== "aim"}
                onClick={() => shoot(i)}
                className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-right font-bold transition ${optionClass(i)}`}
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/25 text-sm">
                  {faNum(i + 1)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="text-7xl animate-pop">
            {finalGoals >= 3 ? "🏆" : "🧤"}
          </div>
          <h2 className="mt-3 text-3xl font-extrabold">
            {faNum(finalGoals)} از {faNum(KICKS)} گل
          </h2>
          <div className="glass mt-5 rounded-2xl px-6 py-4 space-y-2 text-right w-full max-w-xs">
            {rewardSummary && (
              <>
                {rewardSummary.xp > 0 && (
                  <p className="font-extrabold">+{faNum(rewardSummary.xp)} ⭐ XP</p>
                )}
                {rewardSummary.fans > 0 && (
                  <p className="font-extrabold text-grass-400">
                    +{faNum(rewardSummary.fans)} 🎽 هوادار
                  </p>
                )}
                {rewardSummary.vault > 0 && (
                  <p className="font-extrabold text-gold-400">
                    +{faMoney(rewardSummary.vault)} 🔐 وارد گاوصندوق شد
                  </p>
                )}
                {rewardSummary.cards > 0 && (
                  <p className="font-extrabold text-gold-400">
                    +{faNum(rewardSummary.cards)} ⚡ کارت
                  </p>
                )}
              </>
            )}
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
      )}
    </div>
  );
}
