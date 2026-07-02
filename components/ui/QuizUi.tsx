"use client";

import type { ReactNode } from "react";
import { faNum } from "@/lib/format";

export function QuizScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-6">
      <button
        onClick={onBack}
        className="quiz-header-btn grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold"
        aria-label="خروج"
      >
        ›
      </button>
      <h1 className="text-lg font-extrabold text-white">{title}</h1>
      {right ?? <div className="w-10" />}
    </div>
  );
}

export function QuizQuestionCard({
  meta,
  timerSeconds,
  timerDanger,
  children,
  report,
}: {
  meta: string;
  timerSeconds?: number;
  timerDanger?: boolean;
  children: ReactNode;
  report: ReactNode;
}) {
  return (
    <div className="quiz-question-card mx-5 mt-4 rounded-3xl p-4 animate-rise">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {timerSeconds !== undefined && (
            <span
              className={`quiz-timer-badge rounded-lg px-2.5 py-1 text-xs font-bold ${
                timerDanger ? "quiz-timer-badge--danger" : ""
              }`}
            >
              ⏱ {faNum(timerSeconds)} ثانیه
            </span>
          )}
          {report}
        </div>
        <span className="text-xs font-bold text-pitch-800/55">{meta}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function QuizOptionButton({
  index,
  label,
  state,
  disabled,
  onClick,
}: {
  index: number;
  label: string;
  state: "idle" | "correct" | "wrong" | "dim";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`quiz-option w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-right font-bold transition active:scale-[0.98] quiz-option--${state}`}
    >
      <span className="quiz-option-num grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold">
        {faNum(index + 1)}
      </span>
      <span className="flex-1 leading-6">{label}</span>
      {state === "correct" && <span className="text-lg">✅</span>}
      {state === "wrong" && <span className="text-lg">❌</span>}
    </button>
  );
}

export function QuizProgressDots({
  total,
  current,
  results,
}: {
  total: number;
  current: number;
  results?: ("goal" | "save" | null)[];
}) {
  return (
    <div className="flex justify-center gap-2 pt-4 px-5">
      {Array.from({ length: total }).map((_, i) => {
        const r = results?.[i];
        const active = i === current;
        return (
          <span
            key={i}
            className={`quiz-kick-dot grid h-10 w-10 place-items-center rounded-xl text-lg ${
              r === "goal"
                ? "quiz-kick-dot--goal"
                : r === "save"
                  ? "quiz-kick-dot--save"
                  : active
                    ? "quiz-kick-dot--active"
                    : "quiz-kick-dot--pending"
            }`}
          >
            {r === "goal" ? "⚽" : r === "save" ? "🧤" : active ? "·" : ""}
          </span>
        );
      })}
    </div>
  );
}
