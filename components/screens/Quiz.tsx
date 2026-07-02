"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ReactionOverlay, type Reaction } from "@/components/ui/ReactionOverlay";
import { ReportButton } from "@/components/ui/ReportButton";
import { drawRound } from "@/lib/questions";
import { scoreAnswer, SCORING, ECONOMY } from "@/lib/economy";
import { faNum } from "@/lib/format";
import type { AnswerOutcome, MatchResult, PlayMode } from "@/lib/types";
import { OPPONENT } from "@/lib/types";

interface QuizProps {
  onFinish: (result: MatchResult) => void;
  mode?: PlayMode;
  opponent?: { name: string; short: string };
}

export function Quiz({
  onFinish,
  mode = "quick",
  opponent = OPPONENT,
}: QuizProps) {
  // یک دستِ تصادفیِ تازه در هر بازی
  const [round] = useState(() => drawRound());
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(SCORING.timePerQuestion);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [youScore, setYouScore] = useState(0);
  const [foeScore, setFoeScore] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  // مرجعِ حقیقتِ امتیاز (state فقط برای نمایش) — تا امتیازِ سؤالِ آخر در نتیجه گم نشود
  const youRef = useRef(0);
  const foeRef = useRef(0);
  const streakRef = useRef(0); // جواب‌های درستِ پشت‌سرهم برای سوپرگل
  const outcomes = useRef<AnswerOutcome[]>([]);

  const q = round[index];
  const isLast = index === round.length - 1;

  // شمارشِ معکوس
  useEffect(() => {
    if (revealed) return;
    if (secondsLeft <= 0) {
      lockAnswer(null);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, revealed]);

  function lockAnswer(choice: number | null) {
    if (revealed) return;
    const youCorrect = choice === q.correct;
    // شبیه‌سازیِ حریف (بعداً واقعی می‌شود). حریف ~۶۰٪ درست جواب می‌دهد.
    const foeCorrect = Math.random() < 0.6;

    setSelected(choice);
    setRevealed(true);
    if (youCorrect) {
      youRef.current += scoreAnswer(true, secondsLeft);
      setYouScore(youRef.current);
      streakRef.current += 1;
    } else {
      streakRef.current = 0;
    }
    if (foeCorrect) {
      foeRef.current += scoreAnswer(true, Math.random() * 8 + 1);
      setFoeScore(foeRef.current);
    }
    outcomes.current.push({ youCorrect, foeCorrect, label: q.text });

    // نگاشتِ پاسخ به رویدادِ زمین (سندِ گیم‌دیزاین)
    let react: Reaction;
    if (youCorrect) {
      if (streakRef.current >= 3) react = "supergoal";
      else if (secondsLeft >= 6) react = "goal";
      else react = "pass";
    } else {
      react = q.difficulty === "سخت" ? "card" : "counter";
    }
    setReaction(react);

    setTimeout(next, 1500);
  }

  function next() {
    if (isLast) {
      const you = youRef.current;
      const foe = foeRef.current;
      const won = you >= foe;
      const correctCount = outcomes.current.filter((o) => o.youCorrect).length;
      onFinish({
        mode,
        youScore: you,
        foeScore: foe,
        outcomes: outcomes.current,
        coinsEarned:
          (won ? ECONOMY.coins.winQuick : ECONOMY.coins.loseQuick) +
          correctCount * ECONOMY.coins.perCorrect,
        fansEarned:
          mode === "duel"
            ? won
              ? ECONOMY.fans.winDuel
              : ECONOMY.fans.loseDuel
            : 0,
        // بردِ کوییز به اقتصادِ باشگاه بودجه تزریق می‌کند (دوئل بیشتر)
        budgetEarned: won ? (mode === "duel" ? 5_000_000 : 2_000_000) : 0,
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setReaction(null);
    setSecondsLeft(SCORING.timePerQuestion);
  }

  // رینگِ تایمر
  const R = 54;
  const C = 2 * Math.PI * R;
  const ratio = secondsLeft / SCORING.timePerQuestion;
  const danger = secondsLeft <= 3;
  const ringColor = danger ? "#e5473f" : secondsLeft <= 6 ? "#f5c542" : "#2f9e5f";

  function optionClass(i: number) {
    if (!revealed)
      return "bg-pitch-600 border-pitch-500 active:scale-[0.98] hover:border-white/25";
    if (i === q.correct) return "bg-grass-500/90 border-grass-400";
    if (i === selected) return "bg-team-foe/80 border-team-foe animate-shake";
    return "bg-pitch-700 border-pitch-600 opacity-60";
  }

  return (
    <div className="pitch-stripes min-h-dvh flex flex-col">
      {reaction && (
        <ReactionOverlay
          reaction={reaction}
          onDone={() => {
            /* واکنش تا سؤالِ بعد روی صفحه می‌ماند؛ next آن را پاک می‌کند */
          }}
        />
      )}

      {/* نوارِ حالت */}
      <div className="flex justify-center gap-2 pt-5">
        {mode === "duel" ? (
          <span className="rounded-xl bg-team-you px-5 py-1.5 text-sm font-bold text-white">
            ⚔️ دوئل · هوادار در خطر است
          </span>
        ) : (
          <>
            <span className="rounded-xl bg-gold-400 px-4 py-1.5 text-sm font-bold text-[#3a2600]">
              حالت عادی
            </span>
            <span className="rounded-xl bg-white/10 px-4 py-1.5 text-sm font-bold text-white/70">
              💣 حالت بمب
            </span>
          </>
        )}
      </div>

      {/* هدرِ VS */}
      <div className="flex items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-2">
          <Avatar label="تو" color="you" size={44} />
          <div className="text-right leading-tight">
            <p className="text-xs text-white/60">شما</p>
            <p className="text-2xl font-extrabold">{faNum(youScore)}</p>
          </div>
        </div>
        <span className="rounded-lg border border-gold-500/50 px-3 py-1 text-sm font-extrabold text-gold-400">
          VS
        </span>
        <div className="flex items-center gap-2 flex-row-reverse">
          <Avatar label={opponent.short} color="foe" size={44} />
          <div className="text-left leading-tight">
            <p className="text-xs text-white/60">{opponent.name}</p>
            <p className="text-2xl font-extrabold">{faNum(foeScore)}</p>
          </div>
        </div>
      </div>

      {/* شمارندهٔ سؤال */}
      <div className="flex items-center justify-center gap-2 pt-3 text-sm text-white/60">
        <span>
          سؤال {faNum(index + 1)} از {faNum(round.length)}
        </span>
        <div className="flex gap-1.5">
          {round.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i < index
                  ? "bg-grass-400"
                  : i === index
                    ? "bg-gold-400"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* رینگِ تایمر */}
      <div className="flex justify-center py-5">
        <div className={`relative ${danger ? "animate-danger rounded-full" : ""}`}>
          <svg width="140" height="140" className="-rotate-90">
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - ratio)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <span
            className="absolute inset-0 grid place-items-center text-5xl font-extrabold"
            style={{ color: ringColor }}
          >
            {faNum(secondsLeft)}
          </span>
        </div>
      </div>

      {/* کارتِ سؤال */}
      <div className="mx-5 rounded-3xl bg-[#eef3ee] text-pitch-900 p-5 shadow-xl animate-rise">
        <div className="flex items-center justify-between">
          <ReportButton questionId={q.id} />
          <span className="rounded-lg bg-grass-500/15 px-2.5 py-1 text-xs font-bold text-grass-500">
            ⚽ {q.league} · {q.difficulty}
          </span>
        </div>
        <p className="mt-3 text-xl font-extrabold leading-8 text-right">
          {q.text}
        </p>
      </div>

      {/* گزینه‌ها */}
      <div className="px-5 mt-4 space-y-3 pb-8">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={revealed}
            onClick={() => lockAnswer(i)}
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
