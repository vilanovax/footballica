"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DailyMysterySnapshot } from "@/actions/mystery/getDailyMystery";
import type { DailyGridSnapshot } from "@/actions/grid/getDailyGrid";
import type { DailyStarPathSnapshot } from "@/actions/starpath/getDailyStarPath";
import type { DailyMemorySnapshot } from "@/actions/memorygotd/getDailyMemory";
import {
  gameOfTheDayKind,
  gameOfTheDayRotation,
  type GameOfTheDayKind,
} from "@/lib/grid/gotd";
import {
  DEFAULT_GAME_CONFIG,
  type GameConfig,
} from "@/lib/game/economy";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";

type Props = {
  mystery: DailyMysterySnapshot | null;
  grid?: DailyGridSnapshot | null;
  starPath?: DailyStarPathSnapshot | null;
  memory?: DailyMemorySnapshot | null;
  /** Live GameConfig — drives GotD rotator + enabled modes. */
  config?: GameConfig;
  /** ISO timestamp — next Tehran midnight (GotD rotate). */
  rotatesAt?: string | null;
};

/**
 * Rotating Live-Ops slot — Mystery / Grid / Star Path / Memory.
 * Hidden when admin disabled every GotD mode (kind === null).
 */
export function GameOfTheDayCard({
  mystery,
  grid = null,
  starPath = null,
  memory = null,
  config = DEFAULT_GAME_CONFIG,
  rotatesAt = null,
}: Props) {
  const dateKey =
    memory?.dateKey ??
    starPath?.dateKey ??
    grid?.dateKey ??
    mystery?.dateKey ??
    "";
  const kind = gameOfTheDayKind(dateKey || "2026-01-01", config);
  const rotateIso =
    rotatesAt ?? gameOfTheDayRotation(new Date(), config).rotatesAt.toISOString();

  if (kind === null) return null;

  if (kind === "memory" && memory) {
    return <MemoryGotdCard memory={memory} rotatesAt={rotateIso} />;
  }
  if (kind === "starPath" && starPath) {
    return <StarPathGotdCard starPath={starPath} rotatesAt={rotateIso} />;
  }
  if (kind === "grid" && grid) {
    return <GridGotdCard grid={grid} rotatesAt={rotateIso} />;
  }
  if (kind === "mystery" && mystery) {
    return <MysteryGotdCard mystery={mystery} rotatesAt={rotateIso} />;
  }
  // Preferred snapshot missing — no fallback across kinds (admin may have
  // only one mode enabled; wrong card would be misleading).
  return null;
}

function MysteryGotdCard({
  mystery,
  rotatesAt,
}: {
  mystery: DailyMysterySnapshot;
  rotatesAt: string;
}) {
  const { t, locale } = useTranslation();
  const done = mystery.status === "SOLVED" || mystery.status === "FAILED";
  const started = mystery.guessCount > 0;

  const blurb = done
    ? t("play.mysteryBlurbDone", {
        n: toLocaleDigits(mystery.mysteryStreak, locale),
      })
    : t("play.mysteryBlurb", {
        n: toLocaleDigits(mystery.maxGuesses, locale),
      });

  const cta = done
    ? t("play.mysteryCtaResult")
    : started
      ? t("play.mysteryCtaContinue")
      : t("play.mysteryCta");

  return (
    <GotdShell
      kind="mystery"
      icon="/icons/mystery.png"
      title={t("play.mysteryTitle")}
      blurb={blurb}
      meta={
        done
          ? t("mystery.streak", {
              n: toLocaleDigits(mystery.mysteryStreak, locale),
            })
          : t("mystery.guessesLeft", {
              cur: toLocaleDigits(mystery.guessCount, locale),
              max: toLocaleDigits(mystery.maxGuesses, locale),
            })
      }
      href="/play/mystery"
      cta={cta}
      rotatesAt={rotatesAt}
    />
  );
}

function StarPathGotdCard({
  starPath,
  rotatesAt,
}: {
  starPath: DailyStarPathSnapshot;
  rotatesAt: string;
}) {
  const { t, locale } = useTranslation();
  const done =
    starPath.status === "SOLVED" || starPath.status === "FAILED";
  const started =
    starPath.guesses.length > 0 || starPath.cluesRevealed > 1;

  const blurb = done
    ? t("play.starPathBlurbDone", {
        n: toLocaleDigits(starPath.starPathStreak, locale),
      })
    : t("play.starPathBlurb", {
        n: toLocaleDigits(starPath.maxClues, locale),
      });

  const cta = done
    ? t("play.starPathCtaResult")
    : started
      ? t("play.starPathCtaContinue")
      : t("play.starPathCta");

  return (
    <GotdShell
      kind="starPath"
      icon="/icons/streak.png"
      title={t("play.starPathTitle")}
      blurb={blurb}
      meta={
        done
          ? `${t("starPath.scoreLabel")} ${toLocaleDigits(starPath.score, locale)} · ${t("gotd.streakNow", {
              n: toLocaleDigits(starPath.starPathStreak, locale),
            })}`
          : t("starPath.pathLabel", {
              n: toLocaleDigits(starPath.cluesRevealed, locale),
              max: toLocaleDigits(starPath.maxClues, locale),
            })
      }
      href="/play/star-path"
      cta={cta}
      rotatesAt={rotatesAt}
    />
  );
}

function GridGotdCard({
  grid,
  rotatesAt,
}: {
  grid: DailyGridSnapshot;
  rotatesAt: string;
}) {
  const { t, locale } = useTranslation();
  const done = grid.status === "SOLVED" || grid.status === "FAILED";
  const started = grid.filled > 0 || grid.mistakeCount > 0;

  const blurb = done
    ? t("play.gridBlurbDone", {
        n: toLocaleDigits(grid.gridStreak, locale),
      })
    : t("play.gridBlurb", {
        n: toLocaleDigits(grid.maxMistakes, locale),
      });

  const cta = done
    ? t("play.gridCtaResult")
    : started
      ? t("play.gridCtaContinue")
      : t("play.gridCta");

  return (
    <GotdShell
      kind="grid"
      icon="/icons/guesses.png"
      title={t("play.gridTitle")}
      blurb={blurb}
      meta={`${toLocaleDigits(grid.filled, locale)}/${toLocaleDigits(grid.totalCells, locale)} · ${t("gotd.streakNow", {
        n: toLocaleDigits(grid.gridStreak, locale),
      })}`}
      href="/play/grid"
      cta={cta}
      rotatesAt={rotatesAt}
    />
  );
}

function MemoryGotdCard({
  memory,
  rotatesAt,
}: {
  memory: DailyMemorySnapshot;
  rotatesAt: string;
}) {
  const { t, locale } = useTranslation();
  const done = memory.status === "SOLVED" || memory.status === "FAILED";
  const started = memory.status !== "IN_PROGRESS" || memory.pairsFound > 0;

  const blurb = done
    ? t("play.memoryBlurbDone", {
        n: toLocaleDigits(memory.memoryStreak, locale),
      })
    : t("play.memoryBlurb", {
        n: toLocaleDigits(memory.pairCount, locale),
        s: toLocaleDigits(Math.round(memory.turnMs / 1000), locale),
      });

  const cta = done
    ? t("play.memoryCtaResult")
    : started && memory.pairsFound > 0
      ? t("play.memoryCtaContinue")
      : t("play.memoryCta");

  return (
    <GotdShell
      kind="memory"
      icon="/icons/memory-ball.png"
      title={t("play.memoryTitle")}
      blurb={blurb}
      meta={
        done
          ? `${toLocaleDigits(memory.pairsFound, locale)}/${toLocaleDigits(memory.pairCount, locale)} · ${t("memoryGotd.streak", {
              n: toLocaleDigits(memory.memoryStreak, locale),
            })}`
          : t("memoryGotd.pairsMeta", {
              n: toLocaleDigits(memory.pairCount, locale),
            })
      }
      href="/play/memory"
      cta={cta}
      rotatesAt={rotatesAt}
    />
  );
}

function GotdShell({
  kind,
  icon,
  title,
  blurb,
  meta,
  href,
  cta,
  rotatesAt,
}: {
  kind: GameOfTheDayKind;
  icon: string;
  title: string;
  blurb: string;
  meta: string;
  href: string;
  cta: string;
  rotatesAt: string;
}) {
  const { t } = useTranslation();
  const countdown = useGotdCountdown(rotatesAt);

  const kindLabel =
    kind === "mystery"
      ? t("play.gotdKindMystery")
      : kind === "grid"
        ? t("play.gotdKindGrid")
        : kind === "memory"
          ? t("play.gotdKindMemory")
          : t("play.gotdKindStarPath");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="font-display text-xs font-black text-arena-muted">
          {t("play.gameOfTheDay")}
        </h2>
        <GameChip tone="amber" className="text-[10px]">
          {kindLabel}
        </GameChip>
      </div>

      <GamePanel tone="amber" className="p-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-8 -top-10 h-36 w-36 rounded-full bg-amber-300/25 blur-3xl"
        />

        <div className="relative flex items-start gap-3">
          <GameIconWell
            size="lg"
            amber
            src={icon}
            className="h-14 w-14"
            iconClassName="h-10 w-10"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-black leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
              {title}
            </p>
            <p className="mt-1 font-display text-sm font-bold text-white/70">
              {blurb}
            </p>
            <p className="mt-1.5 font-display text-[11px] font-black text-amber-200">
              {meta}
            </p>
          </div>
        </div>

        <GameTile className="relative mt-3 flex items-center justify-center gap-1.5 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/timer.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-4 w-4 object-contain opacity-90"
          />
          <span className="font-display text-xs font-extrabold tabular-nums text-white/80">
            {t("play.gotdRotatesIn", { time: countdown })}
          </span>
        </GameTile>

        <Link
          href={href}
          onClick={() => playSound("click")}
          className="game-cta game-cta-accent relative mt-3 w-full text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
        >
          {cta}
        </Link>
      </GamePanel>
    </div>
  );
}

function useGotdCountdown(rotatesAtIso: string): string {
  const { locale } = useTranslation();
  const [msLeft, setMsLeft] = useState(() =>
    Math.max(0, new Date(rotatesAtIso).getTime() - Date.now()),
  );

  useEffect(() => {
    const target = new Date(rotatesAtIso).getTime();
    const tick = () => setMsLeft(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [rotatesAtIso]);

  return formatCountdown(msLeft, locale);
}

function formatCountdown(ms: number, locale: Locale): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => toLocaleDigits(String(n).padStart(2, "0"), locale);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
