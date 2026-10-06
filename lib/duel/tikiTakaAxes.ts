import "server-only";

import { buildAutoGridAxes } from "@/lib/grid/puzzle";
import { makeAxis } from "@/lib/grid/rules";
import type { GridAxis } from "@/lib/grid/types";
import type { GridPlayerAttrs } from "@/lib/grid/rules";

type PlayerRow = GridPlayerAttrs & { slug: string };

function topValues(values: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([v]) => v);
}

/**
 * Same axis builder duel specials use at round create time.
 * Prefers solvable Immortal-style auto axes; falls back to league×position.
 */
export function buildTikiTakaAxes(players: PlayerRow[]): {
  rows: GridAxis[];
  cols: GridAxis[];
  source: "auto" | "fallback";
} {
  const built = buildAutoGridAxes(players);
  if (built) {
    return { rows: built.rows, cols: built.cols, source: "auto" };
  }

  const leagues = topValues(
    players.map((p) => p.league),
    3,
  );
  while (leagues.length < 3) leagues.push(`League ${leagues.length + 1}`);

  return {
    rows: leagues.slice(0, 3).map((v, i) => makeAxis(`r${i}`, "league", v)),
    cols: ["FWD", "MID", "DEF"].map((v, i) =>
      makeAxis(`c${i}`, "position", v),
    ),
    source: "fallback",
  };
}
