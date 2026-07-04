import { currentDivisionLabel } from "./promotion";

export type PlayerLeaderboardKind = "arena" | "club" | "fairplay";

export interface LeaderboardPlayerInput {
  xp: number;
  totalCorrect: number;
  matchesWon: number;
  bombBest: number;
  survivalBest: number;
  streakDays: number;
  arenaRating: number;
  rankedWins: number;
  rankedLosses: number;
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

export interface FairPlayScoreInput {
  arenaRating: number;
  rankedWins: number;
  rankedLosses: number;
}

/** امتیاز Fair Play — فقط دوئل رنکد، بدون پاورآپ و بدون مودهای casual */
export function fairPlayScore(input: FairPlayScoreInput): number {
  const total = input.rankedWins + input.rankedLosses;
  const winRateBonus = total > 0 ? Math.round((input.rankedWins / total) * 120) : 0;
  return input.arenaRating + input.rankedWins * 12 + winRateBonus;
}

/** امتیاز رقابتی — skill و فعالیت در مودها */
export function arenaScore(input: LeaderboardPlayerInput): number {
  return (
    input.arenaRating +
    input.xp * 0.35 +
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
const FAIRPLAY_MOCK_BASE = [1480, 1410, 1365, 0, 1290, 1245, 1190, 1145, 1105, 1060];

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
  kind: PlayerLeaderboardKind,
  input: LeaderboardPlayerInput,
): LeaderboardRowData[] {
  const youPoints =
    kind === "arena"
      ? arenaScore(input)
      : kind === "fairplay"
        ? fairPlayScore(input)
        : clubValue(input);
  const mockBase =
    kind === "arena"
      ? ARENA_MOCK_BASE
      : kind === "fairplay"
        ? FAIRPLAY_MOCK_BASE
        : CLUB_MOCK_BASE;
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
