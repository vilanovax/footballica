/**
 * Server-authoritative special offer for a duel attack turn.
 * Client-safe (no Prisma) so snapshot + DraftPicker share the same pick.
 *
 * Player chooses Special vs Quiz — never which of N specials.
 */

import type { LiveModeId } from "@/lib/game/economy";
import { LIVE_MODE_IDS } from "@/lib/game/liveModes";

/** FNV-1a 32-bit — stable across JS runtimes for the same string. */
export function hashDuelSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Exactly one special from the admin-enabled duel pool for this turn.
 * Empty pool → null. Single mode → that mode. Else deterministic from duelId+round.
 */
export function offeredSpecialForTurn(
  duelId: string,
  roundNumber: number,
  enabled: LiveModeId[],
): LiveModeId | null {
  // Stable order regardless of caller array order
  const pool = LIVE_MODE_IDS.filter((id) => enabled.includes(id));
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0]!;
  const h = hashDuelSeed(`${duelId}:${roundNumber}`);
  return pool[h % pool.length]!;
}
