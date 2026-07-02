"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Avatar } from "@/components/ui/Avatar";
import { RewardBreakdown } from "@/components/ui/RewardBreakdown";
import { faNum, faMoney } from "@/lib/format";
import { useGame } from "@/lib/store";
import { isBank } from "@/lib/vault";
import type { MatchResult } from "@/lib/types";
import { OPPONENT } from "@/lib/types";

interface ResultProps {
  result: MatchResult;
  onHome: () => void;
  onReplay: () => void;
  onOpenClub: () => void;
}

function OutcomeBadge({
  correct,
  variant,
}: {
  correct: boolean;
  variant: "you" | "foe";
}) {
  return (
    <span
      className={`result-outcome-badge grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold ${
        correct
          ? variant === "you"
            ? "result-outcome-badge--you-ok"
            : "result-outcome-badge--foe-ok"
          : "result-outcome-badge--miss"
      }`}
    >
      {correct ? "✓" : "✕"}
    </span>
  );
}

export function Result({ result, onHome, onReplay, onOpenClub }: ResultProps) {
  const won = result.youScore >= result.foeScore;
  const isDuel = result.mode === "duel";
  const applyActivityReward = useGame((s) => s.applyActivityReward);
  const addTotalCorrect = useGame((s) => s.addTotalCorrect);
  const recordDailyPlay = useGame((s) => s.recordDailyPlay);
  const recordWin = useGame((s) => s.recordWin);
  const club = useGame((s) => s.club);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const vaultBalance = useGame((s) => s.vaultBalance);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);
  const credited = useRef(false);
  const [vaultOverflow, setVaultOverflow] = useState(0);

  const total = result.outcomes.length;
  const correctCount = result.outcomes.filter((o) => o.youCorrect).length;
  const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const scoreDiff = result.youScore - result.foeScore;
  const bank = isBank(vaultLevel);
  const showVaultCta =
    showVaultTutorial && result.vaultEarned > 0 && !bank && vaultBalance > 0;

  const hasRewards =
    result.xpEarned > 0 ||
    result.fansEarned > 0 ||
    result.vaultEarned > 0 ||
    result.cardsEarned > 0;

  useEffect(() => {
    if (credited.current) return;
    credited.current = true;
    const { overflow } = applyActivityReward({
      xp: result.xpEarned,
      fans: result.fansEarned,
      vaultMoney: result.vaultEarned,
      cards: result.cardsEarned,
    });
    if (overflow > 0) setVaultOverflow(overflow);
    addTotalCorrect(correctCount);
    recordDailyPlay();
    if (won) recordWin();
  }, [
    result,
    won,
    correctCount,
    applyActivityReward,
    addTotalCorrect,
    recordDailyPlay,
    recordWin,
  ]);

  useEffect(() => {
    if (!won) return;
    const end = Date.now() + 900;
    const tick = () => {
      confetti({
        particleCount: 4,
        spread: 70,
        startVelocity: 45,
        origin: { x: Math.random(), y: 0 },
        colors: ["#f5c542", "#2f9e5f", "#2f6fed", "#e5473f", "#ffffff"],
      });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [won]);

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh flex flex-col pb-32">
      <div className="flex-1 px-5 pt-6 space-y-5 max-w-sm mx-auto w-full">
        {/* hero + score */}
        <div
          className={`result-hero rounded-3xl p-5 text-center ${
            won ? "result-hero--win" : "result-hero--loss"
          }`}
        >
          <div className="text-5xl animate-pop">{won ? "🏆" : "💪"}</div>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            {won ? (isDuel ? "دوئل را بردی!" : "بردی!") : "این‌بار نشد"}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {won
              ? `${faNum(correctCount)} از ${faNum(total)} درست — عالی بود`
              : `${faNum(correctCount)} از ${faNum(total)} درست — دوباره بزن`}
          </p>

          <div className="result-accuracy mt-4 mx-auto max-w-[200px]">
            <div className="flex justify-between text-[10px] font-bold text-white/45 mb-1">
              <span>دقت</span>
              <span>{faNum(accuracyPct)}٪</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full rounded-full transition-all ${
                  accuracyPct >= 60
                    ? "bg-gradient-to-l from-grass-400 to-grass-500"
                    : accuracyPct >= 40
                      ? "bg-gradient-to-l from-gold-400 to-gold-500"
                      : "bg-gradient-to-l from-team-foe to-red-600"
                }`}
                style={{ width: `${accuracyPct}%` }}
              />
            </div>
          </div>

          <div
            className="quiz-scoreboard mt-5 rounded-2xl p-4 flex items-center justify-between gap-2"
            dir="rtl"
          >
            <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
              <Avatar label={club.crest} color={club.color} size={52} crown={won} />
              <p className="text-[10px] font-bold text-gold-400/80">تو</p>
              <p className="text-xs text-white/55 truncate max-w-full">{club.name}</p>
              <p
                className={`text-2xl font-extrabold leading-none ${
                  won ? "text-gold-400" : "text-white/90"
                }`}
              >
                {faNum(result.youScore)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 px-1">
              <span className="rounded-lg border border-gold-500/40 bg-black/20 px-2.5 py-1 text-xs font-extrabold text-gold-400">
                VS
              </span>
              {!won && scoreDiff < 0 && (
                <span className="text-[10px] font-bold text-team-foe">
                  −{faNum(Math.abs(scoreDiff))}
                </span>
              )}
              {won && scoreDiff > 0 && (
                <span className="text-[10px] font-bold text-grass-400">
                  +{faNum(scoreDiff)}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
              <Avatar label={OPPONENT.short} color="foe" size={52} />
              <p className="text-[10px] font-bold text-white/40">حریف</p>
              <p className="text-xs text-white/55 truncate max-w-full">{OPPONENT.name}</p>
              <p className="text-2xl font-extrabold leading-none text-white/85">
                {faNum(result.foeScore)}
              </p>
            </div>
          </div>
        </div>

        {/* rewards */}
        <div>
          <p className="mb-2 text-right text-xs font-bold text-white/45">پاداش</p>
          {hasRewards ? (
            <RewardBreakdown
              compact
              xp={result.xpEarned}
              fans={result.fansEarned}
              vault={result.vaultEarned}
              cards={result.cardsEarned}
              vaultNote={
                result.vaultEarned > 0
                  ? bank
                    ? "مستقیم به بودجه"
                    : "وارد گاوصندوق شد"
                  : undefined
              }
            />
          ) : (
            <div className="quiz-reward-row text-sm text-white/45 justify-center">
              بدون پاداش — تمرینِ خوب بود
            </div>
          )}
          {vaultOverflow > 0 && (
            <p className="mt-2 text-center text-xs text-team-foe leading-5">
              گاوصندوق پر بود — {faMoney(vaultOverflow)} از دست رفت.
            </p>
          )}
        </div>

        {showVaultCta && (
          <div className="rounded-2xl border border-gold-500/45 bg-gold-500/10 p-4 text-right animate-pulse-soft">
            <p className="text-sm font-extrabold text-gold-400">🔐 قدم بعدی: گاوصندوق</p>
            <p className="mt-2 text-sm text-white/70 leading-6">
              درآمد در گاوصندوق است. برداشت کن تا باشگاه را ارتقا بدهی.
            </p>
            <button
              onClick={onOpenClub}
              className="btn-gold mt-3 w-full rounded-xl py-3 text-sm font-extrabold"
            >
              🏟️ برو به باشگاه
            </button>
          </div>
        )}

        {/* question review */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-3 text-[10px] font-bold text-white/40">
              <span className="flex items-center gap-1">
                <span className="result-legend-dot result-legend-dot--you" /> تو
              </span>
              <span className="flex items-center gap-1">
                <span className="result-legend-dot result-legend-dot--foe" /> حریف
              </span>
            </div>
            <p className="text-sm font-extrabold text-white/70">
              مرور سؤال‌ها ({faNum(total)})
            </p>
          </div>

          <div className="space-y-2">
            {result.outcomes.map((o, i) => (
              <div
                key={i}
                className={`result-outcome-row rounded-2xl p-3.5 ${
                  o.youCorrect ? "result-outcome-row--ok" : "result-outcome-row--miss"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="result-outcome-num grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold">
                    {faNum(i + 1)}
                  </span>
                  <p className="flex-1 min-w-0 text-right font-bold text-sm text-white/88 leading-6 line-clamp-2">
                    {o.label}
                  </p>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[9px] font-bold text-gold-400/70">تو</span>
                    <OutcomeBadge correct={o.youCorrect} variant="you" />
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[9px] font-bold text-white/35">حریف</span>
                    <OutcomeBadge correct={o.foeCorrect} variant="foe" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="result-actions sticky bottom-0 inset-x-0 px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] max-w-sm mx-auto w-full space-y-2.5">
        {!showVaultCta ? (
          <button
            onClick={onReplay}
            className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform"
          >
            ⚽ بازیِ دوباره
          </button>
        ) : (
          <button
            onClick={onReplay}
            className="w-full rounded-2xl bg-white/10 py-3.5 font-bold text-white/80"
          >
            ⚽ بازیِ دوباره
          </button>
        )}
        <button
          onClick={onHome}
          className="w-full rounded-2xl quiz-header-btn py-3.5 font-bold text-white/85"
        >
          بازگشت به خانه
        </button>
      </div>
    </div>
  );
}
