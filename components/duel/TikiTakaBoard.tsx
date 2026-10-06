"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { beginTikiTakaTurn } from "@/actions/duel/tikitaka/beginTikiTakaTurn";
import { submitTikiTakaGuess } from "@/actions/duel/tikitaka/submitTikiTakaGuess";
import { searchMysteryPlayers } from "@/actions/mystery/searchPlayers";
import type { MysteryPlayerOption } from "@/lib/mystery/types";
import type { DuelSnapshot } from "@/lib/duel/snapshot";
import {
  countOwnedCells,
  parseTikiTakaBoard,
  type TikiTakaBoardJson,
} from "@/lib/duel/tikiTakaTypes";
import { GRID_SIZE, cellKey } from "@/lib/grid/types";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { DuelSpecialHelpSheet } from "@/components/duel/DuelSpecialHelpSheet";
import { MatchLeaveControl } from "@/components/quiz/MatchLeaveControl";
import { MatchPitch } from "@/components/quiz/MatchPitch";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type TikiTakaBoardProps = {
  duelId: string;
  duel: DuelSnapshot;
  pending?: boolean;
  onDone: (duel: DuelSnapshot, missions?: EvaluateMissionsResult) => void;
  onBoardChange?: (duel: DuelSnapshot, board: TikiTakaBoardJson) => void;
};

type Flash =
  | { kind: "goal" | "miss" | "win" | "steal"; label: string; key: number }
  | null;

function slugLabel(slug: string | null | undefined): string {
  if (!slug) return "•";
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Shared PvP 3×3 Tiki-Taka board — emerald duel chrome.
 * Sky = you, Rose = rival, open cells are stealable.
 */
export function TikiTakaBoard({
  duelId,
  duel,
  pending: parentPending,
  onDone,
  onBoardChange,
}: TikiTakaBoardProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [localDuel, setLocalDuel] = useState(duel);
  const [pending, startTransition] = useTransition();
  const busy = Boolean(pending || parentPending);
  const [leavePaused, setLeavePaused] = useState(false);

  const round = useMemo(() => {
    const n = localDuel.turn.roundNumber;
    if (n == null) return null;
    return localDuel.rounds.find((r) => r.roundNumber === n) ?? null;
  }, [localDuel]);

  const board = useMemo(
    () => parseTikiTakaBoard(round?.boardJson) ?? null,
    [round?.boardJson],
  );

  const youId =
    localDuel.youAre === "challenger"
      ? (localDuel.challenger?.id ?? null)
      : (localDuel.opponent?.id ?? null);
  const themId =
    localDuel.youAre === "challenger"
      ? (localDuel.opponent?.id ?? null)
      : (localDuel.challenger?.id ?? null);

  const yourTurn = Boolean(
    board &&
      youId &&
      board.turnOwnerId === youId &&
      board.status === "IN_PROGRESS",
  );

  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const beginInFlight = useRef(false);
  const timeoutSent = useRef(false);
  const flashKey = useRef(0);

  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MysteryPlayerOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!yourTurn || !board || endsAt) return;
    if (beginInFlight.current) return;
    beginInFlight.current = true;
    let cancelled = false;
    startTransition(async () => {
      const res = await beginTikiTakaTurn(duelId);
      if (cancelled) {
        beginInFlight.current = false;
        return;
      }
      if (!res.ok) {
        beginInFlight.current = false;
        return;
      }
      setLocalDuel(res.duel);
      setEndsAt(res.endsAt);
      onBoardChange?.(res.duel, res.board);
      beginInFlight.current = false;
      timeoutSent.current = false;
      playSound("whistle");
    });
    return () => {
      cancelled = true;
    };
  }, [yourTurn, board, endsAt, duelId, onBoardChange]);

  useEffect(() => {
    if (!endsAt || !yourTurn) return;
    const tick = () => {
      if (leavePaused) return;
      const left = Math.max(
        0,
        Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(left);
      if (left <= 0 && !timeoutSent.current && !busy) {
        timeoutSent.current = true;
        const cell = selectedCell ?? { row: 0, col: 0 };
        startTransition(async () => {
          const res = await submitTikiTakaGuess({
            duelId,
            row: cell.row,
            col: cell.col,
            playerId: selectedId ?? "",
            timedOut: true,
          });
          if (!res.ok) return;
          setLocalDuel(res.duel);
          setEndsAt(null);
          setSelectedCell(null);
          setSelectedId(null);
          setQuery("");
          setOptions([]);
          playSound("miss");
          haptic(HAPTIC.miss);
          pulse("miss", t("duel.tiki.flashTimeout"));
          if (res.finished) {
            window.setTimeout(() => onDone(res.duel, res.missions), 700);
          } else {
            onBoardChange?.(res.duel, res.board);
          }
        });
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [
    endsAt,
    yourTurn,
    leavePaused,
    busy,
    selectedCell,
    selectedId,
    duelId,
    onDone,
    onBoardChange,
    t,
  ]);

  useEffect(() => {
    setLocalDuel(duel);
  }, [duel]);

  function pulse(kind: NonNullable<Flash>["kind"], label: string) {
    flashKey.current += 1;
    setFlash({ kind, label, key: flashKey.current });
    window.setTimeout(() => setFlash(null), 900);
  }

  async function runSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setOptions([]);
      return;
    }
    const res = await searchMysteryPlayers(q);
    if (res.ok) setOptions(res.players);
  }

  function submitGuess() {
    if (!selectedCell || !selectedId || busy || !yourTurn) return;
    const cell = selectedCell;
    const playerId = selectedId;
    startTransition(async () => {
      const res = await submitTikiTakaGuess({
        duelId,
        row: cell.row,
        col: cell.col,
        playerId,
      });
      if (!res.ok) {
        if (res.error === "player_used") {
          toast.error(t("duel.tiki.errUsed"));
        } else if (res.error === "cell_taken") {
          toast.error(t("duel.tiki.errTaken"));
        } else {
          toast.error(t("duel.errGeneric"));
        }
        return;
      }
      setLocalDuel(res.duel);
      setEndsAt(null);
      setSelectedCell(null);
      setSelectedId(null);
      setQuery("");
      setOptions([]);
      if (res.correct) {
        playSound("goal");
        haptic(HAPTIC.goal);
        pulse("goal", t("duel.tiki.flashClaim"));
      } else {
        playSound("miss");
        haptic(HAPTIC.miss);
        pulse("miss", t("duel.tiki.flashMiss"));
      }
      if (res.finished) {
        if (res.board.winnerId === youId) {
          pulse("win", t("duel.tiki.flashWin"));
        }
        window.setTimeout(() => onDone(res.duel, res.missions), 800);
      } else {
        onBoardChange?.(res.duel, res.board);
      }
    });
  }

  if (!board || !round) {
    return (
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-arena" />
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-emerald-500/20 to-transparent" />
        </div>
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
          className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/40 shadow-[0_0_0_1px_rgba(52,211,153,0.35),0_4px_0_0_rgba(0,0,0,0.35)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/target.png"
            alt=""
            draggable={false}
            className="h-9 w-9 object-contain"
          />
        </motion.div>
        <p className="relative z-10 mt-4 font-display text-sm font-bold text-white/55">
          {t("duel.tiki.loading")}
        </p>
      </section>
    );
  }

  const youCells = youId ? countOwnedCells(board, youId) : 0;
  const themCells = themId ? countOwnedCells(board, themId) : 0;
  const hurry = yourTurn && secondsLeft > 0 && secondsLeft <= 5;
  const critical = yourTurn && secondsLeft > 0 && secondsLeft <= 3;
  const winSet = new Set(board.winLine ?? []);
  const selectedLabel = (() => {
    const o = options.find((opt) => opt.id === selectedId);
    if (!o) return null;
    return locale === "fa" ? o.nameFa : o.nameEn;
  })();
  const timerPct = Math.min(100, Math.max(0, (secondsLeft / 20) * 100));
  const ringR = 26;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - (yourTurn ? timerPct / 100 : 1));
  const selRow = selectedCell?.row ?? null;
  const selCol = selectedCell?.col ?? null;
  const rowLabel = (ri: number) =>
    locale === "fa"
      ? board.axes.rows[ri]!.labelFa
      : board.axes.rows[ri]!.labelEn;
  const colLabel = (ci: number) =>
    locale === "fa"
      ? board.axes.cols[ci]!.labelFa
      : board.axes.cols[ci]!.labelEn;

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-arena text-arena-fg">
      <MatchPitch stadiumLevel={0} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-1 h-40 bg-linear-to-b from-emerald-500/18 via-sky-500/6 to-transparent"
      />

      {/* HUD — leave · title/turn · score · timer · help */}
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-2.5 mt-[max(0.35rem,env(safe-area-inset-top))] shrink-0"
      >
        <GamePanel tone="emerald" className="bg-black/30 px-2 py-1.5">
          <div className="relative flex items-center gap-1.5">
            <MatchLeaveControl
              setPaused={setLeavePaused}
              onConfirmLeave={() => router.push("/play/duel")}
            />

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <h1 className="truncate font-display text-sm font-black leading-none text-white">
                  {t("duel.tiki.title")}
                </h1>
                <GameChip
                  tone={yourTurn ? "emerald" : "default"}
                  className={cn(
                    "shrink-0 gap-1 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide",
                    yourTurn
                      ? "bg-sky-500/30 text-sky-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.45)]"
                      : "bg-rose-500/25 text-rose-100 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.4)]",
                  )}
                >
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-current"
                    animate={
                      reduceMotion
                        ? undefined
                        : { opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }
                    }
                    transition={{ repeat: Infinity, duration: 1.05 }}
                  />
                  {yourTurn ? t("duel.tiki.yourTurn") : t("duel.tiki.theirTurn")}
                </GameChip>
              </div>

              {/* Inline scoreboard — saves a full row for the pitch */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-sky-500/15 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.28)]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                  <span className="truncate font-display text-[10px] font-extrabold text-sky-100">
                    {t("duel.tiki.you")}
                  </span>
                  <span className="ms-auto font-display text-base font-black tabular-nums leading-none text-white">
                    {toLocaleDigits(youCells, locale)}
                  </span>
                </div>
                <span className="shrink-0 font-display text-[10px] font-black text-white/25">
                  —
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-rose-500/15 px-2 py-1 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.28)]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                  <span className="truncate font-display text-[10px] font-extrabold text-rose-100">
                    {t("duel.tiki.them")}
                  </span>
                  <span className="ms-auto font-display text-base font-black tabular-nums leading-none text-white">
                    {toLocaleDigits(themCells, locale)}
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              className="relative h-12 w-12 shrink-0"
              animate={
                critical && !reduceMotion
                  ? { scale: [1, 1.06, 1] }
                  : undefined
              }
              transition={{ repeat: Infinity, duration: 0.45 }}
              aria-live="polite"
              aria-label={
                yourTurn
                  ? toLocaleDigits(secondsLeft, locale)
                  : t("duel.tiki.theirTurn")
              }
            >
              <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={ringR}
                  fill="none"
                  strokeWidth="5"
                  className="stroke-white/12"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r={ringR}
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className={
                    critical
                      ? "stroke-rose-400"
                      : hurry
                        ? "stroke-amber-400"
                        : yourTurn
                          ? "stroke-emerald-400"
                          : "stroke-white/25"
                  }
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOffset}
                  initial={false}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 0.18, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <span
                  className={cn(
                    "font-display text-base font-black tabular-nums leading-none",
                    critical
                      ? "text-rose-300"
                      : hurry
                        ? "text-amber-200"
                        : yourTurn
                          ? "text-emerald-200"
                          : "text-white/45",
                  )}
                >
                  {yourTurn ? toLocaleDigits(secondsLeft, locale) : "···"}
                </span>
              </div>
            </motion.div>

            <button
              type="button"
              aria-label={t("duel.tiki.helpAria")}
              onClick={() => {
                playSound("click");
                haptic(HAPTIC.tap);
                setHelpOpen(true);
              }}
              className="game-cta game-cta-ghost h-11 w-11 shrink-0 p-0 shadow-[0_0_0_1px_hsl(var(--arena-ring-amber)/0.4),0_3px_0_0_rgba(0,0,0,0.35)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/help-gold.png"
                alt=""
                draggable={false}
                className="h-7 w-7 object-contain"
              />
            </button>
          </div>

          {yourTurn ? (
            <div className="relative mt-1.5 overflow-hidden rounded-full bg-black/50 p-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
              <motion.div
                className={cn(
                  "h-1.5 rounded-full bg-linear-to-r",
                  critical
                    ? "from-rose-500 to-orange-400"
                    : hurry
                      ? "from-amber-400 to-orange-300"
                      : "from-emerald-400 to-teal-300",
                )}
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </div>
          ) : null}
        </GamePanel>
      </motion.header>

      {/* Board — square cells, centered; no vertical stretch */}
      <div className="relative z-10 mx-2.5 mt-2 flex min-h-0 flex-1 flex-col items-center justify-center">
        <GamePanel
          tone="emerald"
          className="relative w-full max-w-[22.5rem] p-2"
        >
          <div
            className="relative grid w-full gap-1.5"
            style={{
              gridTemplateColumns: `minmax(3.5rem,auto) repeat(${GRID_SIZE}, minmax(0,1fr))`,
            }}
          >
            <div className="flex items-center justify-center" aria-hidden>
              <span className="font-display text-xs font-black text-white/20">
                ×
              </span>
            </div>
            {board.axes.cols.map((c, ci) => {
              const lit = selCol === ci;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-xl px-1 text-center font-display text-[11px] font-extrabold leading-tight transition-colors",
                    lit
                      ? "bg-amber-400/25 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.55),0_2px_0_0_rgba(0,0,0,0.3)]"
                      : "bg-black/40 text-emerald-50/90 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.22)]",
                  )}
                >
                  {locale === "fa" ? c.labelFa : c.labelEn}
                </div>
              );
            })}
            {board.axes.rows.map((r, ri) => (
              <div key={r.id} className="contents">
                <div
                  className={cn(
                    "flex items-center justify-center self-stretch rounded-xl px-1 text-center font-display text-[11px] font-extrabold leading-tight transition-colors",
                    selRow === ri
                      ? "bg-amber-400/25 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.55),0_2px_0_0_rgba(0,0,0,0.3)]"
                      : "bg-black/40 text-emerald-50/90 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.22)]",
                  )}
                >
                  {locale === "fa" ? r.labelFa : r.labelEn}
                </div>
                {Array.from({ length: GRID_SIZE }, (_, ci) => {
                  const key = cellKey(ri, ci);
                  const cell = board.cells[key]!;
                  const ownedByYou = youId != null && cell.ownerId === youId;
                  const ownedByThem = themId != null && cell.ownerId === themId;
                  const empty = !cell.ownerId;
                  const selected =
                    selectedCell?.row === ri && selectedCell?.col === ci;
                  const onAxis =
                    !selected &&
                    selectedCell != null &&
                    (selectedCell.row === ri || selectedCell.col === ci);
                  const isWin = winSet.has(key);
                  const canTap =
                    yourTurn &&
                    empty &&
                    board.status === "IN_PROGRESS" &&
                    !busy;

                  return (
                    <motion.button
                      key={key}
                      type="button"
                      disabled={!canTap}
                      whileTap={canTap ? { scale: 0.96 } : undefined}
                      onClick={() => {
                        if (!canTap) return;
                        setSelectedCell({ row: ri, col: ci });
                        setSelectedId(null);
                        setQuery("");
                        setOptions([]);
                        playSound("click");
                        haptic(HAPTIC.tap);
                      }}
                      aria-label={
                        empty
                          ? `${rowLabel(ri)} × ${colLabel(ci)}`
                          : slugLabel(cell.playerId)
                      }
                      className={cn(
                        "relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl px-1 py-1 text-center transition-colors",
                        ownedByYou &&
                          "bg-linear-to-br from-sky-500/60 to-blue-900/45 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.55),0_3px_0_0_rgba(0,0,0,0.35)]",
                        ownedByThem &&
                          "bg-linear-to-br from-rose-500/60 to-red-950/45 text-white shadow-[0_0_0_1px_rgba(251,113,133,0.55),0_3px_0_0_rgba(0,0,0,0.35)]",
                        empty &&
                          selected &&
                          "bg-amber-400/25 text-white shadow-[0_0_0_2px_rgba(251,191,36,0.7),0_3px_0_0_rgba(0,0,0,0.35)]",
                        empty &&
                          !selected &&
                          onAxis &&
                          "bg-amber-400/8 text-white/55 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.28)]",
                        empty &&
                          !selected &&
                          !onAxis &&
                          "bg-white/4 text-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
                        canTap && !selected && "hover:bg-white/8",
                        isWin &&
                          "shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_0_20px_rgba(251,191,36,0.3),0_3px_0_0_rgba(0,0,0,0.35)]",
                      )}
                    >
                      {ownedByYou || ownedByThem ? (
                        <>
                          <span className="font-display text-[9px] font-extrabold uppercase tracking-wide opacity-80">
                            {ownedByYou
                              ? t("duel.tiki.you")
                              : t("duel.tiki.them")}
                          </span>
                          <span className="mt-0.5 line-clamp-2 font-display text-[11px] font-bold leading-tight">
                            {slugLabel(cell.playerId)}
                          </span>
                        </>
                      ) : (
                        <motion.span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full font-display text-xl font-black",
                            selected
                              ? "bg-amber-300/30 text-amber-50"
                              : "bg-white/6 text-white/35",
                          )}
                          animate={
                            canTap && !selected && !reduceMotion
                              ? {
                                  scale: [1, 1.08, 1],
                                  opacity: [0.55, 1, 0.55],
                                }
                              : undefined
                          }
                          transition={{
                            repeat: Infinity,
                            duration: 1.6,
                            ease: "easeInOut",
                          }}
                        >
                          +
                        </motion.span>
                      )}
                      {isWin ? (
                        <motion.span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-2xl bg-amber-300/20"
                          animate={
                            reduceMotion
                              ? undefined
                              : { opacity: [0.2, 0.55, 0.2] }
                          }
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        />
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </GamePanel>
      </div>

      {/* Footer — prompt only; help lives in the HUD */}
      <div className="relative z-20 shrink-0 px-2.5 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1.5">
        <AnimatePresence mode="wait" initial={false}>
          {yourTurn && selectedCell ? (
            <motion.div
              key="pick"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <GamePanel
                tone="emerald"
                className="px-2.5 pb-2.5 pt-2 shadow-[0_-6px_28px_rgba(0,0,0,0.5)]"
              >
                <div className="relative mb-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-start font-display text-[12px] font-extrabold text-amber-100">
                    {t("duel.tiki.cellFor", {
                      row: rowLabel(selectedCell.row),
                      col: colLabel(selectedCell.col),
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCell(null);
                      setSelectedId(null);
                      setQuery("");
                      setOptions([]);
                      playSound("click");
                    }}
                    className="shrink-0 rounded-xl px-2 py-1 font-display text-[11px] font-bold text-white/50 hover:bg-white/8 hover:text-white/80"
                  >
                    {t("common.close")}
                  </button>
                </div>
                <p className="relative mb-1.5 text-center font-display text-[11px] font-bold text-white/55">
                  {selectedLabel
                    ? `✓ ${selectedLabel}`
                    : t("duel.tiki.pickHint")}
                </p>
                <input
                  type="search"
                  value={query}
                  disabled={busy}
                  autoFocus
                  onChange={(e) => void runSearch(e.target.value)}
                  placeholder={t("mystery.searchPlaceholder")}
                  className="game-input relative min-h-12 w-full px-3 font-display text-sm font-bold"
                />
                <ul className="relative mt-1.5 max-h-28 overflow-y-auto rounded-2xl bg-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                  {options.length === 0 ? (
                    <li className="px-3 py-2.5 text-center font-display text-xs font-bold text-white/35">
                      {query.trim().length < 2
                        ? t("duel.special.typeMore")
                        : "…"}
                    </li>
                  ) : (
                    options.map((o) => {
                      const used = board.usedPlayerIds.includes(o.id);
                      const active = selectedId === o.id;
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            disabled={busy || used}
                            onClick={() => {
                              setSelectedId(o.id);
                              playSound("click");
                              haptic(HAPTIC.tap);
                            }}
                            className={cn(
                              "flex w-full min-h-12 items-center justify-between gap-2 px-3 py-2 text-start font-display text-sm font-bold",
                              used && "text-white/25 line-through",
                              !used &&
                                active &&
                                "bg-emerald-500/30 text-emerald-50",
                              !used &&
                                !active &&
                                "text-white/85 hover:bg-white/8",
                            )}
                          >
                            <span>
                              {locale === "fa" ? o.nameFa : o.nameEn}
                            </span>
                            {used ? (
                              <span className="text-[10px] uppercase">
                                {t("duel.tiki.used")}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
                <GameCta
                  variant="primary"
                  block
                  disabled={busy || !selectedId}
                  onClick={submitGuess}
                  className="relative mt-2 min-h-12 font-display font-black"
                >
                  {t("duel.tiki.submit")}
                </GameCta>
              </GamePanel>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              transition={{ duration: 0.16 }}
            >
              <GamePanel
                tone={yourTurn ? "sky" : "emerald"}
                className="px-3 py-2.5 text-center"
              >
                <p className="font-display text-[15px] font-black text-white">
                  {yourTurn
                    ? t("duel.tiki.tapCell")
                    : t("duel.tiki.waitRival")}
                </p>
                <p className="mt-0.5 font-body text-[11px] font-semibold leading-snug text-white/50">
                  {t("duel.tiki.missRule")}
                </p>
              </GamePanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {flash ? (
          <motion.div
            key={flash.key}
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="pointer-events-none absolute inset-x-0 top-[30%] z-30 flex justify-center"
          >
            <span
              className={cn(
                "rounded-2xl px-5 py-2.5 font-display text-lg font-black shadow-[0_4px_0_0_rgba(0,0,0,0.35),0_12px_32px_rgba(0,0,0,0.45)]",
                flash.kind === "goal" || flash.kind === "win"
                  ? "bg-emerald-400 text-emerald-950"
                  : flash.kind === "steal"
                    ? "bg-amber-400 text-amber-950"
                    : "bg-rose-500 text-white",
              )}
            >
              {flash.label}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DuelSpecialHelpSheet
        mode="tikiTaka"
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        tone="dark"
      />
    </section>
  );
}
