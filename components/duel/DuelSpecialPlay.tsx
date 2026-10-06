"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { guessDuelStarPath } from "@/actions/duel/guessStarPath";
import { guessDuelMystery } from "@/actions/duel/guessMystery";
import { guessDuelGrid } from "@/actions/duel/guessGrid";
import type { DuelSnapshot } from "@/lib/duel/snapshot";
import {
  parseStarPathBoard,
  parseStarPathHalfLog,
  type StarPathHalfLog,
} from "@/lib/duel/starPathTypes";
import {
  parseMysteryBoard,
  parseMysteryHalfLog,
  type MysteryHalfLog,
} from "@/lib/duel/mysteryTypes";
import {
  parseGridBoard,
  parseGridHalfLog,
  type GridHalfLog,
} from "@/lib/duel/gridTypes";
import { searchMysteryPlayers } from "@/actions/mystery/searchPlayers";
import type {
  AttributeVerdict,
  CompareVerdict,
  MysteryGuessRecord,
  MysteryPlayerOption,
} from "@/lib/mystery/types";
import { STAR_PATH_SCORE_BY_CLUES } from "@/lib/starpath/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { GRID_SIZE, cellKey } from "@/lib/grid/types";
import type { EvaluateMissionsResult } from "@/lib/game/missionTypes";
import { DuelSpecialHelpSheet } from "@/components/duel/DuelSpecialHelpSheet";
import { MatchLeaveControl } from "@/components/quiz/MatchLeaveControl";
import { MatchPitch } from "@/components/quiz/MatchPitch";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Props = {
  duelId: string;
  duel: DuelSnapshot;
  mode: "attack" | "defend";
  onDone: (duel: DuelSnapshot, missions?: EvaluateMissionsResult) => void;
};

type Flash =
  | { kind: "goal"; key: number; label: string }
  | { kind: "miss"; key: number; label: string }
  | null;

type AttackTheme = {
  flood: string;
  badge: string;
  ring: string;
  ringTrack: string;
  score: string;
  accent: string;
  cta: string;
  dockRing: string;
  panelTone: "amber" | "sky";
};

function useAttackTheme(isAttack: boolean): AttackTheme {
  return useMemo(
    () =>
      isAttack
        ? {
            flood: "from-orange-500/35 via-amber-400/10",
            badge: "bg-orange-500 text-white shadow-orange-500/40",
            ring: "stroke-orange-400",
            ringTrack: "stroke-orange-400/20",
            score: "text-orange-300",
            accent: "text-orange-300",
            cta: "game-cta-accent",
            dockRing: "focus:ring-orange-400/50",
            panelTone: "amber",
          }
        : {
            flood: "from-sky-400/30 via-teal-400/10",
            badge: "bg-sky-500 text-white shadow-sky-500/40",
            ring: "stroke-sky-400",
            ringTrack: "stroke-sky-400/20",
            score: "text-sky-300",
            accent: "text-sky-300",
            cta: "game-cta-primary",
            dockRing: "focus:ring-sky-400/50",
            panelTone: "sky",
          },
    [isAttack],
  );
}

/**
 * Polished duel half for STAR_PATH / MYSTERY / GRID — MemoryBoard-tier arena.
 */
export function DuelSpecialPlay({ duelId, duel, mode, onDone }: Props) {
  const { t, locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState<MysteryPlayerOption[]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [localDuel, setLocalDuel] = useState(duel);
  const [flash, setFlash] = useState<Flash>(null);
  const [, setFlashKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const isAttack = mode === "attack";
  const theme = useAttackTheme(isAttack);

  useEffect(() => {
    setLocalDuel(duel);
  }, [duel]);

  const round = useMemo(() => {
    if (localDuel.turn.roundNumber == null) return null;
    return (
      localDuel.rounds.find(
        (r) => r.roundNumber === localDuel.turn.roundNumber,
      ) ?? null
    );
  }, [localDuel]);

  const answersRaw = isAttack ? round?.attackAnswers : round?.defenseAnswers;

  async function runSearch(q: string) {
    setQuery(q);
    setSelectedId(null);
    if (q.trim().length < 2) {
      setOptions([]);
      return;
    }
    const res = await searchMysteryPlayers(q);
    if (res.ok) setOptions(res.players);
  }

  function pulse(kind: "goal" | "miss", label: string) {
    setFlashKey((k) => {
      const next = k + 1;
      setFlash({ kind, key: next, label });
      return next;
    });
    window.setTimeout(() => setFlash(null), 900);
  }

  const selectedLabel = useMemo(() => {
    const o = options.find((x) => x.id === selectedId);
    if (!o) return null;
    return locale === "fa" ? o.nameFa : o.nameEn;
  }, [options, selectedId, locale]);

  if (!round) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <motion.span
          className="inline-flex"
          animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/memory-ball.png"
            alt=""
            className="h-12 w-12 object-contain"
          />
        </motion.span>
      </div>
    );
  }

  const badge =
    mode === "attack"
      ? t("duel.special.attackBadge")
      : t("duel.special.defendBadge");

  // ─── STAR PATH ───────────────────────────────────────────────────────────
  if (round.roundType === "STAR_PATH") {
    const board = parseStarPathBoard(round.boardJson);
    const log: StarPathHalfLog =
      parseStarPathHalfLog(answersRaw) ?? {
        guesses: [],
        cluesRevealed: 1,
        status: "IN_PROGRESS",
        score: 0,
      };
    const maxClues = board?.maxClues ?? 4;
    const nextScore = STAR_PATH_SCORE_BY_CLUES[log.cluesRevealed] ?? 25;
    const path = board?.path ?? [];
    const hudScore = log.status === "SOLVED" ? log.score : nextScore;

    return (
      <SpecialArena
        theme={theme}
        badge={badge}
        title={t("duel.special.starPathTitle")}
        subtitle={t("duel.special.starPathSub", {
          n: toLocaleDigits(log.cluesRevealed, locale),
        })}
        hudValue={hudScore}
        hudMax={100}
        hudHint={t("duel.special.scoreHint")}
        flash={flash}
        reduceMotion={Boolean(reduceMotion)}
        dock={
          <PlayerDock
            theme={theme}
            query={query}
            options={options}
            selectedId={selectedId}
            selectedLabel={selectedLabel}
            pending={pending || log.status !== "IN_PROGRESS"}
            pickHint={t("duel.special.pickHint")}
            submitLabel={t("duel.special.submitGuess")}
            onQuery={runSearch}
            onSelect={(id) => {
              setSelectedId(id);
              playSound("click");
              haptic(HAPTIC.tap);
            }}
            onSubmit={() => {
              if (!selectedId || pending) return;
              startTransition(async () => {
                const res = await guessDuelStarPath(duelId, selectedId);
                if (!res.ok) {
                  toast.error(t("duel.errGeneric"));
                  return;
                }
                setLocalDuel(res.duel);
                setQuery("");
                setSelectedId(null);
                setOptions([]);
                if (res.log.status === "SOLVED") {
                  playSound("goal");
                  haptic(HAPTIC.goal);
                  pulse("goal", t("duel.special.flashSolved"));
                } else if (res.log.status === "FAILED") {
                  playSound("miss");
                  haptic(HAPTIC.miss);
                  pulse("miss", t("duel.special.flashFailed"));
                } else {
                  playSound("miss");
                  haptic(HAPTIC.miss);
                  pulse("miss", t("duel.special.flashWrong"));
                }
                if (res.finished) {
                  window.setTimeout(
                    () => onDone(res.duel, res.missions),
                    650,
                  );
                }
              });
            }}
          />
        }
      >
        {/* Path timeline */}
        <ol className="relative mx-auto w-full max-w-sm space-y-0 px-1">
          <div
            aria-hidden
            className="absolute inset-s-[1.35rem] top-3 bottom-3 w-0.5 bg-linear-to-b from-amber-400/80 via-amber-400/25 to-white/10"
          />
          {path.map((step, i) => {
            const revealed = i < log.cluesRevealed;
            const current = i === log.cluesRevealed - 1 && log.status === "IN_PROGRESS";
            const locked = !revealed;
            return (
              <motion.li
                key={`${step.name}-${i}`}
                initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative flex items-stretch gap-3 py-1.5"
              >
                <span
                  className={[
                    "relative z-10 mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-black ring-2",
                    revealed
                      ? current
                        ? "bg-amber-400 text-amber-950 ring-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.55)]"
                        : "bg-emerald-500 text-white ring-emerald-300/50"
                      : "bg-white/10 text-white/35 ring-white/15",
                  ].join(" ")}
                >
                  {locked ? "?" : toLocaleDigits(i + 1, locale)}
                </span>
                <div
                  className={[
                    "min-h-13 flex-1 rounded-2xl border px-3.5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
                    revealed
                      ? current
                        ? "border-amber-300/60 bg-linear-to-br from-amber-400/25 to-orange-500/15"
                        : "border-white/15 bg-white/10"
                      : "border-dashed border-white/10 bg-white/3",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "font-display text-base font-black",
                      revealed ? "text-white" : "text-white/25",
                    ].join(" ")}
                  >
                    {revealed ? step.name : t("duel.special.clueLocked")}
                  </p>
                  {current && (
                    <p className="mt-0.5 font-body text-[11px] font-bold text-amber-200/90">
                      {t("duel.special.nextScore", {
                        n: toLocaleDigits(nextScore, locale),
                      })}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
          {/* Placeholder slots if path shorter than max */}
          {Array.from({ length: Math.max(0, maxClues - path.length) }).map(
            (_, i) => (
              <li
                key={`pad-${i}`}
                className="relative flex items-center gap-3 py-1.5 opacity-40"
              >
                <span className="h-7 w-7 rounded-full bg-white/10" />
                <div className="h-12 flex-1 rounded-2xl border border-dashed border-white/10" />
              </li>
            ),
          )}
        </ol>

        {log.guesses.length > 0 && (
          <div className="mx-auto mt-4 w-full max-w-sm space-y-1.5 px-1">
            <p className="px-1 font-display text-[10px] font-extrabold uppercase tracking-wider text-white/40">
              {t("duel.special.guessLog")}
            </p>
            {log.guesses.map((g) => (
              <div
                key={`${g.playerId}-${g.at}`}
                className={[
                  "rounded-xl px-3 py-2 font-display text-sm font-bold",
                  g.correct
                    ? "bg-emerald-500/25 text-emerald-100"
                    : "bg-white/8 text-white/70",
                ].join(" ")}
              >
                {g.playerId}
                {g.correct ? " ✓" : ""}
              </div>
            ))}
          </div>
        )}
      </SpecialArena>
    );
  }

  // ─── MYSTERY ─────────────────────────────────────────────────────────────
  if (round.roundType === "MYSTERY") {
    const board = parseMysteryBoard(round.boardJson);
    const log: MysteryHalfLog =
      parseMysteryHalfLog(answersRaw) ?? {
        guesses: [],
        status: "IN_PROGRESS",
        score: 0,
      };
    const max = board?.maxGuesses ?? 6;
    const used = log.guesses.length;
    const remaining = Math.max(0, max - used);
    const attrLabels = [
      t("mystery.colNation"),
      t("mystery.colPos"),
      t("mystery.colLeague"),
      t("mystery.colClub"),
      t("mystery.colAge"),
      t("mystery.colShirt"),
    ];

    return (
      <>
        <SpecialArena
          theme={theme}
          badge={badge}
          title={t("duel.special.mysteryTitle")}
          subtitle={t("duel.special.mysterySub", {
            n: toLocaleDigits(used, locale),
            max: toLocaleDigits(max, locale),
          })}
          hudValue={remaining}
          hudMax={max}
          hudHint={t("duel.special.guessesLeft")}
          flash={flash}
          reduceMotion={Boolean(reduceMotion)}
          onHelp={() => {
            playSound("click");
            haptic(HAPTIC.tap);
            setHelpOpen(true);
          }}
          helpAria={t("duel.special.mysteryHelpAria")}
          dock={
            <PlayerDock
              theme={theme}
              query={query}
              options={options}
              selectedId={selectedId}
              selectedLabel={selectedLabel}
              pending={pending || log.status !== "IN_PROGRESS"}
              pickHint={t("duel.special.pickHint")}
              submitLabel={t("duel.special.submitGuess")}
              onQuery={runSearch}
              onSelect={(id) => {
                setSelectedId(id);
                playSound("click");
                haptic(HAPTIC.tap);
              }}
              onSubmit={() => {
                if (!selectedId || pending) return;
                startTransition(async () => {
                  const res = await guessDuelMystery(duelId, selectedId);
                  if (!res.ok) {
                    toast.error(t("duel.errGeneric"));
                    return;
                  }
                  setLocalDuel(res.duel);
                  setQuery("");
                  setSelectedId(null);
                  setOptions([]);
                  if (res.log.status === "SOLVED") {
                    playSound("goal");
                    haptic(HAPTIC.goal);
                    pulse("goal", t("duel.special.flashSolved"));
                  } else if (res.log.status === "FAILED") {
                    playSound("miss");
                    haptic(HAPTIC.miss);
                    pulse("miss", t("duel.special.flashFailed"));
                  } else {
                    playSound("miss");
                    haptic(HAPTIC.miss);
                  }
                  if (res.finished) {
                    window.setTimeout(
                      () => onDone(res.duel, res.missions),
                      650,
                    );
                  }
                });
              }}
            />
          }
        >
          <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <ClueLegend swatch="bg-emerald-500" label={t("mystery.legendCorrect")} />
              <ClueLegend swatch="bg-amber-500" label={t("mystery.legendClose")} />
              <ClueLegend swatch="bg-rose-600" label={t("mystery.legendWrong")} />
              <ClueLegend swatch="bg-sky-500" label={`▲▼ ${t("mystery.colAge")}/${t("mystery.colShirt")}`} />
            </div>

            {used === 0 ? (
              <div className="rounded-2xl bg-amber-400/10 p-2 shadow-[0_0_0_1px_rgba(251,191,36,0.4),0_3px_0_0_rgba(0,0,0,0.25)]">
                <p className="mb-1.5 text-center font-display text-[11px] font-extrabold text-amber-100">
                  {t("mystery.emptyBoard")}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {attrLabels.map((label) => (
                    <div
                      key={label}
                      className="flex min-h-12 items-center justify-center rounded-xl bg-black/35 font-display text-[11px] font-extrabold text-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              [...log.guesses]
                .map((guess, i) => ({ guess, n: i + 1 }))
                .reverse()
                .map(({ guess, n }, i) => (
                  <MysteryGuessRow
                    key={`${guess.playerId}-${guess.at}`}
                    guess={guess}
                    index={n}
                    labels={attrLabels}
                    latest={i === 0}
                  />
                ))
            )}
          </div>
        </SpecialArena>

        <DuelSpecialHelpSheet
          mode="mystery"
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          tone="dark"
        />
      </>
    );
  }

  // ─── GRID ────────────────────────────────────────────────────────────────
  if (round.roundType === "GRID") {
    const board = parseGridBoard(round.boardJson);
    const log: GridHalfLog =
      parseGridHalfLog(answersRaw) ?? {
        cells: {},
        wrongGuesses: [],
        status: "IN_PROGRESS",
        score: 0,
      };
    const maxMistakes = board?.maxMistakes ?? 9;
    const mistakesLeft = Math.max(0, maxMistakes - log.wrongGuesses.length);

    return (
      <SpecialArena
        theme={theme}
        badge={badge}
        title={t("duel.special.gridTitle")}
        subtitle={t("duel.special.gridSub", {
          n: toLocaleDigits(log.score, locale),
          mistakes: toLocaleDigits(log.wrongGuesses.length, locale),
        })}
        hudValue={log.score}
        hudMax={9}
        hudHint={t("duel.special.cellsHint")}
        flash={flash}
        reduceMotion={Boolean(reduceMotion)}
        dock={
          selectedCell ? (
            <PlayerDock
              theme={theme}
              query={query}
              options={options}
              selectedId={selectedId}
              selectedLabel={selectedLabel}
              pending={pending || log.status !== "IN_PROGRESS"}
              pickHint={t("duel.special.gridPickHint")}
              submitLabel={t("duel.special.submitCell")}
              onQuery={runSearch}
              onSelect={(id) => {
                setSelectedId(id);
                playSound("click");
                haptic(HAPTIC.tap);
              }}
              onSubmit={() => {
                if (!selectedId || !selectedCell || pending) return;
                const cell = selectedCell;
                startTransition(async () => {
                  const res = await guessDuelGrid({
                    duelId,
                    playerId: selectedId,
                    row: cell.row,
                    col: cell.col,
                  });
                  if (!res.ok) {
                    toast.error(t("duel.errGeneric"));
                    return;
                  }
                  const prevScore = log.score;
                  setLocalDuel(res.duel);
                  setQuery("");
                  setSelectedId(null);
                  setOptions([]);
                  setSelectedCell(null);
                  if (res.log.score > prevScore) {
                    playSound("goal");
                    haptic(HAPTIC.goal);
                    pulse("goal", t("duel.special.flashCell"));
                  } else {
                    playSound("miss");
                    haptic(HAPTIC.miss);
                    pulse("miss", t("duel.special.flashWrong"));
                  }
                  if (res.finished) {
                    window.setTimeout(
                      () => onDone(res.duel, res.missions),
                      650,
                    );
                  }
                });
              }}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center">
              <p className="font-display text-sm font-bold text-white/70">
                {t("duel.special.gridTapCell")}
              </p>
              <p className="mt-1 font-body text-xs font-semibold text-white/40">
                {t("duel.special.mistakesLeft", {
                  n: toLocaleDigits(mistakesLeft, locale),
                })}
              </p>
            </div>
          )
        }
      >
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/12 bg-black/30 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `minmax(3.5rem,auto) repeat(${GRID_SIZE}, minmax(0,1fr))`,
            }}
          >
            <div />
            {(board?.cols ?? []).map((c) => (
              <div
                key={c.id}
                className="flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-1 text-center font-display text-[10px] font-extrabold leading-tight text-white/85"
              >
                {locale === "fa" ? c.labelFa : c.labelEn}
              </div>
            ))}
            {(board?.rows ?? []).map((r, ri) => (
              <div key={r.id} className="contents">
                <div className="flex min-h-17 items-center rounded-xl bg-white/10 px-1.5 font-display text-[10px] font-extrabold leading-tight text-white/85">
                  {locale === "fa" ? r.labelFa : r.labelEn}
                </div>
                {Array.from({ length: GRID_SIZE }, (_, ci) => {
                  const key = cellKey(ri, ci);
                  const filled = log.cells[key];
                  const selected =
                    selectedCell?.row === ri && selectedCell?.col === ci;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      disabled={pending || Boolean(filled) || log.status !== "IN_PROGRESS"}
                      whileTap={filled ? undefined : { scale: 0.96 }}
                      onClick={() => {
                        setSelectedCell({ row: ri, col: ci });
                        setSelectedId(null);
                        setQuery("");
                        setOptions([]);
                        playSound("click");
                        haptic(HAPTIC.tap);
                      }}
                      className={[
                        "relative flex min-h-17 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center transition-colors",
                        filled
                          ? "bg-linear-to-br from-emerald-500/35 to-teal-600/30 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.5),0_0_18px_rgba(52,211,153,0.25)]"
                          : selected
                            ? "bg-amber-400/25 text-white shadow-[0_0_0_1px_rgba(252,211,77,0.8)] ring-2 ring-amber-300/40"
                            : "bg-white/4 text-white/50 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-white/10",
                      ].join(" ")}
                    >
                      {filled ? (
                        <span className="font-display text-[11px] font-black leading-snug">
                          {locale === "fa" ? filled.nameFa : filled.nameEn}
                        </span>
                      ) : (
                        <span className="font-display text-2xl font-black text-white/30">
                          ＋
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Lives */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: maxMistakes }).map((_, i) => {
            const spent = i < log.wrongGuesses.length;
            return (
              <span
                key={i}
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  spent ? "bg-rose-500/80" : "bg-emerald-400/80",
                ].join(" ")}
              />
            );
          })}
        </div>
      </SpecialArena>
    );
  }

  return null;
}

// ─── Shared chrome ───────────────────────────────────────────────────────────

function SpecialArena({
  theme,
  badge,
  title,
  subtitle,
  hudValue,
  hudMax,
  hudHint,
  flash,
  reduceMotion,
  dock,
  children,
  onHelp,
  helpAria,
}: {
  theme: AttackTheme;
  badge: string;
  title: string;
  subtitle: string;
  hudValue: number;
  hudMax: number;
  hudHint: string;
  flash: Flash;
  reduceMotion: boolean;
  dock: React.ReactNode;
  children: React.ReactNode;
  onHelp?: () => void;
  helpAria?: string;
}) {
  const { locale } = useTranslation();
  const router = useRouter();
  const ringR = 30;
  const ringC = 2 * Math.PI * ringR;
  const pct = Math.min(1, hudValue / Math.max(1, hudMax));
  const ringOffset = ringC * (1 - pct);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-arena text-arena-fg">
      <MatchPitch stadiumLevel={0} />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 z-1 h-44 bg-linear-to-b ${theme.flood} to-transparent`}
      />

      <header className="relative z-10 mx-3 mt-[max(0.5rem,env(safe-area-inset-top))]">
        <GamePanel
          tone={theme.panelTone}
          className="bg-black/25 px-2.5 py-2"
        >
          <div className="relative flex items-center gap-2">
            <MatchLeaveControl
              onConfirmLeave={() => router.push("/play/duel")}
            />
            <div className="relative h-14 w-14 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={ringR}
                  fill="none"
                  strokeWidth="6"
                  className={theme.ringTrack}
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={ringR}
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={theme.ring}
                  strokeDasharray={ringC}
                  initial={{ strokeDashoffset: ringOffset }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/35">
                <span
                  className={`font-display text-lg font-black tabular-nums leading-none ${theme.score}`}
                >
                  {toLocaleDigits(hudValue, locale)}
                </span>
                <span className="font-display text-[9px] font-bold text-white/45">
                  /{toLocaleDigits(hudMax, locale)}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <GameChip
                tone={theme.panelTone === "amber" ? "amber" : "default"}
                className="gap-1 tracking-wide"
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-current"
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [1, 0.35, 1], scale: [1, 1.3, 1] }
                  }
                  transition={{ repeat: Infinity, duration: 1.1 }}
                />
                {badge}
              </GameChip>
              <h2 className="mt-1 font-display text-base font-black leading-tight text-white">
                {title}
              </h2>
              <p className="mt-0.5 font-body text-[11px] font-semibold text-white/55">
                {subtitle}
                <span className={`ms-1 font-display font-bold ${theme.accent}`}>
                  · {hudHint}
                </span>
              </p>
            </div>

            {onHelp ? (
              <button
                type="button"
                aria-label={helpAria}
                onClick={onHelp}
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
            ) : null}
          </div>
        </GamePanel>
      </header>

      <div className="relative z-10 mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
        {children}
      </div>

      <div className="relative z-20 shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {dock}
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.key}
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="pointer-events-none absolute inset-x-0 top-[28%] z-30 flex justify-center"
          >
            <span
              className={[
                "rounded-2xl px-5 py-2.5 font-display text-lg font-black shadow-2xl",
                flash.kind === "goal"
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-rose-500 text-white",
              ].join(" ")}
            >
              {flash.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PlayerDock({
  theme,
  query,
  options,
  selectedId,
  selectedLabel,
  pending,
  pickHint,
  submitLabel,
  onQuery,
  onSelect,
  onSubmit,
}: {
  theme: AttackTheme;
  query: string;
  options: MysteryPlayerOption[];
  selectedId: string | null;
  selectedLabel: string | null;
  pending: boolean;
  pickHint: string;
  submitLabel: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onSubmit: () => void;
}) {
  const { t, locale } = useTranslation();
  return (
    <GamePanel
      tone={theme.panelTone}
      className="bg-black/40 px-2.5 pb-2.5 pt-2 shadow-[0_-8px_28px_rgba(0,0,0,0.5)]"
    >
      <p className="relative mb-1.5 text-center font-display text-[11px] font-bold text-white/65">
        {selectedLabel ? `✓ ${selectedLabel}` : pickHint}
      </p>
      <input
        type="search"
        value={query}
        disabled={pending}
        onChange={(e) => void onQuery(e.target.value)}
        placeholder={t("mystery.searchPlaceholder")}
        className={cn(
          "game-input relative min-h-12 w-full px-3 font-display text-sm font-bold",
          theme.dockRing,
        )}
      />
      <ul className="relative mt-1.5 max-h-28 overflow-y-auto rounded-2xl bg-black/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
        {options.length === 0 ? (
          <li className="px-3 py-2.5 text-center font-display text-xs font-bold text-white/35">
            {query.trim().length < 2 ? t("duel.special.typeMore") : "…"}
          </li>
        ) : (
          options.map((o) => {
            const active = selectedId === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onSelect(o.id)}
                  className={cn(
                    "flex w-full min-h-12 items-center justify-between gap-2 px-3 py-2 text-start font-display text-sm font-bold",
                    active
                      ? "bg-amber-400/25 text-amber-50"
                      : "text-white/90 hover:bg-white/8",
                  )}
                >
                  <span className="truncate">
                    {locale === "fa" ? o.nameFa : o.nameEn}
                  </span>
                  <span className="shrink-0 text-[10px] font-extrabold text-white/40">
                    {o.club}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
      <GameCta
        variant={theme.panelTone === "amber" ? "accent" : "primary"}
        block
        disabled={pending || !selectedId}
        onClick={onSubmit}
        className="relative mt-2 min-h-12"
      >
        {pending ? "…" : submitLabel}
      </GameCta>
    </GamePanel>
  );
}

function ClueLegend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 font-display text-[10px] font-extrabold text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
      <span className={cn("h-2.5 w-2.5 rounded-sm", swatch)} />
      {label}
    </span>
  );
}

function verdictStyle(v: AttributeVerdict | CompareVerdict): string {
  if (v === "correct")
    return "bg-emerald-500 text-white ring-1 ring-emerald-300/40";
  if (v === "close")
    return "bg-amber-500 text-white ring-1 ring-amber-200/40";
  if (v === "higher" || v === "lower")
    return "bg-sky-500 text-white ring-1 ring-sky-300/40";
  return "bg-rose-600 text-white ring-1 ring-rose-300/35";
}

function verdictGlyph(v: AttributeVerdict | CompareVerdict): string {
  if (v === "correct") return "✓";
  if (v === "close") return "~";
  if (v === "higher") return "▲";
  if (v === "lower") return "▼";
  return "✕";
}

function MysteryGuessRow({
  guess,
  index,
  labels,
  latest,
}: {
  guess: MysteryGuessRecord;
  index: number;
  labels: string[];
  latest: boolean;
}) {
  const { locale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const name = locale === "fa" ? guess.nameFa : guess.nameEn;
  const cells: { key: string; v: AttributeVerdict | CompareVerdict; label: string }[] =
    [
      {
        key: "n",
        v: guess.nationality,
        label: guess.nationalityValue ?? "—",
      },
      {
        key: "p",
        v: guess.position,
        label: guess.positionValue ?? "—",
      },
      {
        key: "l",
        v: guess.league,
        label: guess.leagueValue ?? "—",
      },
      {
        key: "c",
        v: guess.club,
        label: guess.clubValue ?? "—",
      },
      {
        key: "a",
        v: guess.age,
        label:
          guess.ageValue != null ? String(guess.ageValue) : "—",
      },
      {
        key: "s",
        v: guess.shirtNumber,
        label:
          guess.shirtNumberValue != null
            ? String(guess.shirtNumberValue)
            : "—",
      },
    ];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "rounded-2xl p-1.5",
        latest
          ? "bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_3px_0_0_rgba(0,0,0,0.3)]"
          : "bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-black/40 px-1 font-display text-[10px] font-black tabular-nums text-white/60">
          {toLocaleDigits(index, locale)}
        </span>
        <p className="min-w-0 truncate font-display text-xs font-extrabold text-white/85">
          {name}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {cells.map((c, i) => (
          <motion.div
            key={c.key}
            initial={latest && !reduceMotion ? { rotateX: 90, opacity: 0 } : false}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ delay: latest ? 0.06 * i : 0, duration: 0.24 }}
            className={cn(
              "relative flex min-h-12 flex-col items-center justify-center rounded-xl px-1 pb-1 pt-3 shadow-[inset_0_-2px_0_rgba(0,0,0,0.28)]",
              verdictStyle(c.v),
            )}
          >
            <span className="absolute inset-x-1 top-0.5 truncate text-center font-display text-[9px] font-bold leading-tight opacity-80">
              {labels[i]}
            </span>
            <span className="flex max-w-full items-center gap-0.5 font-display text-[11px] font-extrabold leading-tight">
              <span aria-hidden className="shrink-0 text-[10px] font-black">
                {verdictGlyph(c.v)}
              </span>
              <span className="truncate">{c.label}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
