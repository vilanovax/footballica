"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RewardBreakdown } from "@/components/ui/RewardBreakdown";
import { faNum, faMoney } from "@/lib/format";
import { useGame } from "@/lib/store";
import { useClubAvatar } from "@/lib/clubAvatar";
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
  const isRankedDuel = isDuel && result.duelKind === "ranked";
  const applyActivityReward = useGame((s) => s.applyActivityReward);
  const applyArenaDelta = useGame((s) => s.applyArenaDelta);
  const addTotalCorrect = useGame((s) => s.addTotalCorrect);
  const recordDailyPlay = useGame((s) => s.recordDailyPlay);
  const recordWin = useGame((s) => s.recordWin);
  const club = useGame((s) => s.club);
  const clubAvatar = useClubAvatar();
  const vaultLevel = useGame((s) => s.vaultLevel);
  const budget = useGame((s) => s.budget);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);
  const credited = useRef(false);
  const [vaultOverflow, setVaultOverflow] = useState(0);

  const total = result.outcomes.length;
  const correctCount = result.outcomes.filter((o) => o.youCorrect).length;
  const wrongCount = Math.max(0, total - correctCount);
  const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const scoreDiff = result.youScore - result.foeScore;
  const bank = isBank(vaultLevel);
  const showVaultCta =
    showVaultTutorial && result.vaultEarned > 0 && !bank && budget > 0;

  const hasRewards =
    result.xpEarned > 0 ||
    result.fansEarned > 0 ||
    result.vaultEarned > 0 ||
    result.cardsEarned > 0 ||
    (result.arenaDelta !== undefined && result.arenaDelta !== 0);

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
    if (result.arenaDelta) applyArenaDelta(result.arenaDelta);
    addTotalCorrect(correctCount);
    recordDailyPlay();
    if (won) recordWin();
  }, [
    result,
    won,
    correctCount,
    applyActivityReward,
    applyArenaDelta,
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
        <GameCard
          variant="hero"
          className={`result-hero rounded-3xl p-5 text-center ${
            won ? "result-hero--win" : "result-hero--loss"
          }`}
        >
          <p className="result-hero__eyebrow">
            {isRankedDuel
              ? "پایان دوئل رنکد"
              : isDuel
                ? "پایان دوئل"
                : "پایان بازی سریع"}
          </p>
          <div className="text-5xl animate-pop">{won ? "🏆" : "💪"}</div>
          <h1 className="mt-2 text-2xl font-extrabold text-white">
            {won
              ? isRankedDuel
                ? "رنکد را بردی!"
                : isDuel
                  ? "دوئل را بردی!"
                  : "بردی!"
              : "این‌بار نشد"}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-white/72 leading-6">
            {won
              ? `${faNum(correctCount)} از ${faNum(total)} درست — عالی بود`
              : correctCount === 0
                ? `${faNum(correctCount)} از ${faNum(total)} درست — یک بار دیگر امتحان کن`
                : `${faNum(correctCount)} از ${faNum(total)} درست — نزدیک بود، دوباره بزن`}
          </p>

          <div className="result-summary-grid mt-4">
            <div className="result-summary-stat">
              <span className="result-summary-stat__label">حالت بازی</span>
              <span className="result-summary-stat__value result-summary-stat__value--mode">
                {isRankedDuel
                  ? "🏆 رنکد"
                  : isDuel
                    ? "⚔️ دوئل"
                    : "⚽ سریع"}
              </span>
            </div>
            <div className="result-summary-stat">
              <span className="result-summary-stat__label">دقت</span>
              <span className="result-summary-stat__value result-summary-stat__value--accuracy">
                {faNum(accuracyPct)}٪
              </span>
            </div>
            <div className="result-summary-stat">
              <span className="result-summary-stat__label">اختلاف</span>
              <span
                className={`result-summary-stat__value ${
                  scoreDiff > 0
                    ? "result-summary-stat__value--lead"
                    : scoreDiff < 0
                      ? "result-summary-stat__value--trail"
                      : "result-summary-stat__value--draw"
                }`}
              >
                {scoreDiff > 0
                  ? `+${faNum(winMargin)}`
                  : scoreDiff < 0
                    ? `−${faNum(lossMargin)}`
                    : "مساوی"}
              </span>
            </div>
          </div>

          <div className="result-accuracy mt-4 mx-auto max-w-[220px]">
            <div className="flex justify-between text-[11px] font-bold text-white/65 mb-1.5">
              <span>دقت</span>
              <span className={accuracyPct >= 60 ? "text-grass-400" : accuracyPct > 0 ? "text-gold-400" : "text-white/55"}>
                {faNum(accuracyPct)}٪
              </span>
            </div>
            <ProgressBar
              value={accuracyPct}
              max={100}
              tone={accuracyPct >= 60 ? "success" : accuracyPct >= 40 ? "money" : "danger"}
              trackClassName="result-accuracy-track h-2.5"
              fillClassName={accuracyPct === 0 ? "bg-white/8" : undefined}
            />
          </div>

          <div className="result-scoreboard mt-5 rounded-2xl p-4" dir="rtl">
            <div className="flex items-stretch justify-between gap-1">
              <div
                className={`result-scoreboard-side flex flex-col items-center gap-1.5 min-w-0 flex-1 rounded-xl px-2 py-2 ${
                  won ? "result-scoreboard-side--win" : "result-scoreboard-side--dim"
                }`}
              >
                <Avatar label={clubAvatar.label} color={clubAvatar.color} size={56} crown={won} />
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
        </GameCard>

        {/* rewards */}
        <div className="result-rewards-block">
          <div className="mb-2 text-right">
            <p className="text-xs font-bold text-white/55">پاداش</p>
            <p className="mt-0.5 text-[11px] text-white/40">
              {isRankedDuel
                ? "تغییر رتبه Arena — بدون مزیت اقتصادی"
                : "خروجی این راند برای پیشروی باشگاه"}
            </p>
          </div>
          {isRankedDuel && result.arenaDelta !== undefined ? (
            <GameCard variant="asset" className="result-rewards-card rounded-2xl p-4 text-right">
              <p className="text-xs font-bold text-white/55">رتبه Arena</p>
              <p
                className={`mt-1 text-2xl font-extrabold ${
                  result.arenaDelta >= 0 ? "text-grass-400" : "text-red-400"
                }`}
              >
                {result.arenaDelta >= 0 ? "+" : ""}
                {faNum(result.arenaDelta)}
              </p>
              <p className="mt-2 text-sm text-white/55">
                امتیاز به جدول Arena اضافه می‌شود
              </p>
            </GameCard>
          ) : hasRewards ? (
            <GameCard
              variant="asset"
              className="result-rewards-card rounded-2xl p-1"
            >
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
            </GameCard>
          ) : (
            <GameCard
              variant="locked"
              className="result-rewards-card rounded-2xl px-4 py-3.5 text-sm text-white/55 text-center"
            >
              بدون پاداش — تمرینِ خوب بود
            </GameCard>
          )}
          {vaultOverflow > 0 && (
            <p className="mt-2 text-center text-xs text-team-foe leading-5">
              گاوصندوق پر بود — {faMoney(vaultOverflow)} از دست رفت.
            </p>
          )}
        </div>

        {showVaultCta && (
          <GameCard
            variant="hero"
            className="rounded-2xl border border-gold-500/45 bg-gold-500/10 p-4 text-right animate-pulse-soft"
          >
            <p className="text-sm font-extrabold text-gold-400">🔐 قدم بعدی: باشگاه</p>
            <p className="mt-2 text-sm text-white/70 leading-6">
              پول در خزانه است. برو باشگاه و واحدها را ارتقا بده.
            </p>
            <Button
              onClick={onOpenClub}
              variant="primary"
              size="md"
              fullWidth
              className="mt-3"
            >
              🏟️ برو به باشگاه
            </Button>
          </GameCard>
        )}

        {/* question review */}
        <div className="result-review">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2.5 text-[10px] font-bold text-white/50">
              <span className="result-legend-chip result-legend-chip--ok">
                ✓ درست {faNum(correctCount)}
              </span>
              <span className="result-legend-chip result-legend-chip--miss">
                ✕ غلط {faNum(wrongCount)}
              </span>
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
              <GameCard
                key={i}
                variant={o.youCorrect ? "asset" : "locked"}
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
              </GameCard>
            ))}
          </div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="result-actions sticky bottom-0 inset-x-0 px-5 pt-4 pb-[calc(14px+env(safe-area-inset-bottom))] max-w-sm mx-auto w-full space-y-2.5">
        {!showVaultCta ? (
          <Button
            onClick={onReplay}
            variant="primary"
            size="lg"
            fullWidth
            className="text-lg flex flex-col items-center gap-0.5"
          >
            <span>{isDuel ? "⚔️ دوئل دوباره" : "⚽ بازیِ دوباره"}</span>
            {!won && (
              <span className="text-[11px] font-bold opacity-75">فرصت جبران داری</span>
            )}
          </Button>
        ) : (
          <Button
            onClick={onReplay}
            variant="muted"
            size="md"
            fullWidth
            className="font-bold text-white/80"
          >
            {isDuel ? "⚔️ دوئل دوباره" : "⚽ بازیِ دوباره"}
          </Button>
        )}
        <Button
          onClick={onHome}
          variant="secondary"
          size="md"
          fullWidth
          className="result-home-btn font-bold text-white/88"
        >
          بازگشت به خانه
        </Button>
      </div>
    </div>
  );
}
