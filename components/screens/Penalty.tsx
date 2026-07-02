"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { makeDeck } from "@/lib/questions";
import { useGame } from "@/lib/store";
import { rewardPenalty } from "@/lib/economy";
import { faNum } from "@/lib/format";
import { ReportButton } from "@/components/ui/ReportButton";
import { RewardBreakdown } from "@/components/ui/RewardBreakdown";
import {
  QuizScreenHeader,
  QuizQuestionCard,
  QuizOptionButton,
  QuizProgressDots,
} from "@/components/ui/QuizUi";

interface PenaltyProps {
  onExit: () => void;
}

const KICKS = 5;
const TIME_PER_KICK = 7;

type KickResult = "goal" | "save";
type Phase = "aim" | "reveal" | "done";

function performanceMessage(goals: number): { emoji: string; title: string; sub: string } {
  if (goals >= 5) return { emoji: "🏆", title: "پرفکت!", sub: "همهٔ ضربات گل شد" };
  if (goals >= 4) return { emoji: "⭐", title: "عالی!", sub: "عملکرد درخشان" };
  if (goals >= 3) return { emoji: "👍", title: "خوب بود", sub: "ادامه بده" };
  if (goals >= 1) return { emoji: "🧤", title: "قابلِ قبول", sub: "دفعهٔ بعد بهتر" };
  return { emoji: "😔", title: "مهار شدی", sub: "تمرین کن و برگرد" };
}

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
  const goalsRef = useRef(0);
  const rewarded = useRef(false);

  const q = deck[index % deck.length];
  const goals = results.filter((r) => r === "goal").length;
  const timerDanger = secondsLeft <= 3;

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

  function optionState(i: number): "idle" | "correct" | "wrong" | "dim" {
    if (phase === "aim") return "idle";
    if (i === q.correct) return "correct";
    if (i === selected) return "wrong";
    return "dim";
  }

  const finalGoals = goalsRef.current;
  const perf = performanceMessage(finalGoals);

  if (phase === "done") {
    return (
      <div className="quiz-screen pitch-stripes min-h-dvh flex flex-col px-5 pb-8">
        <QuizScreenHeader title="🥅 پنالتی" onBack={onExit} />

        <QuizProgressDots total={KICKS} current={KICKS} results={results} />

        <div className="flex flex-1 flex-col items-center justify-center text-center pt-4">
          <div
            className={`quiz-result-hero w-full max-w-sm rounded-3xl p-6 ${
              finalGoals >= 3 ? "quiz-result-hero--win" : ""
            }`}
          >
            <div className="text-5xl animate-pop">{perf.emoji}</div>
            <h2 className="mt-3 text-3xl font-extrabold text-white">
              {faNum(finalGoals)} از {faNum(KICKS)} گل
            </h2>
            <p className="mt-1 text-sm font-bold text-gold-400">{perf.title}</p>
            <p className="text-xs text-white/50 mt-0.5">{perf.sub}</p>
          </div>

          {rewardSummary && (
            <div className="mt-5 w-full max-w-sm">
              <p className="mb-2 text-right text-xs font-bold text-white/45">پاداش</p>
              <RewardBreakdown
                compact
                xp={rewardSummary.xp}
                fans={rewardSummary.fans}
                vault={rewardSummary.vault}
                cards={rewardSummary.cards}
                vaultNote="وارد گاوصندوق شد"
              />
            </div>
          )}

          <div className="mt-6 w-full max-w-sm space-y-3">
            <button
              onClick={onExit}
              className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
            >
              بازگشت به خانه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh flex flex-col pb-6">
      <QuizScreenHeader
        title="🥅 پنالتی"
        onBack={onExit}
        right={
          <div className="quiz-stat-pill rounded-2xl px-4 py-2 text-center">
            <p className="text-[10px] text-white/50 leading-none">گل</p>
            <p className="text-xl font-extrabold leading-tight text-gold-400">
              {faNum(goals)}/{faNum(KICKS)}
            </p>
          </div>
        }
      />

      <QuizProgressDots total={KICKS} current={index} results={results} />

      <div className="quiz-penalty-scene relative mx-auto mt-2 h-40 w-full max-w-xs">
        <span className="absolute left-1/2 top-0 -translate-x-1/2 text-7xl drop-shadow-lg">
          🥅
        </span>
        <span
          className={`absolute left-1/2 top-6 -translate-x-1/2 text-4xl ${
            phase === "reveal"
              ? lastResult === "save"
                ? "keeper-save"
                : "keeper-wrong"
              : ""
          }`}
        >
          🧤
        </span>
        {phase === "reveal" && (
          <span
            className={`absolute left-1/2 top-20 text-4xl ${
              lastResult === "goal" ? "ball-corner" : "ball-stopped"
            }`}
          >
            ⚽
          </span>
        )}
        {phase === "reveal" && (
          <span
            className={`quiz-penalty-result-label animate-pop absolute inset-x-0 bottom-0 text-center text-2xl font-extrabold ${
              lastResult === "goal" ? "text-gold-400" : "text-team-foe"
            }`}
          >
            {lastResult === "goal" ? "گُــل!" : "مهار شد!"}
          </span>
        )}
      </div>

      <QuizQuestionCard
        meta={`ضربهٔ ${faNum(index + 1)} از ${faNum(KICKS)}`}
        timerSeconds={secondsLeft}
        timerDanger={timerDanger}
        report={<ReportButton questionId={q.id} />}
      >
        <p className="text-lg font-extrabold leading-8 text-right text-pitch-900">
          {q.text}
        </p>
      </QuizQuestionCard>

      <div className="px-5 mt-3 space-y-2.5">
        {q.options.map((opt, i) => (
          <QuizOptionButton
            key={`${index}-${i}`}
            index={i}
            label={opt}
            state={optionState(i)}
            disabled={phase !== "aim"}
            onClick={() => shoot(i)}
          />
        ))}
      </div>
    </div>
  );
}
