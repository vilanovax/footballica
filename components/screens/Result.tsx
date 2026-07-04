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
      className={`result-outcome-badge grid h-10 w-10 place-items-center rounded-xl text-base font-extrabold ${
        correct
          ? variant === "you"
            ? "result-outcome-badge--you-ok"
            : "result-outcome-badge--foe-ok"
          : "result-outcome-badge--miss"
      }`}
      aria-label={correct ? "درست" : "غلط"}
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
  const budget = useGame((s) => s.budget);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);
  const credited = useRef(false);
  const [vaultOverflow, setVaultOverflow] = useState(0);

  const total = result.outcomes.length;
  const correctCount = result.outcomes.filter((o) => o.youCorrect).length;
  const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const scoreDiff = result.youScore - result.foeScore;
  const bank = isBank(vaultLevel);
  const showVaultCta =
    showVaultTutorial && result.vaultEarned > 0 && !bank && budget > 0;

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

  const lossMargin = !won && scoreDiff < 0 ? Math.abs(scoreDiff) : 0;
  const winMargin = won && scoreDiff > 0 ? scoreDiff : 0;

  return (
    <div className="quiz-screen pitch-stripes min-h-dvh flex flex-col pb-36">
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
          <p className="mt-1.5 text-sm font-medium text-white/72 leading-6">
            {won
              ? `${faNum(correctCount)} از ${faNum(total)} درست — عالی بود`
              : correctCount === 0
                ? `${faNum(correctCount)} از ${faNum(total)} درست — یک بار دیگر امتحان کن`
                : `${faNum(correctCount)} از ${faNum(total)} درست — نزدیک بود، دوباره بزن`}
          </p>

          <div className="result-accuracy mt-4 mx-auto max-w-[220px]">
            <div className="flex justify-between text-[11px] font-bold text-white/65 mb-1.5">
              <span>دقت</span>
              <span className={accuracyPct >= 60 ? "text-grass-400" : accuracyPct > 0 ? "text-gold-400" : "text-white/55"}>
                {faNum(accuracyPct)}٪
              </span>
            </div>
            <div className="result-accuracy-track h-2.5 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  accuracyPct >= 60
                    ? "bg-gradient-to-l from-grass-400 to-grass-500"
                    : accuracyPct >= 40
                      ? "bg-gradient-to-l from-gold-400 to-gold-500"
                      : accuracyPct > 0
                        ? "bg-gradient-to-l from-team-foe to-red-600"
                        : "bg-white/8"
                }`}
                style={{ width: `${Math.max(accuracyPct, accuracyPct === 0 ? 0 : 4)}%` }}
              />
            </div>
          </div>

          <div className="result-scoreboard mt-5 rounded-2xl p-4" dir="rtl">
            <div className="flex items-stretch justify-between gap-1">
              <div
                className={`result-scoreboard-side flex flex-col items-center gap-1.5 min-w-0 flex-1 rounded-xl px-2 py-2 ${
                  won ? "result-scoreboard-side--win" : "result-scoreboard-side--dim"
                }`}
              >
                <Avatar label={club.crest} color={club.color} size={56} crown={won} />
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gold-400">تو</p>
                <p className="text-xs text-white/65 truncate max-w-full">{club.name}</p>
                <p
                  className={`text-3xl font-extrabold leading-none tabular-nums ${
                    won ? "text-gold-400" : "text-white/90"
                  }`}
                >
                  {faNum(result.youScore)}
                </p>
              </div>

              <div className="result-vs-hub flex flex-col items-center justify-center gap-2 shrink-0 px-2">
                <span className="result-vs-badge">VS</span>
                {lossMargin > 0 && (
                  <span className="result-diff-pill result-diff-pill--loss">
                    −{faNum(lossMargin)}
                  </span>
                )}
                {winMargin > 0 && (
                  <span className="result-diff-pill result-diff-pill--win">
                    +{faNum(winMargin)}
                  </span>
                )}
                {scoreDiff === 0 && (
                  <span className="result-diff-pill result-diff-pill--draw">مساوی</span>
                )}
              </div>

              <div
                className={`result-scoreboard-side flex flex-col items-center gap-1.5 min-w-0 flex-1 rounded-xl px-2 py-2 ${
                  !won ? "result-scoreboard-side--win" : "result-scoreboard-side--dim"
                }`}
              >
                <Avatar label={OPPONENT.short} color="foe" size={56} />
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/50">حریف</p>
                <p className="text-xs text-white/65 truncate max-w-full">{OPPONENT.name}</p>
                <p
                  className={`text-3xl font-extrabold leading-none tabular-nums ${
                    !won ? "text-white" : "text-white/70"
                  }`}
                >
                  {faNum(result.foeScore)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* rewards */}
        <div className="result-rewards-block">
          <p className="mb-2 text-right text-xs font-bold text-white/55">پاداش</p>
          {hasRewards ? (
            <div className="result-rewards-card rounded-2xl p-1">
              <RewardBreakdown
                compact
                xp={result.xpEarned}
                fans={result.fansEarned}
                vault={result.vaultEarned}
                cards={result.cardsEarned}
                vaultNote={
                  result.vaultEarned > 0
                    ? bank
                      ? "مستقیم به خزانه"
                      : "وارد خزانه شد"
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="result-rewards-card rounded-2xl px-4 py-3.5 text-sm text-white/55 text-center">
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
            <p className="text-sm font-extrabold text-gold-400">🔐 قدم بعدی: باشگاه</p>
            <p className="mt-2 text-sm text-white/70 leading-6">
              پول در خزانه است. برو باشگاه و واحدها را ارتقا بده.
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
        <div className="result-review">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2.5 text-[10px] font-bold text-white/50">
              <span className="result-legend-chip result-legend-chip--ok">✓ درست</span>
              <span className="result-legend-chip result-legend-chip--miss">✕ غلط</span>
            </div>
            <p className="text-sm font-extrabold text-white/85">
              مرور سؤال‌ها ({faNum(total)})
            </p>
          </div>

          <div
            className="result-review-cols mb-2 grid items-center gap-x-2.5 px-3.5 text-[10px] font-extrabold text-white/45"
            style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2.5rem" }}
          >
            <span />
            <span className="text-right">سؤال</span>
            <span className="text-center text-gold-400/80">تو</span>
            <span className="text-center">حریف</span>
          </div>

          <div className="space-y-2">
            {result.outcomes.map((o, i) => (
              <div
                key={i}
                className={`result-outcome-row rounded-2xl px-3.5 py-3 ${
                  o.youCorrect ? "result-outcome-row--ok" : "result-outcome-row--miss"
                }`}
              >
                <div
                  className="grid items-center gap-x-2.5"
                  style={{ gridTemplateColumns: "2rem 1fr 2.5rem 2.5rem" }}
                >
                  <span className="result-outcome-num grid h-8 w-8 place-items-center rounded-xl text-sm font-extrabold">
                    {faNum(i + 1)}
                  </span>
                  <p className="min-w-0 text-right font-bold text-sm text-white/90 leading-6 line-clamp-2">
                    {o.label}
                  </p>
                  <div className="flex justify-center">
                    <OutcomeBadge correct={o.youCorrect} variant="you" />
                  </div>
                  <div className="flex justify-center">
                    <OutcomeBadge correct={o.foeCorrect} variant="foe" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="result-actions sticky bottom-0 inset-x-0 px-5 pt-4 pb-[calc(14px+env(safe-area-inset-bottom))] max-w-sm mx-auto w-full space-y-2.5">
        {!showVaultCta ? (
          <button
            onClick={onReplay}
            className="btn-gold w-full rounded-2xl py-4 text-lg font-extrabold active:scale-[0.98] transition-transform flex flex-col items-center gap-0.5"
          >
            <span>⚽ بازیِ دوباره</span>
            {!won && (
              <span className="text-[11px] font-bold opacity-75">فرصت جبران داری</span>
            )}
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
          className="w-full rounded-2xl result-home-btn py-3.5 font-bold text-white/88"
        >
          بازگشت به خانه
        </button>
      </div>
    </div>
  );
}
