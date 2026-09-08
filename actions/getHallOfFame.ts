"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isAvatarKey, type AvatarKey } from "@/lib/onboarding/avatars";
import {
  HALL_OF_FAME_CACHE_TAG,
  HALL_OF_FAME_REVALIDATE_SECONDS,
} from "@/lib/leaderboard/cacheTags";

export type HallOfFameEntry = {
  id: string;
  tehranWeekKey: string;
  rank: number;
  xp: number;
  userId: string;
  clubName: string;
  avatarKey: AvatarKey;
  isCurrentUser: boolean;
};

export type HallOfFameWeek = {
  tehranWeekKey: string;
  entries: HallOfFameEntry[];
};

type CachedHofEntry = Omit<HallOfFameEntry, "isCurrentUser">;

type CachedHofWeek = {
  tehranWeekKey: string;
  entries: CachedHofEntry[];
};

function toAvatarKey(raw: string | null | undefined): AvatarKey {
  return raw && isAvatarKey(raw) ? raw : "TACTICAL_COACH";
}

async function loadHallOfFameWeeks(limitWeeks: number): Promise<CachedHofWeek[]> {
  const rows = await prisma.hallOfFame.findMany({
    orderBy: [{ tehranWeekKey: "desc" }, { rank: "asc" }],
    take: limitWeeks * 3,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          managerAvatar: true,
          club: { select: { name: true, avatar: true } },
        },
      },
    },
  });

  const byWeek = new Map<string, CachedHofEntry[]>();
  for (const row of rows) {
    const entry: CachedHofEntry = {
      id: row.id,
      tehranWeekKey: row.tehranWeekKey,
      rank: row.rank,
      xp: row.xp,
      userId: row.userId,
      clubName: row.user.club?.name ?? row.user.displayName ?? "Unknown Club",
      avatarKey: toAvatarKey(row.user.club?.avatar ?? row.user.managerAvatar),
    };
    const list = byWeek.get(row.tehranWeekKey) ?? [];
    list.push(entry);
    byWeek.set(row.tehranWeekKey, list);
  }

  return [...byWeek.entries()].map(([tehranWeekKey, entries]) => ({
    tehranWeekKey,
    entries: entries.sort((a, b) => a.rank - b.rank),
  }));
}

const getCachedHallOfFame = unstable_cache(
  loadHallOfFameWeeks,
  ["hall-of-fame-v1"],
  {
    revalidate: HALL_OF_FAME_REVALIDATE_SECONDS,
    tags: [HALL_OF_FAME_CACHE_TAG],
  },
);

/**
 * Archived weekly podiums — newest weeks first, ranks 1→3 within each week.
 * Shared archive is cached; `isCurrentUser` is stamped per session.
 */
export async function getHallOfFame(
  limitWeeks = 12,
): Promise<HallOfFameWeek[]> {
  const [sessionId, weeks] = await Promise.all([
    getSessionUserId(),
    getCachedHallOfFame(limitWeeks),
  ]);

  return weeks.map((week) => ({
    tehranWeekKey: week.tehranWeekKey,
    entries: week.entries.map((entry) => ({
      ...entry,
      isCurrentUser: sessionId === entry.userId,
    })),
  }));
}
