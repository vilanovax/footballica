"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePenaltyStore } from "@/stores/penaltyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { getMatchDraw } from "@/actions/getMatchDraw";
import type { QuizQuestion } from "@/lib/quiz/types";
import type { GameConfig } from "@/lib/game/economy";
import type { HelperKey } from "@/lib/game/helpers";
import { getPenaltyLiveTimeLeftMs } from "@/lib/quiz/liveMatchClock";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { FuseTimer, type FuseTimerHandle } from "./FuseTimer";
import { QuestionCard } from "./QuestionCard";
import { AnswerButton } from "./AnswerButton";
import { ExplanationFact } from "./ExplanationFact";
import { HelperDock } from "./HelperDock";
import { Scoreboard } from "./Scoreboard";
import { GoalBurst } from "./GoalBurst";
import { MissedPopup } from "./MissedPopup";
import { MatchLeaveControl } from "./MatchLeaveControl";
import { MatchPitch } from "./MatchPitch";
import { stadiumScene } from "@/lib/club/stadiumScene";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

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

/** Auto-advance delay after a scored goal (miss waits for Continue tap). */
const GOAL_REVEAL_MS = 1500;

type PenaltyMatchProps = {
  /** FTUE tutorial run: short shootout with a guaranteed payout. */
  tutorial?: boolean;
  /** Server-drawn question set (authoritative bank lives in the DB). */
  initialQuestions: QuizQuestion[];
  /** Spare questions backing the Substitution helper. */
  bench: QuizQuestion[];
  /** Kicks per match, from the Live-Ops config; reused for Play Again. */
  matchSize: number;
  /** Coin balance at kickoff — the affordability ceiling for helpers. */
  startingCoins: number;
  /** Live in-match helper costs. */
  helpers: GameConfig["helpers"];
  /** Club stadium tier — tints the pitch the kicks are played on. */
  stadiumLevel: number;
  /** Fans granted for each goal. Tutorial uses a flat payout instead. */
  fansPerGoal: number;
};

export function PenaltyMatch({
  tutorial = false,
  initialQuestions,
  bench,
  matchSize,
  startingCoins,
  helpers,
  stadiumLevel,
  fansPerGoal,
}: PenaltyMatchProps) {
  const router = useRouter();
  const { t } = useTranslation();
  // Active language drives which localized question content is rendered.
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
  const applyHelper = usePenaltyStore((s) => s.useHelper);
  const setPaused = usePenaltyStore((s) => s.setPaused);

  const [shake, setShake] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const fuseRef = useRef<FuseTimerHandle>(null);

  const handleLeaveMatch = useCallback(() => {
    reset();
    router.push("/play");
  }, [reset, router]);

  // Seed only while idle. After resolveMatch, Next refreshes this force-dynamic
  // route and `loading.tsx` remounts the tree — a blind start()+reset() cleanup
  // was restarting the quiz so the player played twice. Leave/exit call reset().
  useEffect(() => {
    if (usePenaltyStore.getState().phase !== "idle") return;
    start(initialQuestions, {
      bench,
      startingCoins,
      helpers: tutorial ? null : helpers,
    });
    playSound("whistle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play Again draws a FRESH set + an up-to-date coin budget so replays aren't
  // identical and helpers price against the new balance. Falls back to the
  // initial set if the fetch returns nothing.
  const handlePlayAgain = useCallback(async () => {
    const draw = await getMatchDraw(
      tutorial
        ? { count: matchSize, bench: 0, difficulties: ["easy"] }
        : { count: matchSize, bench: 3 },
    );
    start(draw.questions.length > 0 ? draw.questions : initialQuestions, {
      bench: draw.bench,
      startingCoins: draw.startingCoins,
      helpers: tutorial ? null : helpers,
    });
    playSound("whistle");
  }, [tutorial, matchSize, start, initialQuestions, helpers]);

  // Optimistic helper spend: apply the effect instantly (settled server-side in
  // resolveMatch). The dock only fires onUse when the helper is actually usable.
  const handleUseHelper = useCallback(
    (key: HelperKey) => {
      applyHelper(key);
      haptic(HAPTIC.tap);
      playSound("upgrade");
    },
    [applyHelper],
  );

  // Timer loop via rAF — only runs while playing (paused on reveal).
  // Clock lives outside Zustand; the fuse bar is painted imperatively so the
  // match tree does not re-render every frame.
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
      fuseRef.current?.setRatio(getPenaltyLiveTimeLeftMs() / duration);
      frameId = requestAnimationFrame(loop);
    };

    fuseRef.current?.setRatio(getPenaltyLiveTimeLeftMs() / duration);
    frameId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [phase, tick, durationMs]);

  // Reveal reactions: haptics, screen shake on miss, auto-advance on goal.
  useEffect(() => {
    if (phase !== "reveal" || !feedback) return;

    if (feedback.result === "goal") {
      playSound("goal");
      haptic(HAPTIC.goal); // light 50ms
    } else {
      playSound("miss");
      haptic(HAPTIC.miss); // heavy [100,50,100]
    }

    if (feedback.result === "goal") {
      const hasFact = Boolean(questions[currentIndex]?.explanation);
      const hold = hasFact ? 2200 : GOAL_REVEAL_MS;
      const t = setTimeout(() => next(), hold);
      return () => clearTimeout(t);
    }

    // Miss → shake the container; advance waits for the popup's Continue.
    setShake(true);
  }, [phase, feedback, next, questions, currentIndex]);

  if (phase === "finished" && rewards) {
    return (
      <MatchResult
        sessionId={sessionId}
        totalKicks={questions.length}
        tutorial={tutorial}
        helpersUsed={helpersLog}
        submissions={log.map((k) => ({
          questionId: k.questionId,
          selectedIndex: k.selectedIndex,
          msRemaining: k.msRemaining,
        }))}
        kickResults={log.map((k) => k.result === "goal")}
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
              <p className="truncate font-display text-sm font-black text-amber-200">
                {t("quiz.penaltyMode")}
              </p>
              <p className="truncate font-display text-[11px] font-bold text-white/70">
                {t("quiz.kickOf", {
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
            <GameIconWell size="md" amber src="/icons/target.png" />
          </div>
          <div className="relative mt-2.5 space-y-2">
            <Scoreboard
              kickNumber={currentIndex + 1}
              totalKicks={questions.length}
              goals={goals}
            />
            <FuseTimer ref={fuseRef} paused={locked || paused} />
          </div>
        </GamePanel>

        <AnimatePresence mode="wait">
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
        </AnimatePresence>

        <motion.div
          key={`opts-${question.id}`}
          className="flex flex-col gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
          }}
        >
          {content.options.map((option, index) => (
            <motion.div
              key={`${question.id}-${index}`}
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

        {!tutorial && helpers && (
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

      <AnimatePresence>
        {showGoal && (
          <GoalBurst key="goal" fans={tutorial ? 0 : fansPerGoal} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMiss && <MissedPopup key="miss" onContinue={() => next()} />}
      </AnimatePresence>

      <AnimatePresence>
        {reportOpen && (
          <ReportModal
            key="report"
            questionId={question.id}
            onClose={() => setReportOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
