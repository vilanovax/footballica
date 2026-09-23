/** Shared Next.js cache tags for weekly league data. */
export const LEADERBOARD_CACHE_TAG = "leaderboard";
export const HALL_OF_FAME_CACHE_TAG = "hall-of-fame";

/** Standings stay fresh enough for a chase screen without hammering Postgres. */
export const LEADERBOARD_REVALIDATE_SECONDS = 45;

/** Visible weekly standings window (Top-N) for chase UI. */
export const LEADERBOARD_TOP_N = 50;

/** HoF archives change only on weekly reset — longer TTL is fine. */
export const HALL_OF_FAME_REVALIDATE_SECONDS = 120;
