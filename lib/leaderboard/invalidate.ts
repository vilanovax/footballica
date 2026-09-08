import "server-only";

import { revalidateTag } from "next/cache";
import { LEADERBOARD_CACHE_TAG } from "@/lib/leaderboard/cacheTags";

/** Bust shared Top-N standings after weeklyXp changes (stale-while-revalidate). */
export function invalidateLeaderboardCache(): void {
  revalidateTag(LEADERBOARD_CACHE_TAG, "max");
}
