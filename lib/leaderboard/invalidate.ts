import "server-only";

import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { LEADERBOARD_CACHE_TAG } from "@/lib/leaderboard/cacheTags";

/**
 * Next forbids `revalidateTag` during RSC render. Opportunistic duel ticks
 * (getMyDuels / getDuel) run in that context, so always schedule after the
 * response. Falls back to a sync bust when there is no request (`after` throws).
 */
export function revalidateTagAfterRender(tag: string): void {
  const bust = () => revalidateTag(tag, "max");
  try {
    after(bust);
  } catch {
    bust();
  }
}

/** Bust shared Top-N standings after weeklyXp changes (stale-while-revalidate). */
export function invalidateLeaderboardCache(): void {
  revalidateTagAfterRender(LEADERBOARD_CACHE_TAG);
}
