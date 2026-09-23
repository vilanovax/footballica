import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GAME_CONFIG,
  mergeGameConfig,
  type GameConfig,
} from "@/lib/game/economy";

/** Fixed id of the singleton config row. */
export const GAME_CONFIG_ID = "global";

/** Bust via `revalidateTag` when admin saves config. */
export const GAME_CONFIG_CACHE_TAG = "game-config";

/** Cross-request TTL — config rarely changes outside admin. */
const GAME_CONFIG_REVALIDATE_SECONDS = 60;

async function loadGameConfigFromDb(): Promise<GameConfig> {
  const row = await prisma.gameConfig
    .findUnique({ where: { id: GAME_CONFIG_ID } })
    .catch(() => null);
  return row ? mergeGameConfig(row.config) : { ...DEFAULT_GAME_CONFIG };
}

const getCachedGameConfig = unstable_cache(
  loadGameConfigFromDb,
  ["game-config-v1"],
  {
    revalidate: GAME_CONFIG_REVALIDATE_SECONDS,
    tags: [GAME_CONFIG_CACHE_TAG],
  },
);

/**
 * Read the effective game config: the DB singleton merged over the defaults.
 * Never throws on a missing/partial row — falls back to `DEFAULT_GAME_CONFIG`.
 * React.cache dedupes within one RSC request; unstable_cache shares across
 * requests for ~60s (invalidated on admin save).
 */
export const getGameConfig = cache(async (): Promise<GameConfig> => {
  return getCachedGameConfig();
});
