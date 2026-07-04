import { CITIES, HEART_TEAMS, identityLabel, isMeaningfulTeam } from "./playerIdentity";
import { arenaScore, clubValue, type LeaderboardPlayerInput } from "./leaderboards";

export type LeaderboardKind = "arena" | "club" | "city" | "fandom";

export interface CommunityLeaderboardInput extends LeaderboardPlayerInput {
  cityId?: string;
  heartTeamId?: string;
}

export interface CommunityLeaderboardRow {
  rank: number;
  id: string;
  name: string;
  emoji: string;
  points: number;
  members: number;
  you?: boolean;
}

const CITY_MOCK: Record<string, number> = {
  tehran: 48_200,
  isfahan: 31_400,
  mashhad: 28_600,
  shiraz: 24_100,
  tabriz: 22_800,
  ahvaz: 17_500,
  kerman: 14_200,
  rasht: 13_600,
  yazd: 11_900,
  other: 9_400,
};

const FANDOM_MOCK: Record<string, number> = {
  esteghlal: 42_500,
  persepolis: 46_800,
  sepahan: 27_300,
  tractor: 21_600,
  foolad: 18_900,
};

const CITY_MEMBERS: Record<string, number> = {
  tehran: 1280,
  isfahan: 740,
  mashhad: 690,
  shiraz: 520,
  tabriz: 480,
  ahvaz: 360,
  kerman: 290,
  rasht: 270,
  yazd: 240,
  other: 410,
};

const FANDOM_MEMBERS: Record<string, number> = {
  esteghlal: 980,
  persepolis: 1120,
  sepahan: 640,
  tractor: 510,
  foolad: 430,
};

export function buildCityLeaderboardRows(
  input: CommunityLeaderboardInput,
): CommunityLeaderboardRow[] {
  const playerBoost = Math.floor(arenaScore(input) * 0.18);

  const rows = CITIES.filter((c) => c.id !== "other").map((city) => {
    const base = CITY_MOCK[city.id] ?? 8_000;
    const you = input.cityId === city.id;
    return {
      id: city.id,
      name: city.label,
      emoji: city.emoji ?? "🏙️",
      points: base + (you ? playerBoost : 0),
      members: CITY_MEMBERS[city.id] ?? 200,
      you,
    };
  });

  return rows
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function buildFandomLeaderboardRows(
  input: CommunityLeaderboardInput,
): CommunityLeaderboardRow[] {
  const playerBoost = Math.floor(clubValue(input) * 0.12);

  const rows = HEART_TEAMS.filter((t) => t.id !== "none_iran").map((team) => {
    const base = FANDOM_MOCK[team.id] ?? 12_000;
    const you = input.heartTeamId === team.id;
    return {
      id: team.id,
      name: team.label,
      emoji: team.emoji ?? "⚽",
      points: base + (you ? playerBoost : 0),
      members: FANDOM_MEMBERS[team.id] ?? 300,
      you,
    };
  });

  return rows
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function isCommunityLeaderboard(
  kind: LeaderboardKind,
): kind is "city" | "fandom" {
  return kind === "city" || kind === "fandom";
}

export function leaderboardPointsLabel(kind: LeaderboardKind): string {
  if (kind === "arena") return "امتیاز Arena";
  if (kind === "club") return "ارزش باشگاه";
  if (kind === "city") return "امتیاز شهر";
  return "قدرت تیم";
}

export function leaderboardTitle(kind: LeaderboardKind): string {
  if (kind === "arena") return "جدول کوییز هفتگی";
  if (kind === "club") return "جدول باشگاه فصلی";
  if (kind === "city") return "جدول شهرها";
  return "جدول تیم‌های محبوب";
}

export function leaderboardSubtitle(kind: LeaderboardKind): string {
  if (kind === "arena") {
    return "رتبه بر اساس skill، برد، رکورد و streak — بدون مزیت اقتصادی باشگاه.";
  }
  if (kind === "club") {
    return "رتبه بر اساس ارزش باشگاه، هوادار، خزانه و صعود فصل.";
  }
  if (kind === "city") {
    return "رقابت شهری بر اساس فعالیت Arena بازیکنان همان شهر — فقط prestige.";
  }
  return "رقابت هواداری بر اساس پیشرفت باشگاه طرفداران هر تیم.";
}

export function communityIdentityLabel(
  kind: "city" | "fandom",
  cityId?: string,
  heartTeamId?: string,
): string | null {
  if (kind === "city") {
    return identityLabel(cityId, CITIES);
  }
  return isMeaningfulTeam(heartTeamId)
    ? identityLabel(heartTeamId, HEART_TEAMS)
    : null;
}
