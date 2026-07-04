/**
 * UI و منطقِ صفحهٔ Home — استریک، مودِ پیشنهادی.
 */
import { MODE_THEME_MAP } from "./designSystem";
import { todayKey } from "./player";
import { faNum } from "./format";

export const STREAK_MILESTONES = [
  { day: 3, cards: 1, label: "+۱ کارت تاکتیکی" },
  { day: 7, cards: 2, label: "+۲ کارت تاکتیکی" },
] as const;

/** پاداشِ رسیدن به یک milestone (فقط وقتی streak به آن روز برسد) */
export function streakMilestoneReward(streakDays: number): { cards: number } | null {
  const hit = STREAK_MILESTONES.find((m) => m.day === streakDays);
  if (!hit) return null;
  return { cards: hit.cards };
}

export interface StreakRewardInfo {
  targetDay: number;
  label: string;
  daysUntil: number;
  playedToday: boolean;
  hint: string;
}

/** متنِ پاداشِ بعدی برای UI */
export function nextStreakRewardInfo(
  streakDays: number,
  lastPlayDate: string,
  now = new Date(),
): StreakRewardInfo | null {
  const playedToday = lastPlayDate === todayKey(now);

  for (const m of STREAK_MILESTONES) {
    if (streakDays >= m.day) continue;

    const daysUntil = m.day - streakDays;
    let hint: string;

    if (daysUntil === 1 && !playedToday) {
      hint = "با بازیِ امروز می‌گیری";
    } else if (daysUntil === 1 && playedToday) {
      hint = "فردا ادامه بده";
    } else if (daysUntil === 0) {
      hint = "امروز بازی کن";
    } else {
      hint = `${faNum(daysUntil)} روز تا پاداش`;
    }

    return {
      targetDay: m.day,
      label: m.label,
      daysUntil,
      playedToday,
      hint,
    };
  }

  return null;
}

export type FeaturedModeId = "bomb" | "duel" | "penalty" | "survival";

export interface FeaturedModeDef {
  id: FeaturedModeId;
  title: string;
  subtitle: string;
  perk: string;
  emoji: string;
  from: string;
  to: string;
}

const FEATURED_MODES: FeaturedModeDef[] = [
  {
    id: "bomb",
    title: "حالت بمب",
    subtitle: "قبل از انفجار جواب بده",
    perk: "XP بیشتر در زمانِ کم",
    emoji: MODE_THEME_MAP.bomb.emoji,
    from: MODE_THEME_MAP.bomb.from,
    to: MODE_THEME_MAP.bomb.to,
  },
  {
    id: "duel",
    title: "دوئل ۱به۱",
    subtitle: "۵ سؤال · ۱ ❤️ · جایزهٔ بزرگ",
    perk: "+۱M به خزانه در برد",
    emoji: MODE_THEME_MAP.duel.emoji,
    from: MODE_THEME_MAP.duel.from,
    to: MODE_THEME_MAP.duel.to,
  },
  {
    id: "penalty",
    title: "پنالتی",
    subtitle: "۵ ضربه · گل = پاداش",
    perk: "شانسِ کارت تاکتیکی",
    emoji: MODE_THEME_MAP.penalty.emoji,
    from: MODE_THEME_MAP.penalty.from,
    to: MODE_THEME_MAP.penalty.to,
  },
  {
    id: "survival",
    title: "مود بقا",
    subtitle: "تا آخرین جان",
    perk: "رکورد بزن، XP جمع کن",
    emoji: MODE_THEME_MAP.survival.emoji,
    from: MODE_THEME_MAP.survival.from,
    to: MODE_THEME_MAP.survival.to,
  },
];

/** مودِ پیشنهادی بر اساس روز (چرخشِ ۴ روزه) */
export function featuredModeForDate(d = new Date()): FeaturedModeDef {
  const start = new Date(2025, 0, 1).getTime();
  const dayIndex = Math.floor((d.getTime() - start) / 86_400_000);
  return FEATURED_MODES[((dayIndex % FEATURED_MODES.length) + FEATURED_MODES.length) % FEATURED_MODES.length]!;
}

/** روز milestone است (برای highlight نقطهٔ استریک) */
export function isStreakMilestoneDay(dayIndex: number): boolean {
  return STREAK_MILESTONES.some((m) => m.day === dayIndex + 1);
}
