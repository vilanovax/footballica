"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePenaltyStore } from "@/stores/penaltyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { getMatchDraw } from "@/actions/getMatchDraw";
import type { QuizQuestion } from "@/lib/quiz/types";
import type { GameConfig } from "@/lib/game/economy";
import type { HelperKey } from "@/lib/game/helpers";
import { QUICK_DURATION_MS } from "@/lib/quiz/scoring";
import { getPenaltyLiveTimeLeftMs } from "@/lib/quiz/liveMatchClock";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { QuickTimer, type QuickTimerHandle } from "./QuickTimer";
import { QuestionCard } from "./QuestionCard";
import { AnswerButton } from "./AnswerButton";
import { ExplanationFact } from "./ExplanationFact";
import { HelperDock } from "./HelperDock";
import { GoalBurst } from "./GoalBurst";
import { MatchLeaveControl } from "./MatchLeaveControl";
import { MatchPitch } from "./MatchPitch";
import { stadiumScene } from "@/lib/club/stadiumScene";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { ResourceIcon } from "@/components/common/ResourceIcon";

// Post-match / rare chrome — keep out of the kickoff JS chunk.
const MatchResult = dynamic(() =>
  import("./MatchResult").then((m) => m.MatchResult),
);
const ReportModal = dynamic(() =>
  import("./ReportModal").then((m) => m.ReportModal),
);
const FormatDevToggle = dynamic(() =>
  import("./FormatDevToggle").then((m) => m.FormatDevToggle),
);

/**
 * Rapid-fire pause after each answer BEFORE auto-advancing. Unlike Penalty
 * Mode (which waits for a "Continue" tap on a miss), Quick Match keeps the
 * momentum by auto-advancing on BOTH a goal and a miss.
 */
const QUICK_REVEAL_MS = 850;

type QuickMatchProps = {
  /** Server-drawn question set (authoritative bank lives in the DB). */
  initialQuestions: QuizQuestion[];
  /** Spare questions backing the Substitution helper. */
  bench: QuizQuestion[];
  /** Questions per match, from Live-Ops config; reused for Play Again. */
  matchSize: number;
  /** Coin balance at kickoff — the affordability ceiling for helpers. */
  startingCoins: number;
  /** Live in-match helper costs. */
  helpers: GameConfig["helpers"];
  /** Club stadium tier — same pitch language as Penalty. */
  stadiumLevel: number;
  /** Fans granted for each correct answer. */
  fansPerGoal: number;
};

export function QuickMatch({
  initialQuestions,
  bench,
  matchSize,
  startingCoins,
  helpers,
  stadiumLevel,
  fansPerGoal,
}: QuickMatchProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const lang = useLanguageStore((s) => s.locale);

  const phase = usePenaltyStore((s) => s.phase);
  const questions = usePenaltyStore((s) => s.questions);
  const currentIndex = usePenaltyStore((s) => s.currentIndex);
  const durationMs = usePenaltyStore((s) => s.durationMs);
  const goals = usePenaltyStore((s) => s.goals);
  const feedback = usePenaltyStore((s) => s.feedback);
  const rewards = usePenaltyStore((s) => s.rewards);
  const sessionId = usePenaltyStore((s) => s.sessionId);
  const log = usePenaltyStore((s) => s.log);
  const paused = usePenaltyStore((s) => s.paused);
  const eliminated = usePenaltyStore((s) => s.eliminated);
  const helpersThisQuestion = usePenaltyStore((s) => s.helpersThisQuestion);
  const helpersLog = usePenaltyStore((s) => s.helpersLog);
  const coinsSpent = usePenaltyStore((s) => s.coinsSpent);
  const startCoins = usePenaltyStore((s) => s.startingCoins);
  const benchLeft = usePenaltyStore((s) => s.bench.length);

  const start = usePenaltyStore((s) => s.start);
  const tick = usePenaltyStore((s) => s.tick);
  const answer = usePenaltyStore((s) => s.answer);
  const next = usePenaltyStore((s) => s.next);
  const reset = usePenaltyStore((s) => s.reset);
  const timerRef = useRef<QuickTimerHandle>(null);
  const useHelper = usePenaltyStore((s) => s.useHelper);
  const setPaused = usePenaltyStore((s) => s.setPaused);

  const [shake, setShake] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const handleLeaveMatch = useCallback(() => {
    reset();
    router.push("/play");
  }, [reset, router]);

  // Seed only while idle — same remount trap as Penalty (resolveMatch refresh +
  // loading.tsx). Play Again re-seeds via handlePlayAgain; leave/exit reset().
  useEffect(() => {
    if (usePenaltyStore.getState().phase !== "idle") return;
    start(initialQuestions, {
      durationMs: QUICK_DURATION_MS,
      bench,
      startingCoins,
      helpers,
    });
    playSound("whistle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play Again draws a FRESH set + up-to-date coin budget so replays differ and
  // helpers price against the new balance.
  const handlePlayAgain = useCallback(async () => {
    const draw = await getMatchDraw({ count: matchSize, bench: 3 });
    start(draw.questions.length > 0 ? draw.questions : initialQuestions, {
      durationMs: QUICK_DURATION_MS,
      bench: draw.bench,
      startingCoins: draw.startingCoins,
      helpers,
    });
    playSound("whistle");
  }, [matchSize, start, initialQuestions, helpers]);

  // Optimistic helper spend — applied instantly, settled in resolveMatch.
  const handleUseHelper = useCallback(
    (key: HelperKey) => {
      useHelper(key);
      haptic(HAPTIC.tap);
      playSound("upgrade");
    },
    [useHelper],
  );

  // Timer loop via rAF — clock outside Zustand; bar painted imperatively.
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
      timerRef.current?.setRatio(getPenaltyLiveTimeLeftMs() / duration);
      frameId = requestAnimationFrame(loop);
    };

    timerRef.current?.setRatio(getPenaltyLiveTimeLeftMs() / duration);
    frameId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [phase, tick, durationMs]);

  // Reveal reactions: feedback SFX/haptics + shake on miss, then auto-advance
  // for BOTH outcomes — that constant forward motion is the rapid-fire feel.
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

    const hasFact = Boolean(questions[currentIndex]?.explanation);
    const timer = setTimeout(
      () => next(),
      hasFact ? 1600 : QUICK_REVEAL_MS,
    );
    return () => clearTimeout(timer);
  }, [phase, feedback, next, questions, currentIndex]);

  if (phase === "finished" && rewards) {
    return (
      <MatchResult
        sessionId={sessionId}
        totalKicks={questions.length}
        mode="quick"
        helpersUsed={helpersLog}
        submissions={log.map((k) => ({
          questionId: k.questionId,
          selectedIndex: k.selectedIndex,
          msRemaining: k.msRemaining,
        }))}
        onPlayAgain={handlePlayAgain}
        onExit={() => {
          reset();
          router.push("/club");
        }}
      />
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;

  const content = question.content[lang] ?? question.content.en;
  const locked = phase === "reveal";
  const showGoal = locked && feedback?.result === "goal";
  const showMiss = locked && feedback?.result === "miss";

  // Trailing run of correct answers (the live streak). The current kick is
  // already logged by the time we reveal, so this reflects it immediately.
  let streak = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].result === "goal") streak += 1;
    else break;
  }

  const scene = stadiumScene(stadiumLevel);

  return (
    <section className="relative -mx-4 flex flex-1 flex-col bg-arena px-4 text-arena-fg">
      <MatchPitch stadiumLevel={stadiumLevel} />

      {process.env.NODE_ENV === "development" ? <FormatDevToggle /> : null}
      <div
        className={[
          "relative z-10 flex flex-1 flex-col gap-4",
          shake ? "animate-screen-shake" : "",
        ].join(" ")}
        onAnimationEnd={() => setShake(false)}
      >
        <GamePanel tone={scene.tone} className="px-3 py-2.5">
          <div className="relative flex items-center gap-2">
            <MatchLeaveControl
              setPaused={setPaused}
              onConfirmLeave={handleLeaveMatch}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-black text-lime-200">
                {t("quiz.quickMode")}
              </p>
              <p className="truncate font-display text-[11px] font-bold text-white/70">
                {t("quiz.questionOf", {
                  n: toLocaleDigits(currentIndex + 1, lang),
                  total: toLocaleDigits(questions.length, lang),
                })}
              </p>
              <p className="truncate font-display text-[11px] font-bold text-amber-100/90">
                {t("stadium.lvl")} {toLocaleDigits(scene.index, lang)}
                {" · "}
                {t(`stadium.tiers.${scene.index}`)}
              </p>
            </div>
            <GameIconWell size="md" amber src="/icons/energy.png" />
          </div>

          <div className="relative mt-2.5 flex flex-wrap items-center gap-2">
            <GameChip tone="emerald" className="gap-1 px-2.5 py-1 text-sm">
              <ResourceIcon kind="xp" size="sm" className="h-3.5 w-3.5" />
              {toLocaleDigits(goals, lang)}
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
              {toLocaleDigits(streak, lang)}
            </GameChip>
          </div>

          <div className="relative mt-2.5">
            <QuickTimer ref={timerRef} paused={locked || paused} />
          </div>
        </GamePanel>

        <QuestionCard
          key={question.id}
          text={content.text}
          category={content.category}
          type={question.type}
          mediaUrl={question.mediaUrl}
          careerPath={content.careerPath}
          higherLower={content.higherLower}
          imageCleared={locked}
          questionId={question.id}
          onReport={() => setReportOpen(true)}
        />

        <motion.div
          key={`opts-${question.id}`}
          className="flex flex-col gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
          }}
        >
          {content.options.map((option, index) => (
            <motion.div
              key={`${question.id}-${index}`}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 320, damping: 24 },
                },
              }}
            >
              <AnswerButton
                label={option}
                index={index}
                disabled={locked}
                eliminated={eliminated.includes(index)}
                reveal={locked ? feedback : null}
                onSelect={(i) => answer(i)}
              />
            </motion.div>
          ))}
        </motion.div>

        <ExplanationFact
          explanation={question.explanation}
          visible={locked}
        />

        {helpers && (
          <HelperDock
            helpers={helpers}
            coinsLeft={startCoins - coinsSpent}
            usedThisQuestion={helpersThisQuestion}
            eliminatedCount={eliminated.length}
            optionCount={content.options.length}
            benchLeft={benchLeft}
            disabled={locked || paused}
            onUse={handleUseHelper}
          />
        )}
      </div>

      {showGoal && <GoalBurst fans={fansPerGoal} />}

      {/* Non-blocking miss flash — pointer-events-none so it never eats a tap
          (auto-advance handles progression; there is no Continue button). */}
      {showMiss && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            initial={{ scale: 0.4, y: 20, rotate: -8 }}
            animate={{ scale: [0.4, 1.2, 1], y: [20, -6, -30], rotate: [-8, 4, 0] }}
            transition={{ duration: 0.8, times: [0, 0.45, 1], ease: "easeOut" }}
            className="flex flex-col items-center gap-1"
            aria-hidden
          >
            <span className="text-5xl drop-shadow">🧤</span>
            <span className="font-display text-3xl font-bold text-destructive drop-shadow">
              {t("quiz.missed")}
            </span>
          </motion.span>
        </motion.div>
      )}

      {reportOpen && (
        <ReportModal
          questionId={question.id}
          onClose={() => setReportOpen(false)}
        />
      )}
    </section>
  );
}
