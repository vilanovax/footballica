"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AvatarImage } from "@/components/common/AvatarImage";
import {
  refreshLeaderboard,
  type LeaderboardRow,
} from "@/actions/getLeaderboard";
import { LEADERBOARD_TOP_N } from "@/lib/leaderboard/cacheTags";
import { estimateWinsToCloseGap } from "@/lib/leaderboard/chaseEstimate";
import {
  getHallOfFame,
  type HallOfFameWeek,
} from "@/actions/getHallOfFame";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatNumber, toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { LeaderboardPodium } from "./LeaderboardPodium";
import { HallOfFamePanel } from "./HallOfFamePanel";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  WEEKLY_PRIZE_TIERS,
  weeklyChampionCoins,
} from "@/lib/game/weeklyPrizes";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { RankArt, medalKindForPlace } from "@/components/leaderboard/RankArt";
import { shortClubName } from "@/lib/leaderboard/displayName";
import { GameChip } from "@/components/ui/game/GameChip";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { RouteLoading } from "@/components/ui/RouteLoading";
import { cn } from "@/lib/utils";

type LeaderboardListProps = {
  rows: LeaderboardRow[];
  resetsInDays?: number;
  currentUserRow?: LeaderboardRow | null;
};

type TabKey = "weekly" | "hof";

type ChaseState =
  | { kind: "lead" }
  | {
      kind: "hunt";
      gap: number;
      targetRank: number;
      /** 0–1 progress toward overtaking the rank above. */
      progress: number;
      /** Hot chase — within ~8% of the target XP. */
      close: boolean;
      /** Approx duel wins to close the gap (null = unknown). */
      winsEstimate: number | null;
    }
  | {
      kind: "outside";
      gap: number;
      /** Gatekeeper rank at the bottom of the visible table. */
      gateRank: number;
      tableSize: number;
      progress: number;
      close: boolean;
      winsEstimate: number | null;
    }
  | { kind: "unranked" };

/** Only animate the first N rows — rest paint instantly to cut hydration TBT. */
const ANIMATED_ROW_CAP = 6;

/** Approximate row height for content-visibility intrinsic size (avoids scroll jump). */
const ROW_INTRINSIC = "auto 3.25rem";

/** Sit snug above BottomNav (nav chrome ~5.25rem + safe area). */
const STICKY_BOTTOM =
  "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.03 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 360, damping: 28 },
  },
} as const;

function tierForRank(rank: number): "elite" | "contender" | "pack" | "climbing" {
  if (rank <= 3) return "elite";
  if (rank <= 10) return "contender";
  if (rank <= 25) return "pack";
  return "climbing";
}

export function LeaderboardList({
  rows: initialRows,
  resetsInDays: initialResetsInDays = 7,
  currentUserRow: initialCurrentUserRow = null,
}: LeaderboardListProps) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<TabKey>("weekly");
  const [prizesOpen, setPrizesOpen] = useState(false);
  const [inspectRow, setInspectRow] = useState<LeaderboardRow | null>(null);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameWeek[] | null>(null);
  const [hofLoading, setHofLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState(initialRows);
  const [resetsInDays, setResetsInDays] = useState(initialResetsInDays);
  const [currentUserRow, setCurrentUserRow] = useState(initialCurrentUserRow);

  // Keep local board in sync when the RSC payload refreshes (nav / soft nav).
  useEffect(() => {
    setRows(initialRows);
    setResetsInDays(initialResetsInDays);
    setCurrentUserRow(initialCurrentUserRow);
  }, [initialRows, initialResetsInDays, initialCurrentUserRow]);

  const { showPodium, podiumRows, listRows } = useMemo(() => {
    const scored = rows.filter((r) => r.playState === "scored");
    const podium = scored.length >= 3 ? scored.slice(0, 3) : [];
    const podiumIds = new Set(podium.map((p) => p.userId));
    const rest = podium.length
      ? rows.filter((r) => !podiumIds.has(r.userId))
      : rows;
    return {
      showPodium: podium.length > 0,
      podiumRows: podium,
      // Keep table strictly ordered by rank — never splice sticky into the middle.
      listRows: [...rest].sort((a, b) => a.rank - b.rank),
    };
  }, [rows]);

  const sticky = currentUserRow;
  const youInRows = Boolean(
    sticky && rows.some((r) => r.userId === sticky.userId),
  );
  const outsideTable = Boolean(sticky && !youInRows);
  const youInList = Boolean(
    sticky && listRows.some((r) => r.userId === sticky.userId),
  );
  const youOnPodium = Boolean(
    sticky && podiumRows.some((r) => r.userId === sticky.userId),
  );
  const [youAnchor, setYouAnchor] = useState<HTMLElement | null>(null);
  const [youInView, setYouInView] = useState(true);
  const stickyId = sticky?.userId ?? null;

  const chase = useMemo((): ChaseState | null => {
    if (!sticky) return null;
    if (sticky.rank <= 0 || sticky.weeklyXp <= 0 || sticky.playState === "unplayed") {
      return { kind: "unranked" };
    }
    if (sticky.rank === 1 && youInRows) {
      return { kind: "lead" };
    }

    // Outside the visible Top-N window — hunt the gatekeeper at the foot of the table.
    if (outsideTable) {
      const gate =
        rows.length > 0
          ? rows.reduce((worst, row) =>
              row.rank >= worst.rank ? row : worst,
            )
          : null;
      if (!gate) {
        // Empty board — any XP already puts you on it after refresh; nudge to play.
        return { kind: "unranked" };
      }
      const gap = Math.max(0, gate.weeklyXp - sticky.weeklyXp + 1);
      const denom = gate.weeklyXp + 1;
      const progress =
        denom <= 0 ? 0 : Math.min(0.98, sticky.weeklyXp / denom);
      const close = gap > 0 && gap / Math.max(gate.weeklyXp, 1) <= 0.08;
      const winsEstimate = estimateWinsToCloseGap(gap, {
        weeklyXp: sticky.weeklyXp,
        matchesPlayed: sticky.matchesPlayed,
      });
      return {
        kind: "outside",
        gap,
        gateRank: gate.rank,
        tableSize: Math.min(LEADERBOARD_TOP_N, Math.max(gate.rank, rows.length)),
        progress,
        close,
        winsEstimate,
      };
    }

    const above = rows.find((r) => r.rank === sticky.rank - 1);
    if (!above) {
      if (sticky.rank === 1) return { kind: "lead" };
      return null;
    }
    const gap = Math.max(0, above.weeklyXp - sticky.weeklyXp + 1);
    const denom = above.weeklyXp + 1;
    const progress =
      denom <= 0 ? 0 : Math.min(0.98, sticky.weeklyXp / denom);
    const close = gap > 0 && gap / Math.max(above.weeklyXp, 1) <= 0.08;
    const winsEstimate = estimateWinsToCloseGap(gap, {
      weeklyXp: sticky.weeklyXp,
      matchesPlayed: sticky.matchesPlayed,
    });
    return {
      kind: "hunt",
      gap,
      targetRank: above.rank,
      progress,
      close,
      winsEstimate,
    };
  }, [sticky, rows, outsideTable, youInRows]);

  useEffect(() => {
    if (tab !== "weekly" || !stickyId || !youAnchor) {
      // Reset sticky chrome when the YOU row is unmounted / tab changes.
      // Outside the table with no hunt anchor yet → keep dock visible.
      const id = window.requestAnimationFrame(() => {
        setYouInView(!(outsideTable && !youAnchor));
      });
      return () => window.cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => setYouInView(entry.isIntersecting),
      {
        root: null,
        // Account for sticky header (~72) + bottom nav (~88) — not mid-viewport.
        rootMargin: "-72px 0px -96px 0px",
        threshold: 0,
      },
    );
    io.observe(youAnchor);
    return () => io.disconnect();
  }, [tab, stickyId, youAnchor, outsideTable]);

  // Dock when your row / hunt card scrolls off-screen.
  const showStickyYou = tab === "weekly" && Boolean(sticky) && !youInView;

  const jumpToYou = useCallback(() => {
    if (!youAnchor) return;
    haptic(HAPTIC.tap);
    playSound("click");
    youAnchor.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [youAnchor, reduceMotion]);

  async function onRefreshBoard() {
    if (refreshing) return;
    haptic(HAPTIC.tap);
    playSound("click");
    setRefreshing(true);
    try {
      const next = await refreshLeaderboard();
      setRows(next.rows);
      setResetsInDays(next.resetsInDays);
      setCurrentUserRow(next.currentUserRow);
      // Force HoF to reload next time the tab opens (archives may have shifted).
      setHallOfFame(null);
      // Keep inspect open only if that club is still on the board / sticky.
      setInspectRow((prev) => {
        if (!prev) return null;
        const still =
          next.rows.find((r) => r.userId === prev.userId) ??
          (next.currentUserRow?.userId === prev.userId
            ? next.currentUserRow
            : null);
        return still ?? null;
      });
    } catch (err) {
      console.error("refreshLeaderboard", err);
    } finally {
      setRefreshing(false);
    }
  }

  function openInspect(row: LeaderboardRow) {
    haptic(HAPTIC.tap);
    playSound("click");
    setPrizesOpen(false);
    setInspectRow(row);
  }

  function selectTab(next: TabKey) {
    if (next === tab) return;
    haptic(HAPTIC.light);
    setTab(next);
    if (next === "hof" && hallOfFame === null && !hofLoading) {
      setHofLoading(true);
      void getHallOfFame()
        .then(setHallOfFame)
        .catch((err) => {
          console.error("getHallOfFame", err);
          setHallOfFame([]);
        })
        .finally(() => setHofLoading(false));
    }
  }

  const resetUrgent = resetsInDays <= 1;

  return (
    <section className="relative flex flex-1 flex-col">
      <header className="sticky top-0 z-20 -mx-1 bg-background/85 pb-2 pt-1.5 backdrop-blur-md">
        <GamePanel tone="emerald" className="p-2.5">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-e-8 top-0 h-24 w-24 rounded-full bg-emerald-300/25 blur-2xl"
          />

          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-[11px] font-black text-emerald-200/85">
                {t("leaderboard.eyebrow")}
              </p>
              <h1 className="mt-0.5 font-display text-xl font-black text-white drop-shadow-sm">
                {tab === "weekly"
                  ? t("leaderboard.title")
                  : t("leaderboard.hofTitle")}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => void onRefreshBoard()}
                disabled={refreshing}
                aria-busy={refreshing}
                aria-label={t("leaderboard.refresh")}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/35 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_2px_0_0_rgba(0,0,0,0.35)] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring disabled:opacity-60",
                )}
              >
                <RefreshGlyph spinning={refreshing && !reduceMotion} />
              </button>
              {tab === "weekly" && (
                <GameChip
                  tone="amber"
                  className={cn(
                    "shrink-0 gap-1 px-2.5 py-1.5 text-[11px]",
                    resetUrgent &&
                      "ring-1 ring-rose-400/70 motion-safe:animate-[pulse_1.8s_ease-in-out_infinite]",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/timer.png"
                    alt=""
                    aria-hidden
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 object-contain"
                  />
                  {t("leaderboard.resetsIn", {
                    n: toLocaleDigits(resetsInDays, locale),
                  })}
                </GameChip>
              )}
            </div>
          </div>

          <div
            role="tablist"
            aria-label={t("leaderboard.eyebrow")}
            className="relative mt-2.5 grid grid-cols-2 gap-1.5 rounded-2xl bg-black/30 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          >
            {(
              [
                { key: "weekly" as const, label: t("leaderboard.tabWeekly") },
                { key: "hof" as const, label: t("leaderboard.tabHof") },
              ] as const
            ).map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(item.key)}
                  className={[
                    "relative z-10 flex min-h-touch items-center justify-center gap-1.5 rounded-xl px-2 font-display text-sm font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring",
                    active ? "text-emerald-950" : "text-white/70",
                  ].join(" ")}
                >
                  {active && (
                    <motion.span
                      layoutId="leaderboard-tab-pill"
                      className="absolute inset-0 rounded-xl bg-accent shadow-[0_3px_0_0_rgba(0,0,0,0.3)]"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 420,
                              damping: 32,
                            }
                      }
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </GamePanel>
      </header>

      {tab === "hof" ? (
        hallOfFame === null ? (
          <RouteLoading label={t("leaderboard.hofTitle")} />
        ) : (
          <HallOfFamePanel weeks={hallOfFame} />
        )
      ) : (
        <>
          {sticky && (
            <div ref={outsideTable ? setYouAnchor : undefined}>
              <YourHuntCard
                you={sticky}
                chase={chase}
                onPrizes={() => {
                  haptic(HAPTIC.tap);
                  playSound("click");
                  setPrizesOpen(true);
                }}
              />
            </div>
          )}

          {!sticky && (
            <button
              type="button"
              onClick={() => {
                haptic(HAPTIC.tap);
                playSound("click");
                setPrizesOpen(true);
              }}
              className="mb-3 w-full text-start transition-transform active:scale-[0.99]"
            >
              <GamePanel
                tone="amber"
                className="flex w-full items-center justify-between gap-2 px-3 py-3"
              >
                <span className="relative inline-flex items-center gap-1.5 font-display text-xs font-black text-amber-50">
                  <RankArt kind="trophy" size="sm" className="h-5 w-5" />
                  {t("leaderboard.prizeBanner", {
                    n: toLocaleDigits(weeklyChampionCoins(), locale),
                  })}
                </span>
                <span className="relative rounded-bubble bg-accent px-2.5 py-1 font-display text-[10px] font-black text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                  {t("leaderboard.prizeTap")}
                </span>
              </GamePanel>
            </button>
          )}

          <div className="relative mb-1 overflow-hidden rounded-bubble-xl bg-linear-to-b from-arena-deep/40 via-transparent to-transparent p-0.5">
            {showPodium && (
              <div ref={youOnPodium ? setYouAnchor : undefined}>
                <LeaderboardPodium rows={podiumRows} onInspect={openInspect} />
              </div>
            )}

            <div className="mb-1 flex items-end justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="font-display text-xs font-black text-emerald-800/80">
                  {t("leaderboard.tableTitle")}
                </p>
                <p className="mt-0.5 font-display text-[10px] font-bold text-emerald-800/50">
                  {t("leaderboard.tableTieHint")}
                </p>
              </div>
              <p className="shrink-0 font-display text-[10px] font-black text-emerald-800/55">
                {t("leaderboard.xpShort")}
              </p>
            </div>

            <motion.ol
              variants={reduceMotion ? undefined : containerVariants}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "visible"}
              className={cn(
                "flex flex-col gap-1.5",
                // AppShell already clears BottomNav — only pad when the docked YOU chip overlays the list.
                showStickyYou ? "pb-20" : "pb-1",
              )}
            >
              {listRows.map((row, index) => {
                const isYou = sticky?.userId === row.userId;
                return (
                  <li
                    key={row.userId}
                    className="list-none"
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: ROW_INTRINSIC,
                    }}
                    ref={isYou && youInList ? setYouAnchor : undefined}
                  >
                    <LeaderboardRowItem
                      row={row}
                      animate={!reduceMotion && index < ANIMATED_ROW_CAP}
                      priorityAvatar={index < 2 || isYou}
                      onInspect={() => openInspect(row)}
                    />
                  </li>
                );
              })}
            </motion.ol>
          </div>
        </>
      )}

      {showStickyYou && sticky && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-mobile px-3",
            STICKY_BOTTOM,
          )}
        >
          <button
            type="button"
            onClick={jumpToYou}
            aria-label={
              outsideTable
                ? t("leaderboard.jumpToHunt")
                : t("leaderboard.jumpToYou")
            }
            className="pointer-events-auto w-full text-start transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
          >
            <div
              aria-hidden
              className="ring-2 ring-arena-amber shadow-[0_0_20px_rgba(251,191,36,0.35)]"
            >
              <LeaderboardRowItem row={sticky} sticky />
            </div>
            <span className="mt-1 flex items-center justify-center gap-1 font-display text-[10px] font-black text-amber-200/90">
              <RankArt kind="trophy" size="sm" className="h-3 w-3" />
              {outsideTable
                ? t("leaderboard.jumpToHunt")
                : t("leaderboard.jumpToYou")}
            </span>
          </button>
        </div>
      )}

      <BottomSheet
        open={inspectRow !== null}
        onClose={() => setInspectRow(null)}
        title={inspectRow?.clubName ?? ""}
        subtitle={
          inspectRow
            ? inspectRow.rank > 0
              ? t("leaderboard.rankLabel", {
                  n: toLocaleDigits(inspectRow.rank, locale),
                })
              : t("leaderboard.unranked")
            : undefined
        }
        closeLabel={t("common.close")}
        tone="dark"
        layer="overlay"
      >
        {inspectRow && <ClubInspectBody row={inspectRow} />}
      </BottomSheet>

      <BottomSheet
        open={prizesOpen}
        onClose={() => setPrizesOpen(false)}
        title={t("leaderboard.prizeSheetTitle")}
        subtitle={t("leaderboard.prizeSheetSub")}
        closeLabel={t("common.close")}
        tone="dark"
      >
        <ul className="flex flex-col gap-2">
          {WEEKLY_PRIZE_TIERS.map((tier) => (
            <li
              key={tier.place}
              className="flex items-center justify-between gap-3 rounded-2xl bg-black/30 px-3 py-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_3px_0_0_rgba(0,0,0,0.3)]"
            >
              <span className="inline-flex items-center gap-2 font-display text-sm font-black text-white">
                <RankArt
                  kind={medalKindForPlace(tier.place)}
                  size="md"
                  className="h-6 w-6"
                />
                {t("leaderboard.prizePlace", {
                  n: toLocaleDigits(tier.place, locale),
                })}
              </span>
              <span className="flex flex-col items-end gap-0.5 font-display text-xs font-black text-white/70">
                <span className="inline-flex items-center gap-1">
                  <ResourceIcon kind="coin" size="sm" />
                  {toLocaleDigits(tier.coins, locale)}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <ResourceIcon kind="xp" size="sm" className="h-3.5 w-3.5" />
                  {toLocaleDigits(tier.xp, locale)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-display text-xs font-bold text-white/50">
          {t("leaderboard.prizeSheetHint")}
        </p>
      </BottomSheet>
    </section>
  );
}

function YourHuntCard({
  you,
  chase,
  onPrizes,
}: {
  you: LeaderboardRow;
  chase: ChaseState | null;
  onPrizes: () => void;
}) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const outside = chase?.kind === "outside";
  const unranked = chase?.kind === "unranked";
  const tier = you.rank > 0 ? tierForRank(you.rank) : "climbing";
  const tierLabel = outside
    ? t("leaderboard.tierOutside")
    : unranked
      ? t("leaderboard.tierClimbing")
      : tier === "elite"
        ? t("leaderboard.tierElite")
        : tier === "contender"
          ? t("leaderboard.tierContender")
          : tier === "pack"
            ? t("leaderboard.tierPack")
            : t("leaderboard.tierClimbing");
  const tierTone = outside
    ? "bg-sky-400/20 text-sky-100 ring-sky-300/40"
    : tier === "elite"
      ? "bg-amber-400/30 text-amber-100 ring-amber-300/50"
      : tier === "contender"
        ? "bg-emerald-400/25 text-emerald-100 ring-emerald-300/45"
        : "bg-white/10 text-white/80 ring-white/20";

  const chaseLine =
    chase?.kind === "lead"
      ? t("leaderboard.gapLead")
      : chase?.kind === "hunt"
        ? t("leaderboard.gapNext", {
            n: toLocaleDigits(chase.gap, locale),
            rank: toLocaleDigits(chase.targetRank, locale),
          })
        : chase?.kind === "outside"
          ? t("leaderboard.gapOutside", {
              n: toLocaleDigits(chase.gap, locale),
              top: toLocaleDigits(chase.tableSize, locale),
            })
          : chase?.kind === "unranked"
            ? t("leaderboard.playToEnter")
            : t("leaderboard.rowMatches", {
                n: toLocaleDigits(you.matchesPlayed, locale),
              });

  const winsHint =
    (chase?.kind === "hunt" || chase?.kind === "outside") &&
    chase.winsEstimate != null &&
    chase.winsEstimate > 0
      ? chase.winsEstimate === 1
        ? t("leaderboard.gapOneWin")
        : t("leaderboard.gapWinsApprox", {
            n: toLocaleDigits(chase.winsEstimate, locale),
          })
      : null;

  const barPct =
    chase?.kind === "lead"
      ? 100
      : chase?.kind === "hunt" || chase?.kind === "outside"
        ? Math.round(chase.progress * 100)
        : 0;
  const barHot =
    (chase?.kind === "hunt" || chase?.kind === "outside") && chase.close;
  const showBar =
    chase?.kind === "lead" ||
    chase?.kind === "hunt" ||
    chase?.kind === "outside";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2.5"
    >
      <GamePanel tone={outside ? "sky" : "emerald"} className="p-2.5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-e-8 top-0 h-24 w-24 rounded-full bg-emerald-300/30 blur-2xl"
        />

        <div className="relative flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-black text-emerald-200/85">
              {outside
                ? t("leaderboard.outsideHunt")
                : t("leaderboard.yourHunt")}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="font-display text-base font-black text-white drop-shadow-sm">
                {you.rank > 0
                  ? t("leaderboard.rankLabel", {
                      n: toLocaleDigits(you.rank, locale),
                    })
                  : t("leaderboard.unranked")}
              </span>
              <span
                className={[
                  "rounded-full px-2 py-0.5 font-display text-[10px] font-black ring-1",
                  tierTone,
                ].join(" ")}
              >
                {tierLabel}
              </span>
            </div>
            <p className="mt-1 font-display text-[11px] font-bold text-white/65">
              {chaseLine}
            </p>
            {winsHint && (
              <p
                className={cn(
                  "mt-0.5 font-display text-[11px] font-black",
                  barHot ? "text-accent" : "text-emerald-200/90",
                )}
              >
                {winsHint}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-black/30 px-2.5 py-1.5 font-display text-lg font-black tabular-nums text-emerald-200">
              <ResourceIcon kind="xp" size="sm" />
              {formatNumber(you.weeklyXp, locale)}
            </p>
            <button
              type="button"
              onClick={onPrizes}
              className="game-cta game-cta-accent inline-flex min-h-9 items-center gap-1 px-2.5 py-1.5 font-display text-[11px] font-black"
            >
              <RankArt kind="trophy" size="sm" className="h-3.5 w-3.5" />
              {t("leaderboard.prizeTap")}
            </button>
          </div>
        </div>

        {showBar && chase && (
          <div className="relative mt-2.5">
            <div
              className="h-2 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
              role="progressbar"
              aria-valuenow={barPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={chaseLine}
            >
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  chase.kind === "lead"
                    ? "bg-linear-to-r from-amber-300 to-amber-500"
                    : chase.kind === "outside"
                      ? barHot
                        ? "bg-linear-to-r from-sky-300 to-accent"
                        : "bg-linear-to-r from-sky-400 to-sky-300"
                      : barHot
                        ? "bg-linear-to-r from-accent to-amber-300"
                        : "bg-linear-to-r from-emerald-400 to-emerald-300",
                  barHot &&
                    !reduceMotion &&
                    "motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]",
                )}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 120, damping: 22 }
                }
              />
            </div>
          </div>
        )}
      </GamePanel>
    </motion.div>
  );
}

function ClubInspectBody({ row }: { row: LeaderboardRow }) {
  const { t, locale } = useTranslation();
  const unplayed = row.playState === "unplayed";
  const tier = row.rank > 0 ? tierForRank(row.rank) : "climbing";
  const tierLabel =
    tier === "elite"
      ? t("leaderboard.tierElite")
      : tier === "contender"
        ? t("leaderboard.tierContender")
        : tier === "pack"
          ? t("leaderboard.tierPack")
          : t("leaderboard.tierClimbing");

  return (
    <div className="flex flex-col items-center gap-4 pb-1 pt-1">
      <div className="relative">
        <AvatarImage
          avatarKey={row.avatarKey}
          sizes="88px"
          priority
          className={cn(
            "h-22 w-22 rounded-full ring-4 ring-white/20",
            row.isCurrentUser && "ring-accent/80",
            unplayed && "grayscale",
          )}
        />
        {row.rank > 0 && row.rank <= 3 && (
          <span className="absolute -bottom-1 -inset-e-1 flex h-9 w-9 items-center justify-center">
            <RankArt
              kind={medalKindForPlace(row.rank)}
              size="md"
              className="h-9 w-9 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
            />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {row.isCurrentUser && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 font-display text-[11px] font-extrabold uppercase text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
            {t("leaderboard.you")}
          </span>
        )}
        {row.rank > 0 && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-display text-[11px] font-black text-white/85 ring-1 ring-white/15">
            {tierLabel}
          </span>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-2">
        <GamePanel tone="emerald" className="flex flex-col items-center gap-1 px-3 py-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-emerald-200/70">
            {t("leaderboard.inspectXp")}
          </p>
          <p
            className={cn(
              "inline-flex items-center gap-1 font-display text-xl font-black tabular-nums",
              unplayed ? "text-white/45" : "text-emerald-300",
            )}
          >
            <ResourceIcon kind="xp" size="sm" />
            {formatNumber(row.weeklyXp, locale)}
          </p>
        </GamePanel>
        <GamePanel tone="sky" className="flex flex-col items-center gap-1 px-3 py-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-wide text-sky-100/70">
            {t("leaderboard.inspectMatches")}
          </p>
          <p className="font-display text-xl font-black tabular-nums text-white">
            {unplayed
              ? "—"
              : toLocaleDigits(row.matchesPlayed, locale)}
          </p>
        </GamePanel>
      </div>

      <p className="text-center font-display text-[11px] font-bold text-white/45">
        {unplayed
          ? t("leaderboard.notPlayed")
          : t("leaderboard.inspectHint")}
      </p>
    </div>
  );
}

function LeaderboardRowItem({
  row,
  sticky,
  animate = true,
  priorityAvatar = false,
  onInspect,
}: {
  row: LeaderboardRow;
  sticky?: boolean;
  animate?: boolean;
  priorityAvatar?: boolean;
  onInspect?: () => void;
}) {
  const { t, locale } = useTranslation();
  const unplayed = row.playState === "unplayed";
  const hot = !unplayed && row.rank > 0 && row.rank <= 10;
  const you = row.isCurrentUser;
  const tone =
    sticky || you || hot ? "emerald" : unplayed ? "sky" : "emerald";

  const panel = (
    <GamePanel
      tone={tone as "emerald" | "sky"}
      className={cn(
        "flex min-h-12 items-center gap-2 px-2 py-1.5",
        sticky &&
          "ring-2 ring-arena-amber shadow-[0_0_18px_rgba(251,191,36,0.28)]",
        // In-list YOU: lighter ring so Hunt card stays the hero signal.
        you &&
          !sticky &&
          "ring-1 ring-arena-amber/70 shadow-[0_0_10px_rgba(251,191,36,0.15)]",
        unplayed && "opacity-75",
        !hot && !you && !sticky && !unplayed && "game-panel opacity-95",
      )}
    >
      {sticky && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_0%_50%,rgba(251,191,36,0.18),transparent_55%)]"
        />
      )}

      <div
        className={[
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-black tabular-nums",
          you
            ? "bg-accent text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.35)]"
            : unplayed
              ? "bg-black/30 text-white/45"
              : hot
                ? "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-300/35"
                : "bg-black/40 text-white/85 ring-1 ring-white/12",
        ].join(" ")}
      >
        {unplayed || row.rank <= 0
          ? "—"
          : toLocaleDigits(row.rank, locale)}
      </div>

      <AvatarImage
        avatarKey={row.avatarKey}
        sizes="36px"
        priority={priorityAvatar}
        className={[
          "relative h-9 w-9 shrink-0 rounded-full ring-2",
          you ? "ring-accent/80" : "ring-white/20",
          unplayed ? "grayscale" : "",
        ].join(" ")}
      />

      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-display text-[13px] font-black leading-tight text-white">
            {shortClubName(row.clubName, 20)}
          </p>
          {you && (
            <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 font-display text-[9px] font-extrabold uppercase text-accent-foreground shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
              {t("leaderboard.you")}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-display text-[10px] font-bold leading-none text-white/45">
          {unplayed
            ? t("leaderboard.notPlayed")
            : t("leaderboard.rowMatches", {
                n: toLocaleDigits(row.matchesPlayed, locale),
              })}
        </p>
      </div>

      <div
        className={[
          "relative shrink-0 rounded-xl px-2 py-1 text-end",
          you
            ? "bg-black/40 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]"
            : "bg-black/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        ].join(" ")}
      >
        <p
          className={[
            "inline-flex items-center gap-1 font-display text-sm font-black tabular-nums leading-none",
            unplayed ? "text-white/45" : "text-emerald-300",
          ].join(" ")}
        >
          {formatNumber(row.weeklyXp, locale)}
          <ResourceIcon kind="xp" size="sm" className="h-3.5 w-3.5" />
        </p>
      </div>
    </GamePanel>
  );

  const body =
    onInspect && !sticky ? (
      <button
        type="button"
        onClick={onInspect}
        aria-label={t("leaderboard.inspectOpen", { name: row.clubName })}
        className="w-full text-start transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
      >
        {panel}
      </button>
    ) : (
      panel
    );

  if (sticky || !animate) {
    return body;
  }

  return <motion.div variants={rowVariants}>{body}</motion.div>;
}

function RefreshGlyph({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn(spinning && "animate-spin")}
    >
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
