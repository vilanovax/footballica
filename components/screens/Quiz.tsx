"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ReactionOverlay, type Reaction } from "@/components/ui/ReactionOverlay";
import { ReportButton } from "@/components/ui/ReportButton";
import { PowerUpBar } from "@/components/ui/PowerUpBar";
import { QuizQuestionCard, QuizOptionButton } from "@/components/ui/QuizUi";
import { drawRound, drawOneExcluding, type Question } from "@/lib/questions";
import { scoreAnswer, SCORING, rewardQuickQuiz, rewardDuel } from "@/lib/economy";
import {
  powerUpsForMode,
  powerUpCount,
  POWERUP_CONFIG,
  type PowerUpId,
} from "@/lib/powerups";
import { faNum } from "@/lib/format";
import { useGame } from "@/lib/store";
import type { AnswerOutcome, MatchResult, PlayMode } from "@/lib/types";
import { OPPONENT } from "@/lib/types";

interface QuizProps {
  onFinish: (result: MatchResult) => void;
  mode?: PlayMode;
  opponent?: { name: string; short: string };
}

const QUIZ_POWERUP_DEFS = powerUpsForMode("quiz").filter((p) => p.id !== "glove");

export function Quiz({
  onFinish,
  mode = "quick",
  opponent = OPPONENT,
}: QuizProps) {
  const powerups = useGame((s) => s.powerups);
  const usePowerUp = useGame((s) => s.usePowerUp);

  const [round, setRound] = useState<Question[]>(() => drawRound());
  const [index, setIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState<number>(SCORING.timePerQuestion);
  const [secondsLeft, setSecondsLeft] = useState<number>(SCORING.timePerQuestion);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [youScore, setYouScore] = useState(0);
  const [foeScore, setFoeScore] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(() => new Set());
  const [usedOnQuestion, setUsedOnQuestion] = useState({
    half: false,
    time: false,
    swap: false,
  });
  const [varUsedMatch, setVarUsedMatch] = useState(false);
  const [gloveUsedMatch, setGloveUsedMatch] = useState(false);
  const [awaitingVar, setAwaitingVar] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [shakePu, setShakePu] = useState<string | null>(null);

  const youRef = useRef(0);
  const foeRef = useRef(0);
  const streakRef = useRef(0);
  const outcomes = useRef<AnswerOutcome[]>([]);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = round[index];
  const isLast = index === round.length - 1;

  function clearNextTimer() {
    if (nextTimer.current) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }
  }

  function scheduleNext(ms: number) {
    clearNextTimer();
    nextTimer.current = setTimeout(next, ms);
  }

  useEffect(() => () => clearNextTimer(), []);

  useEffect(() => {
    if (revealed || awaitingVar) return;
    if (secondsLeft <= 0) {
      lockAnswer(null);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, revealed, awaitingVar]);

  function resetQuestionUi() {
    setHiddenOptions(new Set());
    setUsedOnQuestion({ half: false, time: false, swap: false });
    setTimeLimit(SCORING.timePerQuestion);
    setSecondsLeft(SCORING.timePerQuestion);
    setSelected(null);
    setRevealed(false);
    setReaction(null);
    setAwaitingVar(false);
  }

  function lockAnswer(choice: number | null) {
    if (revealed || awaitingVar) return;

    if (
      choice !== null &&
      choice !== q.correct &&
      !gloveUsedMatch &&
      powerUpCount(powerups, "glove") > 0
    ) {
      if (usePowerUp("glove")) {
        setGloveUsedMatch(true);
        setHint("🥅 دستکش طلایی! دوباره تلاش کن");
        setTimeout(() => setHint(null), 1400);
        return;
      }
    }

    const youCorrect = choice === q.correct;
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

    let react: Reaction;
    if (youCorrect) {
      if (streakRef.current >= 3) react = "supergoal";
      else if (secondsLeft >= 6) react = "goal";
      else react = "pass";
    } else {
      react = q.difficulty === "سخت" ? "card" : "counter";
    }
    setReaction(react);

    if (!youCorrect && !varUsedMatch && powerUpCount(powerups, "var") > 0) {
      setAwaitingVar(true);
      setHint("📺 VAR فعال است — دوباره جواب بده");
      scheduleNext(5000);
      return;
    }

    scheduleNext(1500);
  }

  function activateVar() {
    if (!awaitingVar || varUsedMatch) return;
    if (!usePowerUp("var")) {
      setShakePu("var");
      setTimeout(() => setShakePu(null), 400);
      return;
    }
    clearNextTimer();
    setVarUsedMatch(true);
    setAwaitingVar(false);
    setHint(null);
    outcomes.current.pop();
    resetQuestionUi();
  }

  function handlePowerUp(id: string) {
    if (id === "var") {
      activateVar();
      return;
    }
    if (revealed || awaitingVar) return;

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
      setTimeout(() => setHint(null), 1200);
    } else if (pid === "time") {
      const bonus = POWERUP_CONFIG.timeBonusSeconds;
      setSecondsLeft((s) => s + bonus);
      setTimeLimit((t) => t + bonus);
      setUsedOnQuestion((u) => ({ ...u, time: true }));
      setHint(`⏱️ +${faNum(bonus)} ثانیه`);
      setTimeout(() => setHint(null), 1200);
    } else if (pid === "swap") {
      const ids = round.map((r) => r.id);
      const replacement = drawOneExcluding(ids);
      setRound((r) => r.map((item, i) => (i === index ? replacement : item)));
      setHiddenOptions(new Set());
      setTimeLimit(SCORING.timePerQuestion);
      setSecondsLeft(SCORING.timePerQuestion);
      setSelected(null);
      setRevealed(false);
      setReaction(null);
      setAwaitingVar(false);
      setUsedOnQuestion({ half: false, time: false, swap: true });
      setHint("🔄 سؤال عوض شد");
      setTimeout(() => setHint(null), 1200);
    }
  }

  function next() {
    clearNextTimer();
    setAwaitingVar(false);
    setHint(null);

    if (isLast) {
      const you = youRef.current;
      const foe = foeRef.current;
      const won = you >= foe;
      const correctCount = outcomes.current.filter((o) => o.youCorrect).length;
      const rewards =
        mode === "duel"
          ? rewardDuel(won, correctCount)
          : rewardQuickQuiz(won, correctCount);
      onFinish({
        mode,
        youScore: you,
        foeScore: foe,
        outcomes: outcomes.current,
        xpEarned: rewards.xp,
        fansEarned: rewards.fans,
        vaultEarned: rewards.vaultMoney,
        cardsEarned: rewards.cards,
      });
      return;
    }

    setIndex((i) => i + 1);
    resetQuestionUi();
  }

  const R = 54;
  const C = 2 * Math.PI * R;
  const ratio = Math.min(1, secondsLeft / timeLimit);
  const danger = secondsLeft <= 3;
  const ringColor = danger ? "#e5473f" : secondsLeft <= 6 ? "#f5c542" : "#2f9e5f";

  function optionState(i: number): "idle" | "correct" | "wrong" | "dim" {
    if (!revealed) return "idle";
    if (i === q.correct) return "correct";
    if (i === selected) return "wrong";
    return "dim";
  }

  const puDisabled: Partial<Record<string, boolean>> = {
    half: usedOnQuestion.half,
    time: usedOnQuestion.time,
    swap: usedOnQuestion.swap,
    var: !awaitingVar || varUsedMatch,
  };

  const puHidden: Partial<Record<string, boolean>> = {
    var: !awaitingVar,
  };

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh flex flex-col pb-8">
      {reaction && !awaitingVar && <ReactionOverlay reaction={reaction} onDone={() => {}} />}

      <div className="flex justify-center gap-2 pt-5 px-5">
        {mode === "duel" ? (
          <span className="quiz-mode-badge quiz-mode-badge--duel rounded-xl px-4 py-1.5 text-sm font-bold">
            ⚔️ دوئل · ۱ ❤️
          </span>
        ) : (
          <span className="quiz-mode-badge rounded-xl px-4 py-1.5 text-sm font-bold">
            ⚽ بازی سریع · رایگان
          </span>
        )}
      </div>

      <div className="quiz-scoreboard mx-5 mt-4 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar label="تو" color="you" size={44} />
          <div className="text-right leading-tight">
            <p className="text-[11px] text-white/50">شما</p>
            <p className="text-2xl font-extrabold text-gold-400">{faNum(youScore)}</p>
          </div>
        </div>
        <span className="rounded-lg border border-gold-500/40 bg-black/20 px-3 py-1 text-sm font-extrabold text-gold-400">
          VS
        </span>
        <div className="flex items-center gap-2.5 flex-row-reverse min-w-0">
          <Avatar label={opponent.short} color="foe" size={44} />
          <div className="text-left leading-tight">
            <p className="text-[11px] text-white/50 truncate max-w-[5rem]">{opponent.name}</p>
            <p className="text-2xl font-extrabold">{faNum(foeScore)}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-3 text-sm text-white/55">
        <span>
          سؤال {faNum(index + 1)} از {faNum(round.length)}
        </span>
        <div className="flex gap-1.5">
          {round.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < index
                  ? "bg-grass-400"
                  : i === index
                    ? "bg-gold-400 ring-2 ring-gold-400/30"
                    : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-3">
        <div className={`relative ${danger ? "animate-danger rounded-full" : ""}`}>
          <svg width="108" height="108" className="-rotate-90">
            <circle
              cx="54"
              cy="54"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="9"
            />
            <circle
              cx="54"
              cy="54"
              r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - ratio)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <span
            className="absolute inset-0 grid place-items-center text-3xl font-extrabold"
            style={{ color: ringColor }}
          >
            {faNum(secondsLeft)}
          </span>
        </div>
      </div>

      {hint && (
        <p className="mx-5 -mt-1 mb-1 text-center text-sm font-bold text-gold-400 animate-pop">
          {hint}
        </p>
      )}

      <PowerUpBar
        defs={QUIZ_POWERUP_DEFS}
        inventory={powerups}
        disabled={puDisabled}
        hidden={puHidden}
        onUse={handlePowerUp}
        shakeId={shakePu}
      />

      <QuizQuestionCard
        meta={`⚽ ${q.league} · ${q.difficulty}`}
        report={<ReportButton questionId={q.id} />}
      >
        <p className="text-xl font-extrabold leading-8 text-right text-pitch-900">{q.text}</p>
      </QuizQuestionCard>

      <div className="px-5 mt-3 space-y-2.5">
        {q.options.map((opt, i) => {
          if (hiddenOptions.has(i)) return null;
          return (
            <QuizOptionButton
              key={i}
              index={i}
              label={opt}
              state={optionState(i)}
              disabled={revealed && !awaitingVar}
              onClick={() => lockAnswer(i)}
            />
          );
        })}

        {awaitingVar && (
          <button
            onClick={activateVar}
            className="w-full rounded-2xl border-2 border-gold-400 bg-gold-500/15 py-4 text-center font-extrabold text-gold-400 animate-pulse-soft"
          >
            📺 استفاده از VAR — یک جوابِ دیگر
          </button>
        )}
      </div>
    </div>
  );
}
