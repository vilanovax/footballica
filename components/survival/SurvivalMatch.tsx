"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSurvivalStore } from "@/stores/survivalStore";
import { useLanguageStore } from "@/stores/languageStore";
import { drawSurvivalBatch } from "@/actions/match/drawSurvivalBatch";
import type { QuizQuestion } from "@/lib/quiz/types";
import type { DuelCategoryOption } from "@/lib/duel/types";
import {
  SURVIVAL_LIVES,
  SURVIVAL_PREFETCH_BELOW,
} from "@/lib/game/survival";
import { getSurvivalLiveTimeLeftMs } from "@/lib/quiz/liveMatchClock";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import {
  QuickTimer,
  type QuickTimerHandle,
} from "@/components/quiz/QuickTimer";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { AnswerButton } from "@/components/quiz/AnswerButton";
import { ExplanationFact } from "@/components/quiz/ExplanationFact";
import { MatchLeaveControl } from "@/components/quiz/MatchLeaveControl";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

// Post-match / rare chrome — mirror PenaltyMatch kickoff split.
const SurvivalResult = dynamic(() =>
  import("@/components/survival/SurvivalResult").then((m) => m.SurvivalResult),
);
const ReportModal = dynamic(() =>
  import("@/components/quiz/ReportModal").then((m) => m.ReportModal),
);
const GoalBurst = dynamic(() =>
  import("@/components/quiz/GoalBurst").then((m) => m.GoalBurst),
);
const FormatDevToggle = dynamic(() =>
  import("@/components/quiz/FormatDevToggle").then((m) => m.FormatDevToggle),
);

const REVEAL_MS = 900;

type SurvivalMatchProps = {
  category: DuelCategoryOption;
  initialQuestions: QuizQuestion[];
  /** Premium RecordChallenge id (requires prior unlock). */
  challengeId?: string | null;
  /** Personal best for this category (chase line in HUD). */
  categoryBest?: number;
};

export function SurvivalMatch({
  category,
  initialQuestions,
  challengeId = null,
  categoryBest = 0,
}: SurvivalMatchProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const lang = useLanguageStore((s) => s.locale);

  const phase = useSurvivalStore((s) => s.phase);
  const queue = useSurvivalStore((s) => s.queue);
  const lives = useSurvivalStore((s) => s.lives);
  const score = useSurvivalStore((s) => s.score);
  const durationMs = useSurvivalStore((s) => s.durationMs);
  const feedback = useSurvivalStore((s) => s.feedback);
  const log = useSurvivalStore((s) => s.log);
  const endReason = useSurvivalStore((s) => s.endReason);
  const categoryId = useSurvivalStore((s) => s.categoryId);
  const sessionId = useSurvivalStore((s) => s.sessionId);
  const paused = useSurvivalStore((s) => s.paused);
  const prefetching = useSurvivalStore((s) => s.prefetching);

  const start = useSurvivalStore((s) => s.start);
  const tick = useSurvivalStore((s) => s.tick);
  const answer = useSurvivalStore((s) => s.answer);
  const next = useSurvivalStore((s) => s.next);
  const appendBatch = useSurvivalStore((s) => s.appendBatch);
  const clearBank = useSurvivalStore((s) => s.clearBank);
  const setPrefetching = useSurvivalStore((s) => s.setPrefetching);
  const reset = useSurvivalStore((s) => s.reset);
  const setPaused = useSurvivalStore((s) => s.setPaused);

  const [shake, setShake] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [heartBurst, setHeartBurst] = useState<number | null>(null);
  const prevLives = useRef(SURVIVAL_LIVES);
  const prefetchLock = useRef(false);
  const timerRef = useRef<QuickTimerHandle>(null);

  const handleLeaveMatch = useCallback(() => {
    reset();
    router.push("/play/survival");
  }, [reset, router]);

  useEffect(() => {
    if (lives < prevLives.current) {
      setHeartBurst(lives);
      const id = window.setTimeout(() => setHeartBurst(null), 700);
      prevLives.current = lives;
      return () => window.clearTimeout(id);
    }
    prevLives.current = lives;
  }, [lives]);

  useEffect(() => {
    if (useSurvivalStore.getState().phase !== "idle") return;
    start(category.id, initialQuestions);
    playSound("whistle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prefetch = useCallback(async () => {
    if (prefetchLock.current) return;
    prefetchLock.current = true;
    setPrefetching(true);
    try {
      const state = useSurvivalStore.getState();
      const cat = state.categoryId;
      if (!cat) return;
      // Answered + still in the local queue — avoid re-drawing in-flight cards.
      const excludeIds = [
        ...new Set([
          ...state.seenQuestionIds,
          ...state.queue.map((q) => q.id),
          ...state.log.map((e) => e.questionId),
        ]),
      ];
      const res = await drawSurvivalBatch({
        categoryId: cat,
        seenQuestionIds: excludeIds,
        challengeId,
      });
      if (!res.ok) return;
      if (res.questions.length === 0) {
        // Victory Cap only when the local queue is also empty.
        const remaining = useSurvivalStore.getState().queue.length;
        if (remaining === 0) {
          clearBank();
          playSound("goal");
          haptic(HAPTIC.goal);
        }
        return;
      }
      appendBatch(res.questions);
    } finally {
      prefetchLock.current = false;
      setPrefetching(false);
    }
  }, [appendBatch, clearBank, setPrefetching, challengeId]);

  // Timer loop — live clock + imperative bar (no per-frame React).
  useEffect(() => {
    if (phase !== "playing") return;
    let frameId = 0;
    let last: number | null = null;
    let cancelled = false;
    const duration = Math.max(1, durationMs);
    const loop = (ts: number) => {
      if (cancelled) return;
      if (last !== null) tick(ts - last);
      last = ts;
      timerRef.current?.setRatio(getSurvivalLiveTimeLeftMs() / duration);
      frameId = requestAnimationFrame(loop);
    };
    timerRef.current?.setRatio(getSurvivalLiveTimeLeftMs() / duration);
    frameId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [phase, tick, durationMs]);

  // Reveal → advance / Victory Cap
  useEffect(() => {
    if (phase !== "reveal" || !feedback) return;

    if (feedback.result === "goal") {
      playSound("goal");
      haptic(HAPTIC.goal);
    } else {
      playSound("miss");
      haptic(HAPTIC.miss);
      setShake(true);
    }

    const question = queue[0];
    const hasFact = Boolean(question?.explanation);
    const isMiss = feedback.result !== "goal";
    // Keep learning beat on misses; keep goals snappy for Survival pace.
    const revealMs = hasFact && isMiss ? 1400 : REVEAL_MS;
    const timer = setTimeout(() => {
      const advance = next();
      if (advance.finished) return;
      if (advance.needPrefetch) {
        void prefetch();
      }
    }, revealMs);

    return () => clearTimeout(timer);
  }, [phase, feedback, next, prefetch, queue]);

  // If we're playing with an empty queue (waiting on prefetch), keep trying.
  useEffect(() => {
    if (phase !== "playing") return;
    if (queue.length > 0) return;
    if (prefetching) return;
    void prefetch();
  }, [phase, queue.length, prefetching, prefetch]);

  // Warm prefetch while still answering.
  useEffect(() => {
    if (phase !== "playing") return;
    if (queue.length === 0 || queue.length > SURVIVAL_PREFETCH_BELOW) return;
    if (prefetching) return;
    void prefetch();
  }, [phase, queue.length, prefetching, prefetch]);

  if (phase === "finished" && endReason && categoryId) {
    return (
      <SurvivalResult
        sessionId={sessionId}
        challengeId={challengeId}
        categoryId={categoryId}
        endReason={endReason}
        submissions={log.map((k) => ({
          questionId: k.questionId,
          selectedIndex: k.selectedIndex,
          msRemaining: k.msRemaining,
        }))}
        onPlayAgain={() => {
          reset();
          const qs = new URLSearchParams({
            category: category.id,
            run: String(Date.now()),
          });
          if (challengeId) qs.set("challenge", challengeId);
          router.replace(`/play/survival?${qs.toString()}`);
        }}
        onExit={() => {
          reset();
          router.push("/play/survival");
        }}
        onChangeCategory={() => {
          reset();
          if (challengeId) {
            router.push(
              `/play/survival?challenge=${encodeURIComponent(challengeId)}`,
            );
          } else {
            router.push("/play/survival?pick=1");
          }
        }}
      />
    );
  }

  const question = queue[0];
  if (!question) {
    return (
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-destructive/12 via-transparent to-primary/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-s-1/2 top-[28%] h-44 w-44 -translate-x-1/2 rounded-full bg-destructive/20 blur-3xl"
        />

        <motion.div
          className="relative"
          animate={{ scale: [1, 1.08, 1], y: [0, -6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.1,
            ease: "easeInOut",
          }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-destructive/25 blur-xl"
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.15, 0.9] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/heart.png"
            alt=""
            draggable={false}
            className="relative h-28 w-28 object-contain drop-shadow-[0_6px_18px_rgba(220,38,38,0.35)]"
          />
        </motion.div>

        <motion.p
          className="relative mt-5 font-display text-xl font-black text-foreground"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        >
          {t("survival.loadingBatch")}
        </motion.p>

        <div className="relative mt-4 flex items-center gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-destructive"
              animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
              transition={{
                repeat: Infinity,
                duration: 0.9,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  const content = question.content[lang] ?? question.content.en;
  const locked = phase === "reveal";
  const showGoal = locked && feedback?.result === "goal";
  const catLabel = locale === "fa" ? category.nameFa : category.nameEn;

  let streak = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]!.result === "goal") streak += 1;
    else break;
  }

  const critical = lives === 1;
  const chaseGap =
    categoryBest > 0 ? Math.max(0, categoryBest - score) : null;
  const beatingRecord = categoryBest > 0 && score > categoryBest;

  return (
    <section
      className={[
        "relative -mx-4 flex flex-1 flex-col bg-arena px-4 text-arena-fg",
        critical ? "survival-critical" : "",
      ].join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-b from-arena-deep via-arena to-arena-mid" />
        <div className="game-pinstripe absolute inset-0 opacity-60" />
        <div
          className={[
            "absolute -inset-e-16 top-0 h-48 w-48 rounded-full blur-3xl transition-opacity duration-500",
            critical ? "bg-rose-500/28 opacity-100" : "bg-rose-400/12",
          ].join(" ")}
        />
        <div className="absolute -inset-s-20 top-40 h-40 w-40 rounded-full bg-amber-400/12 blur-3xl" />
      </div>

      {process.env.NODE_ENV === "development" ? <FormatDevToggle /> : null}
      <div
        className={[
          "relative z-10 flex flex-1 flex-col gap-4",
          shake ? "animate-screen-shake" : "",
        ].join(" ")}
        onAnimationEnd={() => setShake(false)}
      >
        <GamePanel
          tone="rose"
          className={[
            "px-3 py-2.5 transition-shadow duration-300",
            critical
              ? "shadow-[0_0_0_1px_rgba(251,113,133,0.55),0_0_28px_rgba(244,63,94,0.35)]"
              : "",
          ].join(" ")}
        >
          <div className="relative flex items-center gap-2">
            <MatchLeaveControl
              setPaused={setPaused}
              onConfirmLeave={handleLeaveMatch}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-black text-rose-100">
                {t("survival.eyebrow")}
              </p>
              <p className="truncate font-display text-[11px] font-bold text-white/70">
                {catLabel}
              </p>
            </div>
            {critical ? (
              <GameChip tone="amber" className="shrink-0 text-[10px]">
                {t("survival.lastHeart")}
              </GameChip>
            ) : (
              <GameIconWell size="md" src="/icons/heart.png" />
            )}
          </div>

          <div className="relative mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-0.5 rounded-full bg-black/35 px-2.5 py-1",
                critical
                  ? "shadow-[inset_0_0_0_1px_rgba(251,113,133,0.65),0_0_14px_rgba(244,63,94,0.4)]"
                  : "shadow-[inset_0_0_0_1px_rgba(251,113,133,0.35)]",
              ].join(" ")}
              aria-label={t("survival.lives", {
                n: toLocaleDigits(lives, locale),
              })}
            >
              {Array.from({ length: SURVIVAL_LIVES }).map((_, i) => {
                const alive = i < lives;
                const justLost = heartBurst !== null && i === heartBurst;
                return (
                  <motion.span
                    key={i}
                    animate={
                      justLost
                        ? { scale: [1.2, 0.4], opacity: [1, 0], rotate: [0, -25] }
                        : alive
                          ? critical && i === 0
                            ? { scale: [1, 1.12, 1], opacity: 1 }
                            : { scale: 1, opacity: 1 }
                          : { scale: 0.7, opacity: 0.22 }
                    }
                    transition={
                      justLost
                        ? { duration: 0.45, ease: "easeIn" }
                        : critical && alive && i === 0
                          ? {
                              duration: 0.9,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : { type: "spring", stiffness: 400, damping: 20 }
                    }
                    aria-hidden
                    className="inline-flex"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={alive || justLost ? "/icons/heart.png" : "/icons/broken-heart.png"}
                      alt=""
                      draggable={false}
                      className="h-5 w-5 object-contain"
                    />
                  </motion.span>
                );
              })}
            </span>
            <GameChip tone="emerald" className="gap-1 px-2.5 py-1 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/trophy.png"
                alt=""
                aria-hidden
                className="h-3.5 w-3.5 object-contain"
              />
              <span className="tabular-nums">
                {t("survival.score")} {toLocaleDigits(score, locale)}
              </span>
            </GameChip>
            <GameChip
              tone={streak >= 2 ? "amber" : "default"}
              className="gap-1 px-2.5 py-1 text-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/streak.png"
                alt=""
                aria-hidden
                className="h-3.5 w-3.5 object-contain"
              />
              {toLocaleDigits(streak, locale)}
            </GameChip>
            {categoryBest > 0 ? (
              <GameChip
                tone={beatingRecord ? "amber" : "default"}
                className="gap-1 px-2.5 py-1 text-[11px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/target.png"
                  alt=""
                  aria-hidden
                  className="h-3.5 w-3.5 object-contain"
                />
                <span className="tabular-nums">
                  {beatingRecord
                    ? t("survival.beatingRecord")
                    : chaseGap === 0
                      ? t("survival.tiedRecord")
                      : t("survival.chaseRecord", {
                          n: toLocaleDigits(chaseGap!, locale),
                        })}
                </span>
              </GameChip>
            ) : null}
          </div>

          <div className="relative mt-2.5">
            <QuickTimer ref={timerRef} paused={locked || paused} />
          </div>
        </GamePanel>

        <QuestionCard
          key={question.id}
          text={content.text}
          category={content.category || catLabel}
          type={question.type}
          mediaUrl={question.mediaUrl}
          careerPath={content.careerPath}
          higherLower={content.higherLower}
          imageCleared={locked}
          questionId={question.id}
          onReport={() => setReportOpen(true)}
        />

        <div className="flex flex-col gap-3">
          {content.options.map((label, index) => (
            <AnswerButton
              key={`${question.id}-${index}`}
              label={label}
              index={index}
              disabled={locked}
              reveal={feedback}
              onSelect={(i) => answer(i)}
            />
          ))}
        </div>

        {locked && (
          <ExplanationFact
            explanation={question.explanation}
            visible={locked}
          />
        )}
      </div>

      {showGoal && <GoalBurst />}
      {reportOpen && (
        <ReportModal
          questionId={question.id}
          onClose={() => setReportOpen(false)}
        />
      )}
    </section>
  );
}
