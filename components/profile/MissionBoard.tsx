"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  claimMyMissionChest,
  claimMyMissionReward,
  getMyMissions,
} from "@/actions/missions";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { MissionObjective } from "@/generated/prisma/client";
import {
  formatCountdownHms,
  msUntilTehranMidnight,
} from "@/lib/game/tehranClock";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import {
  FlyingCoins,
  FLYING_COINS_HIT_MS,
  spawnFlyingCoinsToHeader,
  type FlyingBurst,
} from "@/components/ui/FlyingCoins";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";
import { GameChip } from "@/components/ui/game/GameChip";

function PngIcon({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={[
        "object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.22)]",
        className ?? "h-7 w-7",
      ].join(" ")}
    />
  );
}

function RewardPills({
  coins,
  xp,
  dimmed,
  dark,
  size = "sm",
}: {
  coins: number;
  xp: number;
  dimmed?: boolean;
  dark?: boolean;
  size?: "sm" | "md";
}) {
  const { locale } = useTranslation();
  if (coins <= 0 && xp <= 0) return null;
  const text =
    size === "md"
      ? "text-xs font-black"
      : "text-[11px] font-black";
  return (
    <span
      className={[
        "inline-flex items-center gap-2 font-display tabular-nums",
        text,
        dimmed
          ? dark
            ? "text-white/40 line-through"
            : "text-muted-foreground line-through opacity-50"
          : dark
            ? "text-white"
            : "text-foreground",
      ].join(" ")}
    >
      {coins > 0 && (
        <span
          className={[
            "inline-flex items-center gap-0.5",
            dark ? "text-amber-200" : "text-accent-deep",
          ].join(" ")}
        >
          +{toLocaleDigits(coins, locale)}
          <ResourceIcon
            kind="coin"
            size="sm"
            className={size === "md" ? "h-5 w-5" : "h-4 w-4"}
          />
        </span>
      )}
      {xp > 0 && (
        <span
          className={[
            "inline-flex items-center gap-0.5",
            dark ? "text-sky-300" : "text-primary",
          ].join(" ")}
        >
          +{toLocaleDigits(xp, locale)}
          <ResourceIcon
            kind="xp"
            size="sm"
            className={size === "md" ? "h-5 w-5" : "h-4 w-4"}
          />
        </span>
      )}
    </span>
  );
}

export type MissionBoardData = EvaluateMissionsResult;

type MissionBoardProps = {
  initialBoard: MissionBoardData;
  variant?: "campaign" | "daily";
  density?: "comfortable" | "compact";
  onClaimed?: () => void;
  onDripClaimed?: (balances: { coins: number; xp: number }) => void;
};

/** Deep-link for a mission objective — shared with MissionDrawer footer. */
export function playHrefForObjective(type: MissionObjective): string {
  switch (type) {
    case "PLAY_DUEL":
    case "WIN_DUEL":
      return "/play/duel";
    case "PERFECT_PENALTY":
      return "/play/penalty";
    case "SCORE_GOALS":
    case "PLAY_MATCHES":
    case "WIN_MATCHES":
    case "PERFECT_COMBO":
      return "/play/penalty";
    default:
      return "/play";
  }
}

/**
 * LiveOps / daily mission board — 3 objectives + batch chest.
 * Compact density is tuned for MissionDrawer dark arena chrome.
 */
export function MissionBoard({
  initialBoard,
  variant = "campaign",
  density = "comfortable",
  onClaimed,
  onDripClaimed,
}: MissionBoardProps) {
  const { t, locale } = useTranslation();
  const [board, setBoard] = useState(initialBoard);
  const [pending, startTransition] = useTransition();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [bursts, setBursts] = useState<FlyingBurst[]>([]);
  const [celebrate, setCelebrate] = useState<{
    coins: number;
    xp: number;
    next: number | null;
  } | null>(null);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  if (!board.batchId || board.missions.length === 0) {
    return null;
  }

  const doneCount = board.missions.filter((m) => m.isCompleted).length;
  const isDaily = variant === "daily";
  const compact = density === "compact";
  const batchPct =
    board.missions.length > 0
      ? Math.round((doneCount / board.missions.length) * 100)
      : 0;

  function handleChestClaim() {
    if (!board.chestReady || pending || !board.batchId) return;
    startTransition(async () => {
      const res = await claimMyMissionChest(board.batchId ?? undefined);
      if (!res.ok) {
        toast.error(t("missions.errClaim"));
        return;
      }
      playSound("upgrade");
      haptic(HAPTIC.goal);
      setCelebrate({
        coins: res.coins,
        xp: res.xp,
        next: res.nextBatchIndex,
      });
      onDripClaimed?.(res.balances);
      const next = await getMyMissions();
      if (next.ok) setBoard(isDaily ? next.daily : next.board);
      onClaimed?.();
      window.setTimeout(() => setCelebrate(null), 2200);
    });
  }

  function handleDripClaim(
    missionId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (pending || claimingId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const burst = spawnFlyingCoinsToHeader(rect);
    if (burst) setBursts((b) => [...b, burst]);

    playSound("click");
    haptic(HAPTIC.tap);
    setClaimingId(missionId);

    startTransition(async () => {
      const res = await claimMyMissionReward(missionId);
      if (!res.ok) {
        setClaimingId(null);
        toast.error(t("missions.errClaimDrip"));
        return;
      }
      playSound("upgrade");
      haptic(HAPTIC.goal);

      setBoard((prev) => ({
        ...prev,
        missions: prev.missions.map((m) =>
          m.missionId === missionId ? { ...m, isClaimed: true } : m,
        ),
      }));

      window.setTimeout(() => {
        onDripClaimed?.(res.balances);
        playSound("goal");
        setClaimingId(null);
      }, FLYING_COINS_HIT_MS);

      onClaimed?.();
    });
  }

  if (compact) {
    return (
      <section className="relative space-y-3 overflow-hidden">
        <FlyingCoins
          bursts={bursts}
          onBurstDone={(id) => setBursts((b) => b.filter((x) => x.id !== id))}
        />

        {isDaily && <DailyResetCountdown dark />}

        <GamePanel
          tone={board.chestReady ? "amber" : "emerald"}
          className="p-3"
        >
          <div className="relative flex items-center gap-3">
            <ChestButton
              ready={board.chestReady}
              coins={board.chestCoins}
              xp={board.chestXp}
              done={doneCount}
              total={board.missions.length}
              pending={pending}
              celebrating={Boolean(celebrate)}
              compact
              dark
              showCountBadge={false}
              onClaim={handleChestClaim}
            />

            <div className="min-w-0 flex-1">
              {!isDaily && (
                <h2 className="mb-1 font-display text-sm font-black text-arena-fg">
                  {t("missions.title", {
                    n: toLocaleDigits(board.batchIndex ?? 1, locale),
                  })}
                </h2>
              )}

              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="font-display text-[11px] font-bold text-arena-muted">
                  {board.chestReady
                    ? t("missions.chestReadyBadge")
                    : t("missions.progress", {
                        done: toLocaleDigits(doneCount, locale),
                        total: toLocaleDigits(board.missions.length, locale),
                      })}
                </p>
                <RewardPills
                  coins={board.chestCoins}
                  xp={board.chestXp}
                  dark
                  size="md"
                />
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-black/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]">
                <motion.div
                  className={[
                    "h-full rounded-full",
                    board.chestReady || batchPct >= 100
                      ? "bg-linear-to-r from-amber-300 to-accent"
                      : "bg-linear-to-r from-emerald-400 to-emerald-600",
                  ].join(" ")}
                  initial={{ width: 0 }}
                  animate={{ width: `${batchPct}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                />
              </div>
            </div>
          </div>
        </GamePanel>

        <ul className="relative flex flex-col gap-2">
          {board.missions.map((m, i) => {
            const pct =
              m.targetValue > 0
                ? Math.min(100, Math.round((m.progress / m.targetValue) * 100))
                : 0;
            const title = locale === "fa" ? m.titleFa : m.titleEn;
            const href = playHrefForObjective(m.objectiveType);
            const claimable = m.isCompleted && !m.isClaimed;
            const claimed = m.isCompleted && m.isClaimed;
            const busy = claimingId === m.missionId;
            const tone = claimable
              ? "amber"
              : claimed
                ? "emerald"
                : "default";

            return (
              <motion.li
                key={m.missionId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GameTile
                  tone={tone}
                  className={[
                    "px-3 py-3",
                    claimed ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2.5">
                    <StatusGlyph
                      claimed={claimed}
                      claimable={claimable}
                      index={i}
                      locale={locale}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={[
                            "min-w-0 font-display text-[13px] font-bold leading-snug text-arena-fg",
                            claimed ? "line-through opacity-60" : "",
                          ].join(" ")}
                        >
                          {title}
                        </p>
                        {!claimable && !claimed && (
                          <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-arena-muted">
                            {toLocaleDigits(m.progress, locale)}/
                            {toLocaleDigits(m.targetValue, locale)}
                          </span>
                        )}
                        {claimable && (
                          <GameChip tone="amber" className="shrink-0">
                            {t("missions.readyToClaim")}
                          </GameChip>
                        )}
                        {claimed && (
                          <GameChip tone="emerald" className="shrink-0">
                            {t("missions.claimed")}
                          </GameChip>
                        )}
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                        <motion.div
                          className={[
                            "h-full rounded-full",
                            claimed
                              ? "bg-emerald-500/55"
                              : claimable
                                ? "bg-linear-to-r from-amber-300 to-accent"
                                : "bg-linear-to-r from-emerald-400 to-emerald-600",
                          ].join(" ")}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${claimed || claimable ? 100 : pct}%`,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 24,
                          }}
                        />
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <RewardPills
                          coins={m.rewardCoins}
                          xp={m.rewardXp}
                          dimmed={claimed}
                          dark
                          size="md"
                        />

                        {!m.isCompleted && (
                          <Link
                            href={href}
                            className="inline-flex min-h-11 min-w-16 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-arena-success px-3.5 font-display text-xs font-black text-white shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.35),0_3px_0_0_rgba(0,0,0,0.35)] transition-transform active:translate-y-px active:scale-[0.98]"
                          >
                            <PngIcon
                              src="/icons/target.png"
                              className="h-4 w-4"
                            />
                            {t("missions.goPlay")}
                          </Link>
                        )}

                        {claimable && (
                          <motion.button
                            type="button"
                            disabled={busy || pending}
                            onClick={(e) => handleDripClaim(m.missionId, e)}
                            aria-label={
                              busy
                                ? t("missions.claiming")
                                : t("missions.claimDrip")
                            }
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.25,
                              ease: "easeInOut",
                            }}
                            whileTap={{ scale: 0.96 }}
                            className="inline-flex min-h-11 min-w-20 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 font-display text-xs font-black text-accent-foreground shadow-[0_0_0_1px_hsl(var(--arena-ring-amber)/0.5),0_3px_0_0_rgba(0,0,0,0.35)] disabled:opacity-60"
                          >
                            {busy ? (
                              t("missions.claiming")
                            ) : (
                              <>
                                <PngIcon
                                  src="/icons/claim.png"
                                  className="h-5 w-5"
                                />
                                {t("missions.claimDrip")}
                              </>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </GameTile>
              </motion.li>
            );
          })}
        </ul>

        <CelebrateOverlay celebrate={celebrate} dark />
      </section>
    );
  }

  /* —— comfortable (profile / light surfaces) —— */
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        "relative overflow-hidden rounded-bubble-xl bg-surface p-4 shadow-fantasy",
        isDaily
          ? "shadow-[0_0_0_1px_hsl(var(--secondary)/0.4),0_4px_0_0_rgba(0,0,0,0.08)]"
          : "shadow-[0_0_0_1px_hsl(var(--border)),0_4px_0_0_rgba(0,0,0,0.08)]",
        board.chestReady ? "ring-2 ring-accent/55" : "",
      ].join(" ")}
    >
      <FlyingCoins
        bursts={bursts}
        onBurstDone={(id) => setBursts((b) => b.filter((x) => x.id !== id))}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: isDaily
            ? "radial-gradient(ellipse at 15% 0%, hsl(var(--secondary) / 0.2), transparent 50%)"
            : "radial-gradient(ellipse at 85% 0%, hsl(var(--accent) / 0.18), transparent 50%)",
        }}
      />

      <header className="relative mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider",
                isDaily
                  ? "bg-secondary/15 text-secondary"
                  : "bg-primary/15 text-primary",
              ].join(" ")}
            >
              {isDaily ? t("missions.dailyEyebrow") : t("missions.eyebrow")}
            </span>
            {board.chestReady && (
              <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 font-display text-[10px] font-bold text-accent-deep">
                {t("missions.chestReadyBadge")}
              </span>
            )}
          </div>
          <h2 className="mt-1 font-display text-lg font-black text-foreground">
            {isDaily
              ? t("missions.dailyTitle")
              : t("missions.title", {
                  n: toLocaleDigits(board.batchIndex ?? 1, locale),
                })}
          </h2>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={[
                  "h-full rounded-full",
                  board.chestReady || batchPct >= 100
                    ? "bg-accent"
                    : "bg-secondary",
                ].join(" ")}
                initial={{ width: 0 }}
                animate={{ width: `${batchPct}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
              />
            </div>
            <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-muted-foreground">
              {toLocaleDigits(doneCount, locale)}/
              {toLocaleDigits(board.missions.length, locale)}
            </span>
          </div>
        </div>

        <ChestButton
          ready={board.chestReady}
          coins={board.chestCoins}
          xp={board.chestXp}
          done={doneCount}
          total={board.missions.length}
          pending={pending}
          celebrating={Boolean(celebrate)}
          compact={false}
          dark={false}
          onClaim={handleChestClaim}
        />
      </header>

      <ul className="relative flex flex-col gap-2.5">
        {board.missions.map((m, i) => {
          const pct =
            m.targetValue > 0
              ? Math.min(100, Math.round((m.progress / m.targetValue) * 100))
              : 0;
          const title = locale === "fa" ? m.titleFa : m.titleEn;
          const href = playHrefForObjective(m.objectiveType);
          const claimable = m.isCompleted && !m.isClaimed;
          const claimed = m.isCompleted && m.isClaimed;
          const busy = claimingId === m.missionId;

          return (
            <motion.li
              key={m.missionId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={[
                "rounded-bubble-lg px-3 py-2.5",
                claimable
                  ? "border border-accent/55 bg-accent/12 ring-1 ring-accent/30"
                  : claimed
                    ? "border border-border/60 bg-muted/40 opacity-80"
                    : "border border-foreground/8 bg-background/90 shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <StatusGlyph
                  claimed={claimed}
                  claimable={claimable}
                  index={i}
                  locale={locale}
                  light
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={[
                        "min-w-0 font-display text-sm font-bold leading-snug text-surface-foreground",
                        claimed ? "line-through opacity-55" : "",
                      ].join(" ")}
                    >
                      {title}
                    </p>
                    {!claimable && !claimed && (
                      <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-muted-foreground">
                        {toLocaleDigits(m.progress, locale)}/
                        {toLocaleDigits(m.targetValue, locale)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={[
                        "h-full rounded-full",
                        claimed
                          ? "bg-muted-foreground/35"
                          : claimable
                            ? "bg-accent"
                            : "bg-secondary",
                      ].join(" ")}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${claimed || claimable ? 100 : pct}%`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 220,
                        damping: 24,
                      }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <RewardPills
                      coins={m.rewardCoins}
                      xp={m.rewardXp}
                      dimmed={claimed}
                    />

                    {!m.isCompleted && (
                      <Link
                        href={href}
                        className="ms-auto inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3 font-display text-[11px] font-black text-muted-foreground transition-transform active:scale-95 active:bg-muted"
                      >
                        {t("missions.goPlay")}
                      </Link>
                    )}

                    {claimable && (
                      <motion.button
                        type="button"
                        disabled={busy || pending}
                        onClick={(e) => handleDripClaim(m.missionId, e)}
                        aria-label={
                          busy
                            ? t("missions.claiming")
                            : t("missions.claimDrip")
                        }
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          ease: "easeInOut",
                        }}
                        whileTap={{ scale: 0.94 }}
                        className="ms-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/25 shadow-[0_0_16px_hsl(var(--accent)/0.4)] ring-2 ring-accent/50 disabled:opacity-60"
                      >
                        {busy ? (
                          <span className="font-display text-xs font-black text-accent-deep">
                            …
                          </span>
                        ) : (
                          <PngIcon src="/icons/claim.png" className="h-8 w-8" />
                        )}
                      </motion.button>
                    )}

                    {claimed && (
                      <span
                        className="ms-auto inline-flex h-9 w-9 items-center justify-center"
                        aria-label={t("missions.claimed")}
                      >
                        <PngIcon src="/icons/done.png" className="h-7 w-7" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <CelebrateOverlay celebrate={celebrate} dark={false} />
    </motion.section>
  );
}

function StatusGlyph({
  claimed,
  claimable,
  index,
  locale,
  light,
}: {
  claimed: boolean;
  claimable: boolean;
  index: number;
  locale: Locale;
  light?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black",
        claimed
          ? light
            ? "bg-secondary/15"
            : "bg-emerald-500/20 shadow-[inset_0_0_0_1px_hsl(var(--arena-ring)/0.35)]"
          : claimable
            ? light
              ? "bg-accent/20"
              : "bg-accent/25 shadow-[inset_0_0_0_1px_hsl(var(--arena-ring-amber)/0.45)]"
            : light
              ? "bg-secondary/15 text-secondary"
              : "bg-black/35 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
      ].join(" ")}
    >
      {claimed ? (
        <PngIcon src="/icons/done.png" className="h-6 w-6" />
      ) : claimable ? (
        <PngIcon src="/icons/gift.png" className="h-6 w-6" />
      ) : (
        toLocaleDigits(index + 1, locale)
      )}
    </span>
  );
}

function CelebrateOverlay({
  celebrate,
  dark,
}: {
  celebrate: { coins: number; xp: number; next: number | null } | null;
  dark: boolean;
}) {
  const { t, locale } = useTranslation();
  return (
    <AnimatePresence>
      {celebrate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={[
            "absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center backdrop-blur-sm",
            dark ? "bg-[#071510]/92" : "bg-surface/92",
          ].join(" ")}
        >
          <motion.span
            initial={{ scale: 0.45, rotate: -16 }}
            animate={{ scale: 1.1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 14 }}
            aria-hidden
          >
            <PngIcon src="/icons/gift.png" className="h-16 w-16" />
          </motion.span>
          <div className="mt-2 flex flex-col items-center gap-1.5">
            <p
              className={[
                "font-display text-lg font-black",
                dark ? "text-white" : "text-foreground",
              ].join(" ")}
            >
              {t("missions.chestClaimed", {
                coins: toLocaleDigits(celebrate.coins, locale),
                xp: toLocaleDigits(celebrate.xp, locale),
              })}
            </p>
            <RewardPills
              coins={celebrate.coins}
              xp={celebrate.xp}
              dark={dark}
              size="md"
            />
          </div>
          {celebrate.next != null && (
            <p
              className={[
                "mt-1 font-display text-sm font-bold",
                dark ? "text-emerald-300" : "text-secondary",
              ].join(" ")}
            >
              {t("missions.nextBatch", {
                n: toLocaleDigits(celebrate.next, locale),
              })}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DailyResetCountdown({ dark }: { dark?: boolean }) {
  const { t, locale } = useTranslation();
  const [ms, setMs] = useState(() => msUntilTehranMidnight());

  useEffect(() => {
    const id = window.setInterval(() => {
      setMs(msUntilTehranMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const { h, m, s } = formatCountdownHms(ms);
  const pad = (n: number) =>
    toLocaleDigits(n.toString().padStart(2, "0"), locale);
  const time =
    h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  return (
    <p
      className={[
        "flex items-center justify-center gap-1.5 font-display text-[11px] font-black tabular-nums",
        dark ? "text-arena-muted" : "text-muted-foreground",
      ].join(" ")}
    >
      <PngIcon src="/icons/timer.png" className="h-3.5 w-3.5 opacity-80" />
      {t("missions.dailyResetIn", { time })}
    </p>
  );
}

function ChestButton({
  ready,
  coins,
  xp,
  done,
  total,
  pending,
  celebrating,
  compact,
  dark,
  showCountBadge = true,
  onClaim,
}: {
  ready: boolean;
  coins: number;
  xp: number;
  done: number;
  total: number;
  pending: boolean;
  celebrating: boolean;
  compact: boolean;
  dark?: boolean;
  showCountBadge?: boolean;
  onClaim: () => void;
}) {
  const { t, locale } = useTranslation();

  return (
    <div className="relative flex shrink-0 flex-col items-center">
      <motion.button
        type="button"
        disabled={!ready || pending || celebrating}
        onClick={onClaim}
        whileTap={ready ? { scale: 0.92 } : undefined}
        animate={
          ready && !celebrating
            ? {
                y: [0, -4, 0],
                rotate: [0, -3, 3, 0],
                scale: [1, 1.05, 1],
              }
            : { y: 0, rotate: 0, scale: 1 }
        }
        transition={
          ready && !celebrating
            ? { repeat: Infinity, duration: 1.15 }
            : { duration: 0.2 }
        }
        className={[
          "relative flex items-center justify-center",
          compact ? "h-14 w-14 rounded-2xl" : "h-16 w-16 rounded-bubble-lg",
          dark
            ? ready
              ? "bg-accent/25 shadow-[0_0_0_1px_rgba(252,211,77,0.5),0_3px_0_0_rgba(0,0,0,0.35)]"
              : "bg-black/45 shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_3px_0_0_rgba(0,0,0,0.4)]"
            : ready
              ? "bg-accent/30 shadow-[0_0_28px_hsl(var(--accent)/0.55)] ring-2 ring-accent/40"
              : "bg-muted/50 shadow-[0_0_0_1px_hsl(var(--border)),0_3px_0_0_rgba(0,0,0,0.12)]",
        ].join(" ")}
        aria-label={t("missions.claimChest")}
      >
        <PngIcon
          src="/icons/gift.png"
          className={[
            compact ? "h-10 w-10" : "h-12 w-12",
            ready ? "" : "opacity-45 grayscale",
          ].join(" ")}
        />
        {!ready && showCountBadge && (
          <span
            aria-hidden
            className={[
              "absolute -inset-e-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-display text-[9px] font-black tabular-nums",
              dark
                ? "border border-white/20 bg-black/80 text-white/80"
                : "bg-foreground text-background",
            ].join(" ")}
          >
            {toLocaleDigits(done, locale)}/{toLocaleDigits(total, locale)}
          </span>
        )}
      </motion.button>
      {ready ? (
        <p
          className={[
            "mt-1 text-center font-display text-[10px] font-bold leading-tight",
            dark ? "text-amber-200" : "text-accent-deep",
          ].join(" ")}
        >
          {t("missions.tapClaim")}
        </p>
      ) : !compact ? (
        <>
          <p className="mt-1 max-w-20 text-center font-display text-[10px] font-bold leading-tight text-muted-foreground">
            {t("missions.chestLocked", {
              done: toLocaleDigits(done, locale),
              total: toLocaleDigits(total, locale),
            })}
          </p>
          <div className="mt-0.5">
            <RewardPills coins={coins} xp={xp} dimmed />
          </div>
        </>
      ) : null}
    </div>
  );
}
