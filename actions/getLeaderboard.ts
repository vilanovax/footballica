"use server";

import { after } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { isAvatarKey, type AvatarKey } from "@/lib/onboarding/avatars";
import {
  ensureWeeklyLeagueReset,
  tehranWeekDaysRemaining,
} from "@/lib/game/weeklyLeague";
import { displayClubName } from "@/lib/leaderboard/displayName";
import {
  LEADERBOARD_CACHE_TAG,
  LEADERBOARD_REVALIDATE_SECONDS,
  LEADERBOARD_TOP_N,
} from "@/lib/leaderboard/cacheTags";
import {
  ensureMockLeaderboardIfSparse,
  MIN_USERS_FOR_UI,
} from "@/lib/leaderboard/seedMocks";

const TOP_N = LEADERBOARD_TOP_N;

export type LeaderboardPlayState = "scored" | "playedZero" | "unplayed";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  clubName: string;
  avatarKey: AvatarKey;
  weeklyXp: number;
  matchesPlayed: number;
  playState: LeaderboardPlayState;
  isCurrentUser: boolean;
};

export type LeaderboardPayload = {
  rows: LeaderboardRow[];
  /** Tehran week days until Monday reset (1–7). */
  resetsInDays: number;
  /** Current user's row even when outside Top N (for sticky bar). */
  currentUserRow: LeaderboardRow | null;
};

/** Shared standings without per-viewer flags (safe to cache across sessions). */
type CachedStandingRow = Omit<LeaderboardRow, "isCurrentUser">;

type CachedStandings = {
  rows: CachedStandingRow[];
  resetsInDays: number;
};

const LEADERBOARD_SELECT = {
  id: true,
  displayName: true,
  managerAvatar: true,
  weeklyXp: true,
  club: {
    select: {
      name: true,
      avatar: true,
      matchesPlayed: true,
      lastPlayedDate: true,
    },
  },
} as const;

/** Same order as `compareActiveUsers` — used for Top-N SQL take. */
const ACTIVE_ORDER_BY = [
  { weeklyXp: "desc" as const },
  { club: { matchesPlayed: "asc" as const } },
  { id: "asc" as const },
];

function toAvatarKey(value: string | null): AvatarKey {
  return value && isAvatarKey(value) ? value : "TACTICAL_COACH";
}

type RawUser = {
  id: string;
  displayName: string | null;
  managerAvatar: string | null;
  weeklyXp: number;
  club: {
    name: string;
    avatar: string | null;
    matchesPlayed: number;
    lastPlayedDate: Date | null;
  } | null;
};

function playStateOf(u: RawUser): LeaderboardPlayState {
  const matches = u.club?.matchesPlayed ?? 0;
  const playedSignal = matches > 0 || u.club?.lastPlayedDate != null;
  if (u.weeklyXp > 0) return "scored";
  if (playedSignal) return "playedZero";
  return "unplayed";
}

/**
 * Rank order for weekly-active players (weeklyXp > 0):
 * XP desc, then fewer matchesPlayed (efficiency), then stable id.
 */
function compareActiveUsers(a: RawUser, b: RawUser): number {
  if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
  const ma = a.club?.matchesPlayed ?? 0;
  const mb = b.club?.matchesPlayed ?? 0;
  if (ma !== mb) return ma - mb;
  return a.id.localeCompare(b.id);
}

function toCachedRow(u: RawUser, rank: number): CachedStandingRow {
  return {
    rank,
    userId: u.id,
    clubName: displayClubName(u.club?.name ?? u.displayName ?? "Unknown Club"),
    avatarKey: toAvatarKey(u.club?.avatar ?? u.managerAvatar),
    weeklyXp: u.weeklyXp,
    matchesPlayed: u.club?.matchesPlayed ?? 0,
    playState: playStateOf(u),
  };
}

function stampViewer(
  row: CachedStandingRow,
  currentUserId: string | null,
): LeaderboardRow {
  return {
    ...row,
    isCurrentUser: currentUserId !== null && currentUserId === row.userId,
  };
}

/**
 * How many active scorers rank strictly above `me` (same rules as
 * `compareActiveUsers`). Used only when the sticky user is outside Top N.
 */
async function countRanksAbove(me: RawUser): Promise<number> {
  const matches = me.club?.matchesPlayed ?? 0;
  return prisma.user.count({
    where: {
      isBot: false,
      weeklyXp: { gt: 0 },
      OR: [
        { weeklyXp: { gt: me.weeklyXp } },
        {
          weeklyXp: me.weeklyXp,
          club: { matchesPlayed: { lt: matches } },
        },
        {
          weeklyXp: me.weeklyXp,
          club: { matchesPlayed: matches },
          id: { lt: me.id },
        },
        ...(matches > 0
          ? [
              {
                weeklyXp: me.weeklyXp,
                club: { is: null },
              } as const,
            ]
          : [
              {
                weeklyXp: me.weeklyXp,
                club: { is: null },
                id: { lt: me.id },
              } as const,
            ]),
      ],
    },
  });
}

async function loadTopStandings(): Promise<CachedStandings> {
  const top = (await prisma.user.findMany({
    where: { isBot: false, weeklyXp: { gt: 0 } },
    select: LEADERBOARD_SELECT,
    orderBy: ACTIVE_ORDER_BY,
    take: TOP_N,
  })) as RawUser[];

  top.sort(compareActiveUsers);

  return {
    resetsInDays: tehranWeekDaysRemaining(),
    rows: top.map((u, index) => toCachedRow(u, index + 1)),
  };
}

const getCachedTopStandings = unstable_cache(
  loadTopStandings,
  ["leaderboard-top-v1"],
  {
    revalidate: LEADERBOARD_REVALIDATE_SECONDS,
    tags: [LEADERBOARD_CACHE_TAG],
  },
);

/**
 * Weekly league standings: humans with weeklyXp > 0 only (Top 50).
 * Shared Top-N is cached ~45s; viewer flags + sticky row stay per-request.
 */
export async function getLeaderboard(): Promise<LeaderboardPayload> {
  try {
    await ensureWeeklyLeagueReset();
  } catch (err) {
    console.error("ensureWeeklyLeagueReset in getLeaderboard", err);
  }

  const currentUserId = await getSessionUserId();
  let standings = await getCachedTopStandings();

  // Cold board: never block prod reads; await only in local/dev for DX.
  if (standings.rows.length < MIN_USERS_FOR_UI) {
    if (process.env.NODE_ENV === "development") {
      try {
        await ensureMockLeaderboardIfSparse();
        standings = await loadTopStandings();
      } catch (err) {
        console.error("ensureMockLeaderboardIfSparse", err);
      }
    } else {
      after(() => {
        void ensureMockLeaderboardIfSparse()
          .then((seeded) => {
            if (seeded) revalidateTag(LEADERBOARD_CACHE_TAG, "max");
          })
          .catch((err) => console.error("ensureMockLeaderboardIfSparse", err));
      });
    }
  }

  return assembleLeaderboard(standings, currentUserId);
}

/**
 * Bust Top-N cache and return a live board (bypasses unstable_cache for this hit).
 */
export async function refreshLeaderboard(): Promise<LeaderboardPayload> {
  revalidateTag(LEADERBOARD_CACHE_TAG, "max");
  try {
    await ensureWeeklyLeagueReset();
  } catch (err) {
    console.error("ensureWeeklyLeagueReset in refreshLeaderboard", err);
  }
  const currentUserId = await getSessionUserId();
  const standings = await loadTopStandings();
  return assembleLeaderboard(standings, currentUserId);
}

async function assembleLeaderboard(
  standings: CachedStandings,
  currentUserId: string | null,
): Promise<LeaderboardPayload> {
  const rows = standings.rows.map((r) => stampViewer(r, currentUserId));

  let currentUserRow: LeaderboardRow | null =
    rows.find((r) => r.isCurrentUser) ?? null;

  if (!currentUserRow && currentUserId) {
    const me = (await prisma.user.findUnique({
      where: { id: currentUserId },
      select: LEADERBOARD_SELECT,
    })) as RawUser | null;

    if (me) {
      let rank = 0;
      if (me.weeklyXp > 0) {
        rank = (await countRanksAbove(me)) + 1;
      }
      currentUserRow = stampViewer(toCachedRow(me, rank), currentUserId);
    }
  }

  return {
    resetsInDays: standings.resetsInDays,
    rows,
    currentUserRow,
  };
}
