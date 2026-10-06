"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin/auth";
import { getGameConfig } from "@/lib/game/gameConfig";
import {
  liveModesFromConfig,
  type LiveModePlacement,
} from "@/lib/game/liveModes";
import type { GameConfig } from "@/lib/game/economy";
import { loadGridPlayers } from "@/lib/grid/puzzle";
import { computeGridSolvability } from "@/lib/grid/solvability";
import { GRID_SIZE, type GridAxis } from "@/lib/grid/types";
import { buildTikiTakaAxes } from "@/lib/duel/tikiTakaAxes";

export type AdminTikiAxis = {
  id: string;
  labelEn: string;
  labelFa: string;
  kind: string;
  value: string;
};

export type AdminTikiPreview = {
  rows: AdminTikiAxis[];
  cols: AdminTikiAxis[];
  source: "auto" | "fallback";
  solvable: boolean;
  emptyCells: number;
  /** Cells with 1–2 matches — playable but fragile. */
  thinCells: number;
  /** Lowest match count across the 9 cells. */
  minCount: number;
  /** Length 9, row-major cell match counts. */
  cellCounts: number[];
  sampleSlugs: string[][];
};

export type AdminTikiTakaSnapshot = {
  activePlayerPoolCount: number;
  placement: LiveModePlacement;
  duelKnobs: { tikiTakaTurnMs: number };
  /** TIKI_TAKA DuelRounds created in the last 7 days. */
  recentTikiDuelRounds: number;
  preview: AdminTikiPreview | null;
  config: GameConfig;
};

function serializeAxis(axis: GridAxis): AdminTikiAxis {
  return {
    id: axis.id,
    labelEn: axis.labelEn,
    labelFa: axis.labelFa,
    kind: axis.rule.kind,
    value: axis.rule.value,
  };
}

async function assertAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

async function buildPreview(): Promise<{
  preview: AdminTikiPreview;
  activePlayerPoolCount: number;
}> {
  const players = await loadGridPlayers(prisma);
  const { rows, cols, source } = buildTikiTakaAxes(players);
  const solv = computeGridSolvability(rows, cols, players);
  const cellCounts = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
    const cell = solv.cells[i];
    return cell?.count ?? 0;
  });
  const sampleSlugs = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
    const cell = solv.cells[i];
    return cell?.sampleSlugs ?? [];
  });
  const thinCells = cellCounts.filter((n) => n > 0 && n < 3).length;
  const minCount = cellCounts.length
    ? Math.min(...cellCounts)
    : 0;

  return {
    activePlayerPoolCount: players.length,
    preview: {
      rows: rows.map(serializeAxis),
      cols: cols.map(serializeAxis),
      source,
      solvable: solv.solvable,
      emptyCells: solv.emptyCells,
      thinCells,
      minCount,
      cellCounts,
      sampleSlugs,
    },
  };
}

export async function getAdminTikiTakaSnapshot(): Promise<AdminTikiTakaSnapshot> {
  const config = await getGameConfig();
  const empty: AdminTikiTakaSnapshot = {
    activePlayerPoolCount: 0,
    placement: { duel: false, gotd: false },
    duelKnobs: { tikiTakaTurnMs: config.duel.tikiTakaTurnMs },
    recentTikiDuelRounds: 0,
    preview: null,
    config,
  };

  if (!(await assertAdmin())) return empty;

  const placement = liveModesFromConfig(config).tikiTaka;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [recentTikiDuelRounds, built] = await Promise.all([
    prisma.duelRound.count({
      where: {
        roundType: "TIKI_TAKA",
        createdAt: { gte: weekAgo },
      },
    }),
    buildPreview(),
  ]);

  return {
    activePlayerPoolCount: built.activePlayerPoolCount,
    placement,
    duelKnobs: { tikiTakaTurnMs: config.duel.tikiTakaTurnMs },
    recentTikiDuelRounds,
    preview: built.preview,
    config,
  };
}

/** Re-run the same axis builder duel specials use. */
export async function refreshAdminTikiTakaPreview(): Promise<
  | { ok: true; preview: AdminTikiPreview; activePlayerPoolCount: number }
  | { ok: false; error: string }
> {
  if (!(await assertAdmin())) {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    const built = await buildPreview();
    return {
      ok: true,
      preview: built.preview,
      activePlayerPoolCount: built.activePlayerPoolCount,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Preview failed",
    };
  }
}
