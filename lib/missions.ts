/**
 * ماموریت‌ها و افتخارات — فاز A.
 * ماموریت: هدایت + retention | اچیومنت: کلکسیون بلندمدت
 */
import { ECONOMY, type ActivityReward } from "./economy";
import { VAULT_MAX } from "./vault";
import { todayKey } from "./player";

export type MissionKind = "onboarding" | "daily" | "achievement";

export interface MissionDef {
  id: string;
  kind: MissionKind;
  emoji: string;
  title: string;
  detail: string;
  target: number;
  reward: ActivityReward;
  /** کلید progress در dailyProgress یا stat سراسری */
  progressKey?: string;
}

export interface MissionSnapshot {
  gamesPlayed: number;
  totalCorrect: number;
  unitCollectCount: number;
  vaultFillCount: number;
  matchesWon: number;
  streakDays: number;
  bombBest: number;
  fans: number;
  setupDone: boolean;
  shopLevel: number;
  hiredCount: number;
  assignedCount: number;
  vaultLevel: number;
  dailyProgress: Record<string, number>;
  dailyDate: string;
  claimed: Record<string, boolean>;
}

export const ONBOARDING_MISSIONS: MissionDef[] = [
  {
    id: "ob_first_quiz",
    kind: "onboarding",
    emoji: "⚽",
    title: "اولین کوییز",
    detail: "یک بازی (سریع یا مود دیگر) انجام بده",
    target: 1,
    reward: { xp: 100, fans: 0, vaultMoney: 0, cards: 0 },
    progressKey: "gamesPlayed",
  },
  {
    id: "ob_correct_3",
    kind: "onboarding",
    emoji: "🧠",
    title: "۳ جواب درست",
    detail: "در مجموع ۳ سؤال را درست جواب بده",
    target: 3,
    reward: { xp: 50, fans: 0, vaultMoney: 1_000_000, cards: 0 },
    progressKey: "totalCorrect",
  },
  {
    id: "ob_first_collect",
    kind: "onboarding",
    emoji: "🏪",
    title: "اولین درآمد باشگاهت",
    detail: "درآمد فروشگاه را به خزانه بفرست",
    target: 1,
    reward: { xp: 50, fans: 0, vaultMoney: 500_000, cards: 0 },
    progressKey: "unitCollectCount",
  },
  {
    id: "ob_shop_lv2",
    kind: "onboarding",
    emoji: "📈",
    title: "فروشگاه لول ۲",
    detail: "فروشگاه باشگاه را به سطح ۲ برسان",
    target: 2,
    reward: { xp: 150, fans: 0, vaultMoney: 0, cards: 0 },
    progressKey: "shopLevel",
  },
  {
    id: "ob_hire_manager",
    kind: "onboarding",
    emoji: "👔",
    title: "اولین مدیر باشگاه",
    detail: "اولین مدیر را استخدام کن",
    target: 1,
    reward: { xp: 80, fans: 0, vaultMoney: 0, cards: 1 },
    progressKey: "hiredCount",
  },
  {
    id: "ob_assign_manager",
    kind: "onboarding",
    emoji: "📋",
    title: "اولین مدیرت را منصوب کن",
    detail: "مدیر را روی یکی از واحدهای باشگاه بگذار",
    target: 1,
    reward: { xp: 60, fans: 20, vaultMoney: 0, cards: 0 },
    progressKey: "assignedCount",
  },
];

export const DAILY_MISSION_IDS = [
  "daily_play",
  "daily_correct_5",
  "daily_collect_2",
] as const;

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: "daily_play",
    kind: "daily",
    emoji: "🎮",
    title: "امروز یک بازی بزن",
    detail: "هر مود — کوییز، پنالتی، بمب…",
    target: 1,
    reward: { xp: 40, fans: 0, vaultMoney: 0, cards: 0 },
    progressKey: "daily_play",
  },
  {
    id: "daily_correct_5",
    kind: "daily",
    emoji: "✅",
    title: "۵ جواب درست",
    detail: "امروز ۵ سؤال درست جواب بده",
    target: 5,
    reward: { xp: 60, fans: 10, vaultMoney: 500_000, cards: 0 },
    progressKey: "daily_correct",
  },
  {
    id: "daily_collect_2",
    kind: "daily",
    emoji: "💰",
    title: "۲ بار درآمد باشگاه را جمع کن",
    detail: "دو بار درآمد یکی از واحدهای باشگاه را جمع کن",
    target: 2,
    reward: { xp: 50, fans: 0, vaultMoney: 1_000_000, cards: 0 },
    progressKey: "daily_collect",
  },
];

export const ACHIEVEMENT_MISSIONS: MissionDef[] = [
  {
    id: "ach_owner",
    kind: "achievement",
    emoji: "🏟️",
    title: "مالک باشگاه تازه‌تأسیس",
    detail: "باشگاهت را ساختی",
    target: 1,
    reward: { xp: 30, fans: 0, vaultMoney: 0, cards: 0 },
    progressKey: "setupDone",
  },
  {
    id: "ach_100_correct",
    kind: "achievement",
    emoji: "⚽",
    title: "متخصص کوییز",
    detail: "۱۰۰ جواب درست در مجموع",
    target: 100,
    reward: { xp: 200, fans: 50, vaultMoney: 2_000_000, cards: 1 },
    progressKey: "totalCorrect",
  },
  {
    id: "ach_streak_3",
    kind: "achievement",
    emoji: "🔥",
    title: "استریک ۳ روز",
    detail: "۳ روز پشت‌سرهم بازی کن",
    target: 3,
    reward: { xp: 100, fans: 0, vaultMoney: 0, cards: 2 },
    progressKey: "streakDays",
  },
  {
    id: "ach_promotion",
    kind: "achievement",
    emoji: "🏆",
    title: "صعود به دستهٔ دو",
    detail: `${ECONOMY.promotion.fansNeeded[1]!.toLocaleString("fa-IR")} هوادار`,
    target: ECONOMY.promotion.fansNeeded[1]!,
    reward: { xp: 300, fans: 0, vaultMoney: 5_000_000, cards: 0 },
    progressKey: "fans",
  },
  {
    id: "ach_bomb_20",
    kind: "achievement",
    emoji: "💣",
    title: "بمب‌اسلحه",
    detail: "رکورد ۲۰ در حالت بمب",
    target: 20,
    reward: { xp: 150, fans: 0, vaultMoney: 0, cards: 1 },
    progressKey: "bombBest",
  },
  {
    id: "ach_10_wins",
    kind: "achievement",
    emoji: "⚔️",
    title: "بازیکن باتجربه",
    detail: "۱۰ برد در مسابقات",
    target: 10,
    reward: { xp: 250, fans: 100, vaultMoney: 0, cards: 0 },
    progressKey: "matchesWon",
  },
  {
    id: "ach_vault_max",
    kind: "achievement",
    emoji: "🏦",
    title: "خزانه‌دار",
    detail: "گاوصندوق را به بانک اسپانسر برسان",
    target: VAULT_MAX,
    reward: { xp: 500, fans: 0, vaultMoney: 10_000_000, cards: 2 },
    progressKey: "vaultLevel",
  },
  {
    id: "ach_5_managers",
    kind: "achievement",
    emoji: "👥",
    title: "مدیر بزرگ",
    detail: "۵ مدیر استخدام کن",
    target: 5,
    reward: { xp: 400, fans: 200, vaultMoney: 0, cards: 1 },
    progressKey: "hiredCount",
  },
];

export const ALL_MISSIONS: MissionDef[] = [
  ...ONBOARDING_MISSIONS,
  ...DAILY_MISSIONS,
  ...ACHIEVEMENT_MISSIONS,
];

export function missionById(id: string): MissionDef | undefined {
  return ALL_MISSIONS.find((m) => m.id === id);
}

function statValue(snap: MissionSnapshot, key: string): number {
  switch (key) {
    case "gamesPlayed":
      return snap.gamesPlayed;
    case "totalCorrect":
      return snap.totalCorrect;
    case "unitCollectCount":
      return snap.unitCollectCount;
    case "vaultFillCount":
      return snap.vaultFillCount;
    case "shopLevel":
      return snap.shopLevel;
    case "hiredCount":
      return snap.hiredCount;
    case "assignedCount":
      return snap.assignedCount;
    case "matchesWon":
      return snap.matchesWon;
    case "streakDays":
      return snap.streakDays;
    case "bombBest":
      return snap.bombBest;
    case "fans":
      return snap.fans;
    case "vaultLevel":
      return snap.vaultLevel;
    case "setupDone":
      return snap.setupDone ? 1 : 0;
    default:
      if (key.startsWith("daily_")) {
        return snap.dailyDate === todayKey() ? (snap.dailyProgress[key] ?? 0) : 0;
      }
      return 0;
  }
}

export interface MissionStatus {
  def: MissionDef;
  progress: number;
  complete: boolean;
  claimed: boolean;
  claimable: boolean;
  pct: number;
}

export function missionStatus(def: MissionDef, snap: MissionSnapshot): MissionStatus {
  const key = def.progressKey ?? def.id;
  const progress = Math.min(def.target, statValue(snap, key));
  const complete = progress >= def.target;
  const claimed = Boolean(snap.claimed[def.id]);
  return {
    def,
    progress,
    complete,
    claimed,
    claimable: complete && !claimed,
    pct: def.target > 0 ? Math.min(100, (progress / def.target) * 100) : 0,
  };
}

export function buildMissionSnapshot(state: {
  gamesPlayed: number;
  totalCorrect: number;
  unitCollectCount: number;
  vaultFillCount: number;
  matchesWon: number;
  streakDays: number;
  bombBest: number;
  fans: number;
  setupDone: boolean;
  units: Record<string, { level: number }>;
  hired: Record<string, boolean>;
  assign: Record<string, string | null>;
  vaultLevel: number;
  dailyProgress: Record<string, number>;
  dailyDate: string;
  missionClaimed: Record<string, boolean>;
}): MissionSnapshot {
  const hiredCount = Object.values(state.hired).filter(Boolean).length;
  const assignedCount = Object.values(state.assign).filter(Boolean).length;
  return {
    gamesPlayed: state.gamesPlayed,
    totalCorrect: state.totalCorrect,
    unitCollectCount: state.unitCollectCount,
    vaultFillCount: state.vaultFillCount,
    matchesWon: state.matchesWon,
    streakDays: state.streakDays,
    bombBest: state.bombBest,
    fans: state.fans,
    setupDone: state.setupDone,
    shopLevel: state.units.shop?.level ?? 1,
    hiredCount,
    assignedCount,
    vaultLevel: state.vaultLevel,
    dailyProgress: state.dailyProgress,
    dailyDate: state.dailyDate,
    claimed: state.missionClaimed,
  };
}

export function allMissionStatuses(snap: MissionSnapshot): MissionStatus[] {
  return ALL_MISSIONS.map((d) => missionStatus(d, snap));
}

export function claimableMissionCount(snap: MissionSnapshot): number {
  return allMissionStatuses(snap).filter((s) => s.claimable).length;
}

export function firstClaimableMission(snap: MissionSnapshot): MissionStatus | null {
  return allMissionStatuses(snap).find((s) => s.claimable) ?? null;
}

export type MissionNavTarget = "games" | "club";

/** مقصد CTA برای مأموریت‌های روزانه */
export function dailyMissionNavTarget(id: string): MissionNavTarget {
  return id === "daily_collect_2" ? "club" : "games";
}

export function dailyMissionCtaLabel(id: string): string {
  return id === "daily_collect_2" ? "رفتن به باشگاه" : "رفتن به بازی";
}

export function rewardLabel(reward: ActivityReward): string {
  const parts: string[] = [];
  if (reward.xp > 0) parts.push(`${reward.xp} XP`);
  if (reward.fans > 0) parts.push(`${reward.fans} هوادار`);
  if (reward.vaultMoney > 0) parts.push("پول");
  if (reward.cards > 0) parts.push(`${reward.cards} 🃏`);
  return parts.join(" · ") || "—";
}

export function ensureDailyDate(dailyDate: string): string {
  const today = todayKey();
  return dailyDate === today ? dailyDate : today;
}
