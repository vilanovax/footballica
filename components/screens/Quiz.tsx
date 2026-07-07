"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ReactionOverlay, type Reaction } from "@/components/ui/ReactionOverlay";
import { ReportButton } from "@/components/ui/ReportButton";
import { PowerUpBar } from "@/components/ui/PowerUpBar";
import {
  QuizProgressDots,
  QuizQuestionCard,
  QuizOptionButton,
} from "@/components/ui/QuizUi";
import { drawRound, drawOneExcluding, type Question } from "@/lib/questions";
import { scoreAnswer, SCORING, rewardQuickQuiz, rewardFriendlyDuel, rankedDuelArenaDelta } from "@/lib/economy";
import { feedbackCorrect, feedbackWrong } from "@/lib/feedback";
import {
  powerUpsForMode,
  powerUpCount,
  POWERUP_CONFIG,
  type PowerUpId,
} from "@/lib/powerups";
import { duelPowerupsAllowed } from "@/lib/duel";
import { faNum } from "@/lib/format";
import { useGame } from "@/lib/store";
import type { AnswerOutcome, DuelKind, MatchResult, PlayMode } from "@/lib/types";
import { OPPONENT } from "@/lib/types";

interface QuizProps {
  onFinish: (result: MatchResult) => void;
  mode?: PlayMode;
  duelKind?: DuelKind;
  opponent?: { name: string; short: string };
}

const QUIZ_POWERUP_DEFS = powerUpsForMode("quiz").filter((p) => p.id !== "glove");

export function Quiz({
  onFinish,
  mode = "quick",
  duelKind = "friendly",
  opponent = OPPONENT,
}: QuizProps) {
  const powerups = useGame((s) => s.powerups);
  const usePowerUp = useGame((s) => s.usePowerUp);
  const powerupsEnabled =
    mode !== "duel" || duelPowerupsAllowed(duelKind);

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
  const [progressMarks, setProgressMarks] = useState<(null | "goal" | "save")[]>(
    () => Array(round.length).fill(null),
  );

  const youRef = useRef(0);
  const foeRef = useRef(0);
  const streakRef = useRef(0);
  const outcomes = useRef<AnswerOutcome[]>([]);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = round[index];
  const isLast = index === round.length - 1;

  function clearNextTimer() {
    if (nextTimer.current) {
      clearTimeout(nextTimer.current);
      nextTimer.current = null;
    }
  }

  function clearHintTimer() {
    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
  }

  function scheduleNext(ms: number) {
    clearNextTimer();
    nextTimer.current = setTimeout(next, ms);
  }

  function flashHint(message: string, ms = 1200) {
    clearHintTimer();
    setHint(message);
    hintTimer.current = setTimeout(() => {
      setHint(null);
      hintTimer.current = null;
    }, ms);
  }

  useEffect(
    () => () => {
      clearNextTimer();
      clearHintTimer();
    },
    [],
  );

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
      powerupsEnabled &&
      choice !== null &&
      choice !== q.correct &&
      !gloveUsedMatch &&
      powerUpCount(powerups, "glove") > 0
    ) {
      if (usePowerUp("glove")) {
        setGloveUsedMatch(true);
        flashHint("🥅 دستکش طلایی! دوباره تلاش کن", 1400);
        return;
      }
    }

    const youCorrect = choice === q.correct;
    const foeCorrect = Math.random() < 0.6;

    setSelected(choice);
    setRevealed(true);

    if (youCorrect) {
      feedbackCorrect();
      youRef.current += scoreAnswer(true, secondsLeft);
      setYouScore(youRef.current);
      streakRef.current += 1;
    } else {
      feedbackWrong();
      streakRef.current = 0;
    }
    if (foeCorrect) {
      foeRef.current += scoreAnswer(true, Math.random() * 8 + 1);
      setFoeScore(foeRef.current);
    }
    outcomes.current.push({ youCorrect, foeCorrect, label: q.text });
    setProgressMarks((marks) => {
      const next = [...marks];
      next[index] = youCorrect ? "goal" : "save";
      return next;
    });

    let react: Reaction;
    if (youCorrect) {
      if (streakRef.current >= 3) react = "supergoal";
      else if (secondsLeft >= 6) react = "goal";
      else react = "pass";
    } else {
      react = q.difficulty === "سخت" ? "card" : "counter";
    }
    setReaction(react);

    if (powerupsEnabled && !youCorrect && !varUsedMatch && powerUpCount(powerups, "var") > 0) {
      setAwaitingVar(true);
      flashHint("📺 VAR فعال است — دوباره جواب بده", 5000);
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
    clearHintTimer();
    setHint(null);
    outcomes.current.pop();
    setProgressMarks((marks) => {
      const next = [...marks];
      next[index] = null;
      return next;
    });
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
      flashHint("🧤 یک گزینهٔ غلط حذف شد");
    } else if (pid === "time") {
      const bonus = POWERUP_CONFIG.timeBonusSeconds;
      setSecondsLeft((s) => s + bonus);
      setTimeLimit((t) => t + bonus);
      setUsedOnQuestion((u) => ({ ...u, time: true }));
      flashHint(`⏱️ +${faNum(bonus)} ثانیه`);
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
      flashHint("🔄 سؤال عوض شد");
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
          ? duelKind === "ranked"
            ? null
            : rewardFriendlyDuel(won, correctCount)
          : rewardQuickQuiz(won, correctCount);
      const arenaDelta =
        mode === "duel" && duelKind === "ranked"
          ? rankedDuelArenaDelta(won, correctCount, you, foe)
          : undefined;
      onFinish({
        mode,
        duelKind: mode === "duel" ? duelKind : undefined,
        youScore: you,
        foeScore: foe,
        outcomes: outcomes.current,
        xpEarned: rewards?.xp ?? 0,
        fansEarned: rewards?.fans ?? 0,
        vaultEarned: rewards?.vaultMoney ?? 0,
        cardsEarned: rewards?.cards ?? 0,
        arenaDelta,
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

  const powerUpReasons: Partial<Record<string, string>> = {};
  for (const p of QUIZ_POWERUP_DEFS) {
    const count = powerUpCount(powerups, p.id);
    if (p.id === "var") {
      if (varUsedMatch) powerUpReasons.var = "مصرف شد";
      else if (awaitingVar && count > 0) powerUpReasons.var = "آماده";
      else if (count <= 0) powerUpReasons.var = "نداری";
      continue;
    }
    if (usedOnQuestion[p.id as keyof typeof usedOnQuestion]) {
      powerUpReasons[p.id] = "مصرف شد";
    } else if (revealed || awaitingVar) {
      powerUpReasons[p.id] = "قفل";
    } else if (count <= 0) {
      powerUpReasons[p.id] = "نداری";
    } else {
      powerUpReasons[p.id] = "آماده";
    }
  }

  const supportCount = QUIZ_POWERUP_DEFS.reduce(
    (sum, p) => sum + powerUpCount(powerups, p.id),
    0,
  );

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh flex flex-col pb-8">
      {reaction && !awaitingVar && (
        <ReactionOverlay reaction={reaction} onDone={() => setReaction(null)} />
      )}

      <div className="flex justify-center gap-2 pt-5 px-5">
        {mode === "duel" ? (
          <span
            className={`quiz-mode-badge rounded-xl px-4 py-1.5 text-sm font-bold ${
              duelKind === "ranked" ? "quiz-mode-badge--ranked" : "quiz-mode-badge--duel"
            }`}
          >
            {duelKind === "ranked" ? "🏆 رنکد · بدون کمک" : "⚔️ دوئل دوستانه · ۱ ❤️"}
          </span>
        ) : (
          <span className="quiz-mode-badge rounded-xl px-4 py-1.5 text-sm font-bold">
            ⚽ بازی سریع · رایگان
          </span>
        )}
      </div>

      <div className="quiz-scoreboard mx-5 mt-4 rounded-[1.7rem] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar label="تو" color="you" size={44} />
            <div className="text-right leading-tight">
              <p className="text-[11px] text-white/50">شما</p>
              <p className="text-2xl font-extrabold text-gold-400">{faNum(youScore)}</p>
            </div>
          </div>
          <span className="quiz-scoreboard__vs rounded-lg px-3 py-1 text-sm font-extrabold">
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
        <div className="quiz-scoreboard__footer mt-3">
          <span className="quiz-scoreboard__tip">
            {danger
              ? "الان جواب را نهایی کن"
              : mode === "duel"
                ? "جواب سریع‌تر، فشار بیشتر روی حریف"
                : "هر جواب سریع، XP بیشتری می‌سازد"}
          </span>
          <span className="quiz-scoreboard__support">
            {powerupsEnabled
              ? `${faNum(supportCount)} کمک تاکتیکی`
              : "رنکد · بدون کمک"}
          </span>
        </div>
      </div>

      <div className="quiz-round-strip mx-5 mt-3 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-right">
            <p className="quiz-round-strip__eyebrow">روند مسابقه</p>
            <p className="quiz-round-strip__title">
              سؤال {faNum(index + 1)} از {faNum(round.length)}
            </p>
          </div>
          <span className="quiz-round-strip__meta">
            {awaitingVar ? "VAR باز است" : danger ? "فشار آخر" : "ریتم نرمال"}
          </span>
        </div>
        <QuizProgressDots total={round.length} current={index} results={progressMarks} />
      </div>

      <div className="quiz-timer-panel mx-5 mt-3 rounded-[1.7rem] px-4 py-4">
        <p className="quiz-timer-panel__eyebrow">زمان پاسخ</p>
        <div className="flex justify-center py-2">
          <div className={`quiz-timer-shell relative ${danger ? "animate-danger" : ""}`}>
            <svg width="120" height="120" className="-rotate-90">
              <circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="9"
              />
              <circle
                cx="60"
                cy="60"
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
              className="quiz-timer-shell__value absolute inset-0 grid place-items-center text-3xl font-extrabold"
              style={{ color: ringColor }}
            >
              {faNum(secondsLeft)}
            </span>
          </div>
        </div>
        <p className="quiz-timer-panel__sub">
          {danger
            ? "همین حالا انتخاب کن"
            : secondsLeft <= 6
              ? "جواب را نهایی کن تا امتیاز از دست نرود"
              : "جواب سریع‌تر امتیاز بیشتری می‌دهد"}
        </p>
      </div>

      {hint && <p className="quiz-hint-banner mx-5 mt-3 rounded-2xl px-4 py-3 text-center">{hint}</p>}

      {powerupsEnabled && (
        <>
          <div className="quiz-toolbox mx-5 mt-3">
            <div className="quiz-toolbox__head">
              <p className="quiz-toolbox__title">کمک‌های تاکتیکی</p>
              <p className="quiz-toolbox__sub">
                {awaitingVar ? "الان می‌توانی VAR را فعال کنی" : "هر سؤال فقط یک‌بار از هر کمک استفاده می‌شود"}
              </p>
            </div>
          </div>

          <PowerUpBar
            defs={QUIZ_POWERUP_DEFS}
            inventory={powerups}
            disabled={puDisabled}
            reasons={powerUpReasons}
            hidden={puHidden}
            onUse={handlePowerUp}
            shakeId={shakePu}
          />
        </>
      )}

      <QuizQuestionCard
        meta={`${q.league} · ${q.difficulty}`}
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
          <Button
            onClick={activateVar}
            variant="primary"
            size="lg"
            fullWidth
            className="quiz-var-btn"
          >
            📺 استفاده از VAR — یک جواب دیگر
          </Button>
        )}
      </div>
    </div>
  );
}
