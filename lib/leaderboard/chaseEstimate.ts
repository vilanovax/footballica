import { DEFAULT_GAME_CONFIG } from "@/lib/game/economy";

/** Soft cap so the chase copy never reads like a marathon mockery. */
export const CHASE_WINS_DISPLAY_CAP = 50;

/**
 * Rough duel-win count to close a weekly-XP gap.
 * Prefers the player's own XP/match rate when they have games; otherwise
 * falls back to the Live-Ops default `duel.winWeeklyXp`.
 */
export function estimateWinsToCloseGap(
  gap: number,
  opts?: {
    weeklyXp?: number;
    matchesPlayed?: number;
    /** Override default duel weekly XP grant (tests / Live-Ops preview). */
    xpPerWin?: number;
  },
): number | null {
  if (!Number.isFinite(gap) || gap <= 0) return 0;

  const fallback = Math.max(
    1,
    opts?.xpPerWin ?? DEFAULT_GAME_CONFIG.duel.winWeeklyXp,
  );
  const matches = opts?.matchesPlayed ?? 0;
  const xp = opts?.weeklyXp ?? 0;
  const personal = matches > 0 && xp > 0 ? xp / matches : 0;
  // Floor at 1 so a cold streak can't explode the estimate.
  const rate = Math.max(1, personal > 0 ? personal : fallback);
  const wins = Math.ceil(gap / rate);
  if (!Number.isFinite(wins) || wins < 1) return 1;
  return Math.min(CHASE_WINS_DISPLAY_CAP, wins);
}
