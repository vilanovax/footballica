"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  MissionBoard,
  playHrefForObjective,
} from "@/components/profile/MissionBoard";
import {
  claimMyMissionChest,
  claimMyMissionReward,
  getMyMissions,
} from "@/actions/missions";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import type { CampaignChapterView } from "@/lib/game/campaignSeason";
import {
  countMissionRewardsReady,
  hasMissionRewardReady,
} from "@/lib/game/missionRewards";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameTile } from "@/components/ui/game/GameTile";

export { countMissionRewardsReady, hasMissionRewardReady };

type TabKey = "daily" | "campaign";

/** Stable default — avoid `= []` recreating referential identity each render. */
const EMPTY_CHAPTERS: CampaignChapterView[] = [];

type MissionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Force Daily / Campaign tab when opening from Hub Campaign card. */
  preferredTab?: TabKey;
  dailyBoard?: EvaluateMissionsResult | null;
  missionBoard?: EvaluateMissionsResult | null;
  /** Live RecordChallenge chapters (ADR 002 soft narrative). */
  chapters?: CampaignChapterView[];
  onEconomyUpdate?: (balances: { coins: number; xp: number }) => void;
};

function hasUnclaimedDrip(board?: EvaluateMissionsResult | null): boolean {
  return Boolean(
    board?.missions.some((m) => m.isCompleted && !m.isClaimed),
  );
}

function boardStats(board?: EvaluateMissionsResult | null) {
  if (!board?.batchId || !board.missions.length) {
    return { done: 0, total: 0, ready: false, claimableCount: 0 };
  }
  const done = board.missions.filter((m) => m.isCompleted).length;
  const claimableCount = board.missions.filter(
    (m) => m.isCompleted && !m.isClaimed,
  ).length;
  return {
    done,
    total: board.missions.length,
    ready: Boolean(board.chestReady || claimableCount > 0),
    claimableCount,
  };
}

function firstIncompleteHref(
  board?: EvaluateMissionsResult | null,
): string | null {
  const m = board?.missions.find((x) => !x.isCompleted);
  if (!m) return null;
  return playHrefForObjective(m.objectiveType);
}

/**
 * Bottom-sheet mission hub — claim-first footer, Daily / Campaign tabs.
 * Dark emerald arena chrome aligned with Club Hub sheets.
 */
export function MissionDrawer({
  open,
  onOpenChange,
  preferredTab,
  dailyBoard = null,
  missionBoard = null,
  chapters = EMPTY_CHAPTERS,
  onEconomyUpdate,
}: MissionDrawerProps) {
  const { t, locale } = useTranslation();
  const [liveDaily, setLiveDaily] = useState(dailyBoard);
  const [liveCampaign, setLiveCampaign] = useState(missionBoard);
  const [, startRefresh] = useTransition();
  const [claimingAll, setClaimingAll] = useState(false);

  useEffect(() => {
    setLiveDaily(dailyBoard);
  }, [dailyBoard]);

  useEffect(() => {
    setLiveCampaign(missionBoard);
  }, [missionBoard]);

  useEffect(() => {
    if (!open) return;
    startRefresh(async () => {
      const res = await getMyMissions();
      if (!res.ok) return;
      setLiveDaily(res.daily);
      setLiveCampaign(res.board);
    });
  }, [open]);

  const hasDaily = Boolean(liveDaily?.batchId);
  const hasCampaign = Boolean(liveCampaign?.batchId);
  const hasChapters = chapters.length > 0;
  const hasCampaignPane = hasCampaign || hasChapters;

  const defaultTab: TabKey = useMemo(() => {
    if (preferredTab === "campaign" && hasCampaignPane) return "campaign";
    if (preferredTab === "daily" && hasDaily) return "daily";
    if (liveDaily?.chestReady || hasUnclaimedDrip(liveDaily)) return "daily";
    if (liveCampaign?.chestReady || hasUnclaimedDrip(liveCampaign)) {
      return "campaign";
    }
    if (hasDaily) return "daily";
    return "campaign";
  }, [liveDaily, liveCampaign, hasDaily, hasCampaignPane, preferredTab]);

  const [tab, setTab] = useState<TabKey>(defaultTab);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dailyStats = boardStats(liveDaily);
  const campaignStats = boardStats(liveCampaign);
  const activeBoard = tab === "daily" ? liveDaily : liveCampaign;
  const activeStats = tab === "daily" ? dailyStats : campaignStats;
  const activeReady = activeStats.ready;
  const showTabs = hasDaily && hasCampaignPane;
  const continueHref = firstIncompleteHref(activeBoard);

  const claimableTotal =
    activeStats.claimableCount + (activeBoard?.chestReady ? 1 : 0);

  function close() {
    haptic(HAPTIC.light);
    onOpenChange(false);
  }

  function selectTab(next: TabKey) {
    if (next === tab) return;
    haptic(HAPTIC.light);
    setTab(next);
  }

  async function refreshBoards() {
    const res = await getMyMissions();
    if (!res.ok) return null;
    setLiveDaily(res.daily);
    setLiveCampaign(res.board);
    return res;
  }

  async function handleClaimAll() {
    if (!activeBoard?.batchId || claimingAll) return;
    setClaimingAll(true);
    playSound("click");
    haptic(HAPTIC.tap);

    try {
      let lastBalances: { coins: number; xp: number } | null = null;
      const drips = activeBoard.missions.filter(
        (m) => m.isCompleted && !m.isClaimed,
      );

      for (const m of drips) {
        const res = await claimMyMissionReward(m.missionId);
        if (!res.ok) {
          toast.error(t("missions.errClaimDrip"));
          break;
        }
        lastBalances = res.balances;
      }

      const afterDrips = await refreshBoards();
      const boardAfter =
        tab === "daily" ? afterDrips?.daily : afterDrips?.board;

      if (boardAfter?.chestReady && boardAfter.batchId) {
        const chest = await claimMyMissionChest(boardAfter.batchId);
        if (!chest.ok) {
          toast.error(t("missions.errClaim"));
        } else {
          lastBalances = chest.balances;
          playSound("upgrade");
          haptic(HAPTIC.goal);
        }
        await refreshBoards();
      } else if (lastBalances) {
        playSound("upgrade");
        haptic(HAPTIC.goal);
      }

      if (lastBalances) {
        onEconomyUpdate?.(lastBalances);
      }
    } finally {
      setClaimingAll(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-70 mx-auto flex max-w-mobile flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("missions.drawerTitle")}
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="game-sheet relative z-10 flex max-h-[84dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-linear-to-b from-arena-deep via-arena to-arena-mid shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.35),0_-20px_50px_rgba(0,0,0,0.55)]"
          >
            <header className="relative shrink-0 px-4 pb-2 pt-3">
              <div className="mb-2.5 flex justify-center">
                <span
                  aria-hidden
                  className="h-1.5 w-11 rounded-full bg-white/25"
                />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5 text-start">
                  <GameIconWell
                    size="md"
                    src="/icons/hub-mission.png"
                    className="h-11 w-11 shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-black text-arena-fg">
                      {t("missions.drawerTitle")}
                    </h2>
                    <p
                      className={[
                        "mt-0.5 font-display text-xs font-bold",
                        activeReady ? "text-amber-200" : "text-arena-muted",
                      ].join(" ")}
                    >
                      {activeReady
                        ? t("missions.drawerSubtitleReady")
                        : activeStats.total > 0
                          ? t("missions.drawerSubtitle", {
                              done: toLocaleDigits(activeStats.done, locale),
                              total: toLocaleDigits(activeStats.total, locale),
                            })
                          : t("missions.drawerEmpty")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/40 font-display text-base font-black text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_3px_0_0_rgba(0,0,0,0.35)] transition-transform active:scale-95"
                  aria-label={t("common.close")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/close-arena.png"
                    alt=""
                    draggable={false}
                    className="h-5 w-5 object-contain opacity-90"
                  />
                </button>
              </div>

              {showTabs && (
                <div
                  role="tablist"
                  aria-label={t("missions.drawerTitle")}
                  className="relative mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-black/40 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                >
                  {(
                    [
                      {
                        key: "daily" as const,
                        label: t("missions.tabDaily"),
                        stats: dailyStats,
                        chestReady: Boolean(liveDaily?.chestReady),
                      },
                      {
                        key: "campaign" as const,
                        label: t("missions.tabCampaign"),
                        stats: campaignStats,
                        chestReady: Boolean(liveCampaign?.chestReady),
                      },
                    ] as const
                  ).map((item) => {
                    const active = tab === item.key;
                    const readyCount =
                      item.stats.claimableCount + (item.chestReady ? 1 : 0);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => selectTab(item.key)}
                        className={[
                          "relative z-10 flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 font-display text-sm font-black transition-colors",
                          active ? "text-white" : "text-white/45",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.span
                            layoutId="mission-tab-pill"
                            className="absolute inset-0 rounded-xl bg-linear-to-b from-emerald-600/85 to-emerald-900/95 shadow-[0_0_0_1px_hsl(var(--arena-ring)/0.35),0_2px_0_0_rgba(0,0,0,0.35)]"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 32,
                            }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                        {item.stats.ready ? (
                          <span className="relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-black tabular-nums text-accent-foreground shadow-[0_0_0_1px_hsl(var(--arena-ring-amber)/0.45)]">
                            {readyCount > 0
                              ? toLocaleDigits(readyCount, locale)
                              : "!"}
                          </span>
                        ) : item.stats.total > 0 ? (
                          <span
                            className={[
                              "relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                              active
                                ? "bg-black/30 text-white/75"
                                : "bg-white/8 text-white/40",
                            ].join(" ")}
                          >
                            {toLocaleDigits(item.stats.done, locale)}/
                            {toLocaleDigits(item.stats.total, locale)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </header>

            <div className="relative flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-3 pt-1">
              {!hasDaily && !hasCampaignPane && (
                <p className="rounded-2xl bg-black/35 px-4 py-8 text-center font-display text-sm font-bold text-arena-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                  {t("missions.drawerEmpty")}
                </p>
              )}

              <AnimatePresence mode="wait">
                {showTabs && tab === "daily" && hasDaily && liveDaily ? (
                  <motion.div
                    key={`daily-${liveDaily.batchId}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    <MissionBoard
                      initialBoard={liveDaily}
                      variant="daily"
                      density="compact"
                      onDripClaimed={onEconomyUpdate}
                      onClaimed={() => {
                        startRefresh(async () => {
                          await refreshBoards();
                        });
                      }}
                    />
                  </motion.div>
                ) : showTabs && tab === "campaign" && hasCampaignPane ? (
                  <motion.div
                    key={`campaign-${liveCampaign?.batchId ?? "none"}-${chapters.length}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    <GameChip
                      tone="emerald"
                      className="w-full justify-center py-1.5 text-center"
                    >
                      {t("campaign.drawerBlurb")}
                    </GameChip>

                    {hasCampaign && liveCampaign && (
                      <MissionBoard
                        initialBoard={liveCampaign}
                        variant="campaign"
                        density="compact"
                        onDripClaimed={onEconomyUpdate}
                        onClaimed={() => {
                          startRefresh(async () => {
                            await refreshBoards();
                          });
                        }}
                      />
                    )}

                    {hasChapters && (
                      <div className="space-y-2">
                        <p className="px-0.5 font-display text-[11px] font-black text-arena-muted">
                          {t("campaign.chapters")}
                        </p>
                        <ul className="flex flex-col gap-2">
                          {chapters.map((ch, i) => {
                            const title =
                              locale === "fa" ? ch.titleFa : ch.titleEn;
                            return (
                              <li key={ch.id}>
                                <Link
                                  href={`/play/survival?challenge=${encodeURIComponent(ch.id)}`}
                                  onClick={close}
                                  className="block transition-transform active:scale-[0.98]"
                                >
                                  <GameTile
                                    tone={
                                      ch.conquered ? "emerald" : "default"
                                    }
                                    className={[
                                      "flex min-h-12 items-center gap-2.5 px-2.5 py-2",
                                      !ch.unlocked && !ch.conquered
                                        ? "opacity-60"
                                        : "",
                                    ].join(" ")}
                                  >
                                    <span
                                      className={[
                                        "flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-black",
                                        ch.conquered
                                          ? "bg-emerald-600/40 text-white"
                                          : "bg-black/40 text-white/70",
                                      ].join(" ")}
                                      aria-hidden
                                    >
                                      {ch.conquered ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src="/icons/trophy.png"
                                          alt=""
                                          draggable={false}
                                          className="h-5 w-5 object-contain"
                                        />
                                      ) : (
                                        toLocaleDigits(i + 1, locale)
                                      )}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-arena-fg">
                                      {title}
                                    </span>
                                    <GameChip
                                      tone={
                                        ch.conquered
                                          ? "emerald"
                                          : ch.unlocked
                                            ? "amber"
                                            : "default"
                                      }
                                    >
                                      {ch.conquered
                                        ? t("campaign.chapterDone")
                                        : ch.unlocked
                                          ? t("campaign.chapterPlay")
                                          : t("campaign.chapterLocked")}
                                    </GameChip>
                                  </GameTile>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ) : !showTabs && hasDaily && !hasCampaignPane && liveDaily ? (
                  <motion.div
                    key={`daily-solo-${liveDaily.batchId}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    <MissionBoard
                      initialBoard={liveDaily}
                      variant="daily"
                      density="compact"
                      onDripClaimed={onEconomyUpdate}
                    />
                  </motion.div>
                ) : !showTabs && hasCampaignPane && !hasDaily ? (
                  <motion.div
                    key={`campaign-solo-${liveCampaign?.batchId ?? "ch"}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {hasCampaign && liveCampaign && (
                      <MissionBoard
                        initialBoard={liveCampaign}
                        variant="campaign"
                        density="compact"
                        onDripClaimed={onEconomyUpdate}
                      />
                    )}
                    {hasChapters && (
                      <ul className="flex flex-col gap-2">
                        {chapters.map((ch, i) => (
                          <li key={ch.id}>
                            <Link
                              href={`/play/survival?challenge=${encodeURIComponent(ch.id)}`}
                              onClick={close}
                              className="block transition-transform active:scale-[0.98]"
                            >
                              <GameTile className="flex min-h-12 items-center gap-2.5 px-2.5 py-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 font-display text-sm font-black text-white/70">
                                  {toLocaleDigits(i + 1, locale)}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-arena-fg">
                                  {locale === "fa" ? ch.titleFa : ch.titleEn}
                                </span>
                              </GameTile>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {activeReady ? (
              <div className="relative shrink-0 border-t border-white/10 bg-arena/95 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
                <GameCta
                  variant="accent"
                  block
                  disabled={claimingAll}
                  onClick={handleClaimAll}
                  className="min-h-13 text-base"
                  aria-label={
                    claimingAll
                      ? t("missions.claiming")
                      : claimableTotal > 1
                        ? t("missions.drawerClaimAll")
                        : t("missions.drawerClaimReward")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/claim.png"
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
                  />
                  {claimingAll
                    ? t("missions.claiming")
                    : claimableTotal > 1
                      ? t("missions.drawerClaimAll")
                      : t("missions.drawerClaimReward")}
                </GameCta>
              </div>
            ) : continueHref ? (
              <div className="relative shrink-0 border-t border-white/10 bg-arena/95 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
                <Link
                  href={continueHref}
                  onClick={close}
                  className="game-cta game-cta-primary flex min-h-13 w-full items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/target.png"
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="h-6 w-6 object-contain"
                  />
                  {t("missions.drawerContinueCta")}
                </Link>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
