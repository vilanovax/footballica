import { currentDivisionLabel } from "./promotion";

export type LeaderboardKind = "arena" | "club";

export interface LeaderboardPlayerInput {
  xp: number;
  totalCorrect: number;
  matchesWon: number;
  bombBest: number;
  survivalBest: number;
  streakDays: number;
  fans: number;
  budget: number;
  vaultLevel: number;
  seasonStep: number;
  clubName: string;
}

export interface LeaderboardRowData {
  rank: number;
  name: string;
  short: string;
  points: number;
  color: string;
  you?: boolean;
  sublabel?: string;
}

/** امتیاز رقابتی — skill و فعالیت در مودها */
export function arenaScore(input: LeaderboardPlayerInput): number {
  return (
    input.xp +
    input.totalCorrect * 8 +
    input.matchesWon * 60 +
    input.bombBest * 12 +
    input.survivalBest * 10 +
    input.streakDays * 25
  );
}

/** ارزش باشگاه — پیشرفت کریر و اقتصاد */
export function clubValue(input: LeaderboardPlayerInput): number {
  const safeBudget = Number.isFinite(input.budget) ? input.budget : 0;
  return (
    input.fans * 12 +
    input.vaultLevel * 800 +
    input.seasonStep * 2_500 +
    Math.floor(safeBudget / 50_000)
  );
}

const ARENA_MOCK_BASE = [5200, 4880, 4510, 0, 3920, 3610, 3280, 3010, 2740, 2480];
const CLUB_MOCK_BASE = [18_400, 16_900, 15_200, 0, 12_600, 11_100, 9_800, 8_700, 7_500, 6_400];

const MOCK_NAMES = [
  "سینا کریمی",
  "زهرا رضایی",
  "مهدی احمدی",
  "",
  "علی نوری",
  "نگار صادقی",
  "رضا حریف",
  "سارا محمدی",
  "کیان رستمی",
  "لیلا کاظمی",
];

const MOCK_SHORTS = ["س.ک", "ز.ر", "م.ا", "تو", "ع.ن", "ن.ص", "ر.ح", "س.م", "ک.ر", "ل.ک"];
const MOCK_COLORS = ["foe", "#8b3fe0", "#e08a2f", "you", "foe", "#2f9e5f", "foe", "#8b3fe0", "#2f9e5f", "foe"];

export function buildLeaderboardRows(
  kind: LeaderboardKind,
  input: LeaderboardPlayerInput,
): LeaderboardRowData[] {
  const youPoints = kind === "arena" ? arenaScore(input) : clubValue(input);
  const mockBase = kind === "arena" ? ARENA_MOCK_BASE : CLUB_MOCK_BASE;
  const youIndex = 3;

  const rows = MOCK_SHORTS.map((short, i) => ({
    name: i === youIndex ? input.clubName : MOCK_NAMES[i]!,
    short,
    points: i === youIndex ? youPoints : mockBase[i]!,
    color: MOCK_COLORS[i]!,
    you: i === youIndex,
    sublabel:
      i === youIndex && kind === "club"
        ? currentDivisionLabel(input.seasonStep)
        : undefined,
  }));

  return rows
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function leaderboardPointsLabel(kind: LeaderboardKind): string {
  return kind === "arena" ? "امتیاز Arena" : "ارزش باشگاه";
}

export function leaderboardTitle(kind: LeaderboardKind): string {
  return kind === "arena" ? "جدول کوییز هفتگی" : "جدول باشگاه فصلی";
}

export function leaderboardSubtitle(kind: LeaderboardKind): string {
  return kind === "arena"
    ? "رتبه بر اساس skill، برد، رکورد و streak — بدون مزیت اقتصادی باشگاه."
    : "رتبه بر اساس ارزش باشگاه، هوادار، خزانه و صعود فصل.";
}
