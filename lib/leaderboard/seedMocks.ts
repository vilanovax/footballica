import { prisma } from "@/lib/prisma";
import { normalizeClubName } from "@/lib/auth/blacklist";
import type { AvatarKey } from "@/lib/onboarding/avatars";

export const MIN_USERS_FOR_UI = 10;
export const SEED_COUNT = 14;

const AVATAR_KEYS: AvatarKey[] = [
  "TACTICAL_COACH",
  "YOUNG_DIRECTOR",
  "VETERAN_FAN",
  "GOALKEEPER_LEGEND",
  "SUPER_FAN",
  "CLUB_LEGEND",
  "OLD_GAFFER",
  "STAR_MANAGER",
  "COSMIC_COACH",
];

/** Unique clean club labels for cold-start seed (no timestamp clutter). */
const MOCK_CLUBS = [
  "Night Lions",
  "Blue Falcons",
  "Iron Rovers",
  "Golden Titans",
  "Swift Wanderers",
  "Royal Kings",
  "Cosmic Comets",
  "Shadow Wolves",
  "Emerald United",
  "Crimson Dynamo",
  "Silver Athletic",
  "Phoenix Sporting",
  "Thunder Inter",
  "Oasis Real",
  "Harbor Galaxy",
  "Desert Strikers",
] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Insert mock weekly scorers so the leaderboard UI has a pack to chase. */
export async function seedMockLeaderboardUsers(
  count: number = SEED_COUNT,
): Promise<number> {
  const stamp = Date.now();
  const n = Math.min(count, MOCK_CLUBS.length);
  const rows = Array.from({ length: n }).map((_, i) => {
    const avatar = AVATAR_KEYS[i % AVATAR_KEYS.length]!;
    const clubName = MOCK_CLUBS[i]!;
    return {
      email: `mock_${stamp}_${i}@footballica.local`,
      displayName: clubName,
      avatar,
      weeklyXp: randomInt(50, 2000),
      matchesPlayed: randomInt(1, 20),
      nameNormalized: normalizeClubName(`${clubName} seed ${stamp} ${i}`),
    };
  });

  await prisma.$transaction(
    rows.map((r) =>
      prisma.user.create({
        data: {
          email: r.email,
          displayName: r.displayName,
          managerAvatar: r.avatar,
          weeklyXp: r.weeklyXp,
          xp: r.weeklyXp,
          club: {
            create: {
              name: r.displayName,
              nameNormalized: r.nameNormalized,
              avatar: r.avatar,
              matchesPlayed: r.matchesPlayed,
            },
          },
        },
      }),
    ),
  );

  return n;
}

/**
 * If fewer than `MIN_USERS_FOR_UI` humans have weeklyXp, seed mocks.
 * Returns true when seed ran (caller should invalidate standings cache).
 */
export async function ensureMockLeaderboardIfSparse(): Promise<boolean> {
  const activeCount = await prisma.user.count({
    where: { isBot: false, weeklyXp: { gt: 0 } },
  });
  if (activeCount >= MIN_USERS_FOR_UI) return false;
  await seedMockLeaderboardUsers(SEED_COUNT);
  return true;
}
