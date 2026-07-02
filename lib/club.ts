import { ECONOMY } from "./economy";

export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  level: number;
  effect: string;
  baseCost: number;
  /** اگر قفل است، شرطِ باز شدن */
  lockedUntil?: string;
}

export const CLUB = {
  name: "عقاب‌های تهران",
  emoji: "🦅",
  division: "دستهٔ سه",
  rank: 4,
  badgeLevel: 7,
  cards: 2,
  fans: 0,
  promotion: {
    target: "دستهٔ دو",
    need: ECONOMY.promotion.fansNeeded[1], // ۳۰۰۰ هوادار برای صعود از دستهٔ سه
  },
} as const;

export const MAX_LEVEL = 10;

// هزینهٔ ارتقای سطحِ بعد = baseCost × ضریب^(سطح-۱)
export function costFor(baseCost: number, level: number): number {
  return Math.round(
    baseCost * Math.pow(ECONOMY.upgrade.costMultiplier, level - 1),
  );
}

export const UPGRADES: Upgrade[] = [
  {
    id: "training",
    name: "زمین تمرین",
    emoji: "🏋️",
    level: 3,
    effect: "جان هر ۱۸ دقیقه پر می‌شود",
    baseCost: 100,
  },
  {
    id: "stadium",
    name: "استادیوم",
    emoji: "🏟️",
    level: 2,
    effect: "+۲۰٪ هوادار در هر برد · درآمد ساعتی ۳۰",
    baseCost: 150,
  },
  {
    id: "analysis",
    name: "اتاق آنالیز",
    emoji: "📊",
    level: 1,
    effect: "یک‌بار در مسابقه، دستهٔ سؤالِ بعدی را ببین",
    baseCost: 200,
  },
  {
    id: "academy",
    name: "آکادمی جوانان",
    emoji: "🎓",
    level: 2,
    effect: "یک راهنماییِ رایگان در هر بازی",
    baseCost: 120,
    lockedUntil: "دستهٔ ۲",
  },
  {
    id: "medic",
    name: "پزشکیار",
    emoji: "⚕️",
    level: 1,
    effect: "جریمهٔ باخت −۱۰٪",
    baseCost: 130,
  },
  {
    id: "media",
    name: "دپارتمان رسانه",
    emoji: "📡",
    level: 1,
    effect: "+۱۰٪ سکهٔ تبلیغ",
    baseCost: 110,
  },
];
