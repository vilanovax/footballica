/**
 * ماموریت‌ها و افتخارات — فاز A.
 * ماموریت: هدایت + retention | اچیومنت: کلکسیون بلندمدت
 */
import { ECONOMY, type ActivityReward } from "./economy";
import { VAULT_MAX } from "./vault";
import { todayKey } from "./player";

export type MissionKind = "onboarding" | "daily" | "season" | "achievement";

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
  /** فقط برای kind === "season" */
  seasonStep?: number;
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
  foodLevel: number;
  parkingLevel: number;
  ticketsLevel: number;
  academyLevel: number;
  sponsorLevel: number;
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
    title: "اولین بازی برای باشگاه",
    detail: "برای روشن شدن موتور باشگاه، اولین بازی را شروع کن",
    target: 1,
    reward: { xp: 100, fans: 0, vaultMoney: 0, cards: 0 },
    progressKey: "gamesPlayed",
  },
  {
    id: "ob_correct_3",
    kind: "onboarding",
    emoji: "🧠",
    title: "۳ جواب درست برای شروع",
    detail: "ثابت کن مالک باشگاه از فوتبال سر در می‌آورد",
    target: 3,
    reward: { xp: 50, fans: 0, vaultMoney: 1_000_000, cards: 0 },
    progressKey: "totalCorrect",
  },
  {
    id: "ob_first_collect",
    kind: "onboarding",
    emoji: "🏪",
    title: "اولین دخل باشگاه",
    detail: "درآمد فروشگاه را به خزانه بفرست تا پول قابل خرج داشته باشی",
    target: 1,
    reward: { xp: 50, fans: 0, vaultMoney: 500_000, cards: 0 },
    progressKey: "unitCollectCount",
  },
  {
    id: "ob_shop_lv2",
    kind: "onboarding",
    emoji: "📈",
    title: "فروشگاه را جان بده",
    detail: "فروشگاه باشگاه را به سطح ۲ برسان تا درآمد پایدار بگیرد",
    target: 2,
    reward: { xp: 150, fans: 0, vaultMoney: 0, cards: 0 },
    progressKey: "shopLevel",
  },
  {
    id: "ob_hire_manager",
    kind: "onboarding",
    emoji: "👔",
    title: "اولین مدیر را بگیر",
    detail: "برای حرفه‌ای شدن چرخهٔ درآمد، اولین مدیر را استخدام کن",
    target: 1,
    reward: { xp: 80, fans: 0, vaultMoney: 0, cards: 1 },
    progressKey: "hiredCount",
  },
  {
    id: "ob_assign_manager",
    kind: "onboarding",
    emoji: "📋",
    title: "مدیر را وارد زمین کن",
    detail: "مدیر را روی یکی از ساختمان‌ها بگذار تا باشگاه منظم‌تر پول بسازد",
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

export const SEASON_MISSIONS: MissionDef[] = [
  {
    id: "s1_vault_lv2",
    kind: "season",
    seasonStep: 1,
    emoji: "🔐",
    title: "خزانهٔ پایدار",
    detail: "خزانه را به سطح ۲ برسان تا رشد فروشگاه خفه نشود",
    target: 2,
    reward: { xp: 80, fans: 0, vaultMoney: 1_000_000, cards: 0 },
    progressKey: "vaultLevel",
  },
  {
    id: "s1_collect_5",
    kind: "season",
    seasonStep: 1,
    emoji: "💰",
    title: "چرخهٔ درآمد را ببند",
    detail: "۵ بار درآمد واحدهای باشگاه را جمع کن",
    target: 5,
    reward: { xp: 60, fans: 10, vaultMoney: 500_000, cards: 0 },
    progressKey: "unitCollectCount",
  },
  {
    id: "s1_wins_3",
    kind: "season",
    seasonStep: 1,
    emoji: "⚽",
    title: "۳ برد برای صعود",
    detail: "در مسابقات ۳ برد بگیر تا باشگاه برای دستهٔ دو آماده شود",
    target: 3,
    reward: { xp: 100, fans: 30, vaultMoney: 0, cards: 0 },
    progressKey: "matchesWon",
  },
  {
    id: "s1_fans_300",
    kind: "season",
    seasonStep: 1,
    emoji: "📣",
    title: "۳۰۰ هوادار اول",
    detail: "با بازی و برد، محبوبیت باشگاه را به ۳۰۰ نفر برسان",
    target: 300,
    reward: { xp: 120, fans: 50, vaultMoney: 0, cards: 1 },
    progressKey: "fans",
  },
  {
    id: "s2_food_lv2",
    kind: "season",
    seasonStep: 2,
    emoji: "🌭",
    title: "غرفهٔ روز مسابقه",
    detail: "غرفهٔ خوراکی را به سطح ۲ برسان تا پول سریع روز بازی از دست نرود",
    target: 2,
    reward: { xp: 90, fans: 0, vaultMoney: 1_500_000, cards: 0 },
    progressKey: "foodLevel",
  },
  {
    id: "s2_parking_lv2",
    kind: "season",
    seasonStep: 2,
    emoji: "🅿️",
    title: "پارکینگ پایدار",
    detail: "پارکینگ را به سطح ۲ برسان — پول خدماتی روز مسابقه",
    target: 2,
    reward: { xp: 90, fans: 0, vaultMoney: 1_500_000, cards: 0 },
    progressKey: "parkingLevel",
  },
  {
    id: "s2_vault_lv3",
    kind: "season",
    seasonStep: 2,
    emoji: "🔐",
    title: "خزانهٔ روز مسابقه",
    detail: "وقتی بلیت و خوراکی فعال‌اند، خزانه باید به سطح ۳ برسد",
    target: 3,
    reward: { xp: 120, fans: 0, vaultMoney: 2_000_000, cards: 0 },
    progressKey: "vaultLevel",
  },
  {
    id: "s2_wins_10",
    kind: "season",
    seasonStep: 2,
    emoji: "⚔️",
    title: "۱۰ برد در دسته دو",
    detail: "با چند برد دیگر جایگاه باشگاه در دستهٔ دو را تثبیت کن",
    target: 10,
    reward: { xp: 150, fans: 50, vaultMoney: 0, cards: 0 },
    progressKey: "matchesWon",
  },
  {
    id: "s2_fans_1000",
    kind: "season",
    seasonStep: 2,
    emoji: "🏟️",
    title: "هزار هوادار",
    detail: "وقتی جمعیت بیشتر بیاید، اقتصاد روز مسابقه واقعاً پول‌ساز می‌شود",
    target: 1000,
    reward: { xp: 180, fans: 80, vaultMoney: 0, cards: 1 },
    progressKey: "fans",
  },
  {
    id: "s3_academy_lv2",
    kind: "season",
    seasonStep: 3,
    emoji: "🎓",
    title: "آکادمی فعال",
    detail: "آکادمی را به سطح ۲ برسان تا آیندهٔ باشگاه شروع شود",
    target: 2,
    reward: { xp: 120, fans: 0, vaultMoney: 2_500_000, cards: 0 },
    progressKey: "academyLevel",
  },
  {
    id: "s3_sponsor_lv2",
    kind: "season",
    seasonStep: 3,
    emoji: "🤝",
    title: "قرارداد بزرگ",
    detail: "اسپانسر پیراهن را به سطح ۲ برسان تا برند باشگاه جدی‌تر شود",
    target: 2,
    reward: { xp: 120, fans: 0, vaultMoney: 3_000_000, cards: 0 },
    progressKey: "sponsorLevel",
  },
  {
    id: "s3_tickets_lv3",
    kind: "season",
    seasonStep: 3,
    emoji: "🎟️",
    title: "گیشهٔ بزرگ",
    detail: "بلیت‌فروشی را به سطح ۳ برسان تا جمعیت بیشتر را پوشش بدهد",
    target: 3,
    reward: { xp: 140, fans: 0, vaultMoney: 2_000_000, cards: 0 },
    progressKey: "ticketsLevel",
  },
  {
    id: "s3_vault_lv4",
    kind: "season",
    seasonStep: 3,
    emoji: "🏦",
    title: "خزانهٔ برند",
    detail: "برای قراردادهای بزرگ، خزانه را به سطح ۴ برسان",
    target: 4,
    reward: { xp: 160, fans: 0, vaultMoney: 4_000_000, cards: 1 },
    progressKey: "vaultLevel",
  },
  {
    id: "s3_wins_20",
    kind: "season",
    seasonStep: 3,
    emoji: "🏆",
    title: "۲۰ برد در دسته یک",
    detail: "اعتبار باشگاه در دستهٔ یک را با ۲۰ برد در زمین ثابت کن",
    target: 20,
    reward: { xp: 200, fans: 100, vaultMoney: 0, cards: 0 },
    progressKey: "matchesWon",
  },
  {
    id: "s4_vault_lv5",
    kind: "season",
    seasonStep: 4,
    emoji: "🏦",
    title: "بانک اسپانسر",
    detail: "خزانه را به سطح ۵ برسان — بدون سقف، برای امپراتوری پایدار",
    target: 5,
    reward: { xp: 200, fans: 0, vaultMoney: 5_000_000, cards: 1 },
    progressKey: "vaultLevel",
  },
  {
    id: "s4_sponsor_lv3",
    kind: "season",
    seasonStep: 4,
    emoji: "🤝",
    title: "قرارداد پایدار",
    detail: "اسپانسر را به سطح ۳ برسان تا درآمد بلندمدت ثابت شود",
    target: 3,
    reward: { xp: 180, fans: 0, vaultMoney: 4_000_000, cards: 0 },
    progressKey: "sponsorLevel",
  },
  {
    id: "s4_academy_lv3",
    kind: "season",
    seasonStep: 4,
    emoji: "🎓",
    title: "موتور آینده",
    detail: "آکادمی را به سطح ۳ برسان — آینده‌سازی واقعی باشگاه",
    target: 3,
    reward: { xp: 180, fans: 0, vaultMoney: 3_000_000, cards: 0 },
    progressKey: "academyLevel",
  },
  {
    id: "s4_managers_3",
    kind: "season",
    seasonStep: 4,
    emoji: "👥",
    title: "تیم مدیریت",
    detail: "۳ مدیر استخدام کن تا چرخهٔ درآمد بدون توقف بماند",
    target: 3,
    reward: { xp: 160, fans: 0, vaultMoney: 0, cards: 1 },
    progressKey: "hiredCount",
  },
  {
    id: "s4_wins_35",
    kind: "season",
    seasonStep: 4,
    emoji: "👑",
    title: "۳۵ برد حرفه‌ای",
    detail: "برای تثبیت در لیگ حرفه‌ای به ۳۵ برد در بلندمدت نیاز داریم",
    target: 35,
    reward: { xp: 250, fans: 150, vaultMoney: 0, cards: 1 },
    progressKey: "matchesWon",
  },
  {
    id: "s4_fans_5000",
    kind: "season",
    seasonStep: 4,
    emoji: "🌍",
    title: "امپراتوری هوادار",
    detail: "۵۰۰۰ هوادار — وقتی برند، اسپانسر و خزانه واقعاً به هم وصل می‌شوند",
    target: 5000,
    reward: { xp: 300, fans: 200, vaultMoney: 0, cards: 2 },
    progressKey: "fans",
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
  ...SEASON_MISSIONS,
  ...ACHIEVEMENT_MISSIONS,
];

export function seasonMissionsForStep(seasonStep: number): MissionDef[] {
  return SEASON_MISSIONS.filter((m) => m.seasonStep === seasonStep);
}

export function missionsForPlayer(seasonStep: number): MissionDef[] {
  return [
    ...ONBOARDING_MISSIONS,
    ...DAILY_MISSIONS,
    ...seasonMissionsForStep(seasonStep),
    ...ACHIEVEMENT_MISSIONS,
  ];
}

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
    case "foodLevel":
      return snap.foodLevel;
    case "parkingLevel":
      return snap.parkingLevel;
    case "ticketsLevel":
      return snap.ticketsLevel;
    case "academyLevel":
      return snap.academyLevel;
    case "sponsorLevel":
      return snap.sponsorLevel;
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
    foodLevel: state.units.food?.level ?? 1,
    parkingLevel: state.units.parking?.level ?? 1,
    ticketsLevel: state.units.tickets?.level ?? 1,
    academyLevel: state.units.academy?.level ?? 1,
    sponsorLevel: state.units.sponsor?.level ?? 1,
    hiredCount,
    assignedCount,
    vaultLevel: state.vaultLevel,
    dailyProgress: state.dailyProgress,
    dailyDate: state.dailyDate,
    claimed: state.missionClaimed,
  };
}

export function allMissionStatuses(
  snap: MissionSnapshot,
  seasonStep = 1,
): MissionStatus[] {
  return missionsForPlayer(seasonStep).map((d) => missionStatus(d, snap));
}

export function claimableMissionCount(
  snap: MissionSnapshot,
  seasonStep = 1,
): number {
  return allMissionStatuses(snap, seasonStep).filter((s) => s.claimable).length;
}

export function firstClaimableMission(
  snap: MissionSnapshot,
  seasonStep = 1,
): MissionStatus | null {
  return allMissionStatuses(snap, seasonStep).find((s) => s.claimable) ?? null;
}

export type MissionNavTarget = "games" | "club";

/** مقصد CTA برای مأموریت‌های روزانه */
export function dailyMissionNavTarget(id: string): MissionNavTarget {
  return id === "daily_collect_2" ? "club" : "games";
}

export function dailyMissionCtaLabel(id: string): string {
  return id === "daily_collect_2" ? "رفتن به باشگاه" : "رفتن به بازی";
}

const DAILY_COPY_BY_SEASON: Record<
  number,
  Partial<Record<string, { title: string; detail: string }>>
> = {
  1: {
    daily_play: {
      title: "امروز برای باشگاه بازی کن",
      detail: "هر بازی، XP و درآمد اولیه می‌آورد",
    },
    daily_correct_5: {
      title: "۵ جواب درست برای رشد",
      detail: "دانش فوتبال = سرعت رسیدن به صعود",
    },
    daily_collect_2: {
      title: "۲ بار دخل فروشگاه را جمع کن",
      detail: "چرخهٔ پول فقط با collect کامل می‌شود",
    },
  },
  2: {
    daily_play: {
      title: "امروز یک بازی روز مسابقه",
      detail: "برد = هوادار بیشتر = گیشه و خوراکی پول‌سازتر",
    },
    daily_correct_5: {
      title: "۵ جواب درست امروز",
      detail: "بازی بیشتر، جمعیت بیشتر برای اقتصاد روز مسابقه",
    },
    daily_collect_2: {
      title: "۲ بار درآمد روز مسابقه را جمع کن",
      detail: "بلیت، خوراکی یا پارکینگ — هر کدام که آماده است",
    },
  },
  3: {
    daily_play: {
      title: "امروز برای برند باشگاه بازی کن",
      detail: "برد و XP به باز شدن آکادمی و اسپانسر نزدیک‌تر می‌کند",
    },
    daily_correct_5: {
      title: "۵ جواب درست برای اعتبار",
      detail: "باشگاه بزرگ‌تر = انتظار بیشتر از نتیجه در زمین",
    },
    daily_collect_2: {
      title: "۲ بار درآمد باشگاه را جمع کن",
      detail: "گیشه، اسپانسر و فروشگاه — همه به خزانه می‌ریزند",
    },
  },
  4: {
    daily_play: {
      title: "امروز برای امپراتوری بازی کن",
      detail: "هر بازی هنوز هوادار و XP می‌آورد — موتور رشد خاموش نمی‌شود",
    },
    daily_correct_5: {
      title: "۵ جواب درست حرفه‌ای",
      detail: "لیگ حرفه‌ای فقط با زیرساخت جلو نمی‌رود؛ نتیجه هم لازم است",
    },
    daily_collect_2: {
      title: "۲ بار درآمد پایدار را جمع کن",
      detail: "مدیران، اسپانسر و واحدها — همه باید به خزانه بریزند",
    },
  },
};

export function dailyMissionDisplay(
  def: MissionDef,
  seasonStep: number,
): { title: string; detail: string } {
  const step = Math.min(Math.max(1, seasonStep), 4);
  const override = DAILY_COPY_BY_SEASON[step]?.[def.id];
  return override ?? { title: def.title, detail: def.detail };
}

/** مقصد CTA برای مأموریت‌های فصل */
export function seasonMissionNavTarget(def: MissionDef): MissionNavTarget {
  const key = def.progressKey ?? def.id;
  if (
    key === "matchesWon" ||
    key === "fans" ||
    key === "gamesPlayed" ||
    key === "totalCorrect"
  ) {
    return "games";
  }
  return "club";
}

export function seasonMissionCtaLabel(def: MissionDef, status: MissionStatus): string {
  if (status.claimed) return "دریافت شد";
  if (status.claimable) return "دریافت";
  return seasonMissionNavTarget(def) === "club" ? "رفتن به باشگاه" : "رفتن به بازی";
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
