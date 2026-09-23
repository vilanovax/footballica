"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizQuestion } from "@/lib/quiz/types";
import { useLanguageStore } from "@/stores/languageStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { AnswerButton } from "@/components/quiz/AnswerButton";
import { ExplanationFact } from "@/components/quiz/ExplanationFact";
import { GoalBurst } from "@/components/quiz/GoalBurst";
import { MatchLeaveControl } from "@/components/quiz/MatchLeaveControl";
import { MatchPitch } from "@/components/quiz/MatchPitch";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { ReportModal } from "@/components/quiz/ReportModal";
import { Scoreboard } from "@/components/quiz/Scoreboard";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import type { DuelAnswerSubmission } from "@/lib/duel/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type DuelQuizProps = {
  title: string;
  subtitle?: string;
  /** Attack = amber heat; defend = sky cool. */
  mode?: "attack" | "defend";
  questions: QuizQuestion[];
  pending?: boolean;
  /** Optional club stadium wash — defaults to ruined ground. */
  stadiumLevel?: number;
  onComplete: (answers: DuelAnswerSubmission[]) => void;
};

/**
 * Draft Duel quiz — same Arena DNA as Penalty (pitch, GamePanel HUD,
 * QuestionCard, AnswerButton). Fair-play: no helpers, no fuse.
 */
export function DuelQuiz({
  title,
  subtitle,
  mode = "attack",
  questions,
  pending,
  stadiumLevel = 0,
  onComplete,
}: DuelQuizProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const lang = useLanguageStore((s) => s.locale);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<DuelAnswerSubmission[]>([]);
  const [results, setResults] = useState<(boolean | null)[]>(() =>
    Array.from({ length: questions.length }, () => null),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealResult, setRevealResult] = useState<"goal" | "miss" | null>(
    null,
  );
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [qStartedAt, setQStartedAt] = useState(() => performance.now());

  const q = questions[index];
  if (!q) return null;

  const content = q.content[lang] ?? q.content.en;
  const total = questions.length;
  const goals = results.filter((r) => r === true).length;
  const isAttack = mode === "attack";
  const panelTone = isAttack ? ("amber" as const) : ("sky" as const);

  function handleSelect(picked: number) {
    if (locked || pending || !q) return;
    setLocked(true);
    const correct = picked === q.correctIndex;
    const entry: DuelAnswerSubmission = {
      questionId: q.id,
      selectedIndex: picked,
      ms: Math.round(performance.now() - qStartedAt),
    };
    const nextAnswers = [...answers, entry];
    setAnswers(nextAnswers);
    setSelectedIndex(picked);
    setRevealResult(correct ? "goal" : "miss");
    setResults((prev) => {
      const next = [...prev];
      next[index] = correct;
      return next;
    });

    if (correct) {
      playSound("goal");
      haptic(HAPTIC.goal);
    } else {
      playSound("miss");
      haptic(HAPTIC.miss);
      setShake(true);
    }

    window.setTimeout(() => {
      if (index + 1 >= total) {
        onComplete(nextAnswers);
        return;
      }
      setIndex((i) => i + 1);
      setSelectedIndex(null);
      setRevealResult(null);
      setLocked(false);
      setQStartedAt(performance.now());
    }, q.explanation ? 1600 : 750);
  }

  return (
    <section className="relative -mx-4 flex min-h-0 flex-1 flex-col bg-arena px-4 text-arena-fg">
      <MatchPitch stadiumLevel={stadiumLevel} />

      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col gap-3 pb-3 pt-1",
          shake && "animate-screen-shake",
        )}
        onAnimationEnd={() => setShake(false)}
      >
        <GamePanel tone={panelTone} className="px-3 py-2.5">
          <div className="relative flex items-center gap-2">
            <MatchLeaveControl
              onConfirmLeave={() => router.push("/play/duel")}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate font-display text-sm font-black",
                  isAttack ? "text-amber-200" : "text-sky-200",
                )}
              >
                {title}
              </p>
              <p className="truncate font-display text-[11px] font-bold text-white/70">
                {t("duel.qOf", {
                  n: toLocaleDigits(index + 1, locale),
                  total: toLocaleDigits(total, locale),
                })}
              </p>
              {subtitle ? (
                <p
                  className={cn(
                    "truncate font-display text-[11px] font-bold",
                    isAttack ? "text-amber-100/90" : "text-sky-100/90",
                  )}
                >
                  {subtitle}
                </p>
              ) : (
                <p
                  className={cn(
                    "truncate font-display text-[11px] font-bold",
                    isAttack ? "text-amber-100/90" : "text-sky-100/90",
                  )}
                >
                  {t("duel.quizScore", {
                    n: toLocaleDigits(goals, locale),
                    total: toLocaleDigits(total, locale),
                  })}
                </p>
              )}
            </div>
            <GameIconWell
              size="md"
              amber={isAttack}
              src={isAttack ? "/icons/target.png" : "/icons/guesses.png"}
            />
          </div>

          <div className="relative mt-2.5 space-y-2">
            <Scoreboard
              kickNumber={index + 1}
              totalKicks={total}
              goals={goals}
            />
            {/* Shot result strip — DNA sibling to fuse, no timer */}
            <div className="flex w-full items-center gap-1.5">
              {Array.from({ length: total }, (_, i) => {
                const r = results[i];
                const current = i === index && !revealResult;
                const revealing = i === index && Boolean(revealResult);
                return (
                  <div
                    key={i}
                    className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  >
                    <motion.div
                      className={cn(
                        "absolute inset-y-0 inset-s-0 rounded-full",
                        r === true
                          ? "bg-emerald-400"
                          : r === false
                            ? "bg-rose-400"
                            : current || revealing
                              ? isAttack
                                ? "bg-amber-400"
                                : "bg-sky-400"
                              : "bg-transparent",
                      )}
                      initial={false}
                      animate={{
                        width:
                          r != null || current || revealing ? "100%" : "0%",
                        opacity: current ? [0.55, 1, 0.55] : 1,
                      }}
                      transition={
                        current
                          ? { opacity: { repeat: Infinity, duration: 1.1 } }
                          : { duration: 0.25 }
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </GamePanel>

        <AnimatePresence mode="wait">
          <QuestionCard
            key={q.id}
            text={content.text}
            category={content.category}
            type={q.type}
            mediaUrl={q.mediaUrl}
            careerPath={content.careerPath}
            higherLower={content.higherLower}
            imageCleared={Boolean(revealResult)}
            questionId={q.id}
            onReport={() => setReportOpen(true)}
          />
        </AnimatePresence>

        <motion.div
          key={`opts-${q.id}`}
          className="mt-auto flex flex-col gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.07, delayChildren: 0.08 },
            },
          }}
        >
          {content.options.map((label, i) => (
            <motion.div
              key={`${q.id}-${i}`}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 300, damping: 24 },
                },
              }}
            >
              <AnswerButton
                label={label}
                index={i}
                disabled={locked || Boolean(pending)}
                reveal={
                  revealResult
                    ? {
                        selectedIndex,
                        correctIndex: q.correctIndex,
                        result: revealResult,
                      }
                    : null
                }
                onSelect={() => handleSelect(i)}
              />
            </motion.div>
          ))}
        </motion.div>

        <ExplanationFact
          explanation={q.explanation}
          visible={Boolean(revealResult)}
        />
      </div>

      <AnimatePresence>
        {revealResult === "goal" && <GoalBurst key="goal" fans={0} />}
      </AnimatePresence>

      <AnimatePresence>
        {revealResult === "miss" && (
          <motion.div
            key="miss-burst"
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.4, y: 20 }}
              animate={{ scale: [0.4, 1.15, 1], y: [20, -8, -28] }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.85 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-4xl drop-shadow" aria-hidden>
                🧤
              </span>
              <span className="font-display text-3xl font-black text-rose-400 drop-shadow">
                {t("quiz.missed")}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportOpen && (
          <ReportModal
            key="report"
            questionId={q.id}
            onClose={() => setReportOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
