/**
 * واحدهای تجاریِ باشگاه.
 *
 * الگوریتمِ درآمد:
 *  ۱) payout پایه = basePayout × payoutGrowth^(unitLevel−1)
 *  ۲) آیتم income → +base×lvl به payout
 *  ۳) payout نهایی = payout × incomeMult(مدیر) × fanMult(هوادار)
 *  ۴) cycle = max(cycleMin, cycleSeconds − Σspeed×lvl) / speedMult(مدیر)
 *  ۵) cap = payout × (pendingCapCycles + Σcapacity×lvl)
 *  ۶) pending = min(cap, elapsed×rate) — elapsed حداکثر ۸ساعت آفلاین
 */
import { offlineCapSeconds } from "./economy";
import { faMoney, faNum } from "./format";
export type ItemEffect = "income" | "speed" | "capacity";

export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  effect: ItemEffect;
  base: number; // اثرِ هر سطح (income: تومان، speed: ثانیهٔ کم‌شده، capacity: دورهٔ اضافه)
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  unlockLevel: number; // سطحِ واحد برای باز شدن
}

export interface UnitDef {
  id: string;
  name: string;
  emoji: string;
  basePayout: number;
  cycleSeconds: number;
  cycleMin: number;
  payoutGrowth: number;
  pendingCapCycles: number;
  baseUpgradeCost: number;
  upgradeCostGrowth: number;
  maxLevel: number;
  requiresLevel: number; // سطحِ کاربر برای باز شدنِ واحد
  flavor: string;
  items: ItemDef[];
}

export const UNITS: UnitDef[] = [
  {
    id: "shop",
    name: "فروشگاهِ باشگاه",
    emoji: "🏪",
    basePayout: 1_000_000,
    cycleSeconds: 60,
    cycleMin: 30,
    payoutGrowth: 1.45,
    pendingCapCycles: 6,
    baseUpgradeCost: 10_000_000,
    upgradeCostGrowth: 2.2,
    maxLevel: 15,
    requiresLevel: 1,
    flavor: "لباس، شال، توپ — درآمدِ ثابت و سریع",
    items: [
      { id: "shal", name: "شالِ هواداری", emoji: "🧣", effect: "income", base: 300_000, baseCost: 5_000_000, costGrowth: 1.8, maxLevel: 8, unlockLevel: 2 },
      { id: "ball", name: "توپِ باشگاه", emoji: "⚽", effect: "income", base: 500_000, baseCost: 10_000_000, costGrowth: 1.9, maxLevel: 8, unlockLevel: 3 },
      { id: "reg", name: "صندوقِ فروشِ سریع", emoji: "🧾", effect: "speed", base: 4, baseCost: 12_000_000, costGrowth: 2.0, maxLevel: 5, unlockLevel: 4 },
      { id: "online", name: "فروشِ آنلاین", emoji: "📱", effect: "capacity", base: 2, baseCost: 20_000_000, costGrowth: 2.0, maxLevel: 6, unlockLevel: 5 },
    ],
  },
  {
    id: "food",
    name: "غرفهٔ خوراکی",
    emoji: "🌭",
    basePayout: 800_000,
    cycleSeconds: 40,
    cycleMin: 20,
    payoutGrowth: 1.4,
    pendingCapCycles: 6,
    baseUpgradeCost: 8_000_000,
    upgradeCostGrowth: 2.1,
    maxLevel: 15,
    requiresLevel: 2,
    flavor: "ساندویچ و نوشیدنی — درآمدِ سریع",
    items: [
      { id: "soda", name: "نوشابه", emoji: "🥤", effect: "income", base: 250_000, baseCost: 6_000_000, costGrowth: 1.8, maxLevel: 8, unlockLevel: 2 },
      { id: "icecream", name: "دستگاهِ بستنی", emoji: "🍦", effect: "income", base: 400_000, baseCost: 12_000_000, costGrowth: 1.9, maxLevel: 8, unlockLevel: 3 },
      { id: "kitchen", name: "آشپزخانهٔ بهتر", emoji: "🍳", effect: "speed", base: 3, baseCost: 15_000_000, costGrowth: 2.0, maxLevel: 5, unlockLevel: 4 },
    ],
  },
  {
    id: "parking",
    name: "پارکینگِ ورزشگاه",
    emoji: "🅿️",
    basePayout: 400_000,
    cycleSeconds: 90,
    cycleMin: 45,
    payoutGrowth: 1.3,
    pendingCapCycles: 8,
    baseUpgradeCost: 6_000_000,
    upgradeCostGrowth: 2.0,
    maxLevel: 12,
    requiresLevel: 4,
    flavor: "جای پارکِ روزِ مسابقه — کم ولی پایدار",
    items: [
      { id: "cap", name: "ظرفیتِ بیشتر", emoji: "🚗", effect: "income", base: 150_000, baseCost: 5_000_000, costGrowth: 1.8, maxLevel: 8, unlockLevel: 2 },
      { id: "entry", name: "ورودیِ سریع", emoji: "🚦", effect: "speed", base: 6, baseCost: 8_000_000, costGrowth: 2.0, maxLevel: 5, unlockLevel: 3 },
      { id: "vippark", name: "پارکینگِ VIP", emoji: "✨", effect: "income", base: 400_000, baseCost: 18_000_000, costGrowth: 1.9, maxLevel: 6, unlockLevel: 4 },
    ],
  },
  {
    id: "tickets",
    name: "بلیت‌فروشی",
    emoji: "🎟️",
    basePayout: 3_000_000,
    cycleSeconds: 120,
    cycleMin: 60,
    payoutGrowth: 1.5,
    pendingCapCycles: 4,
    baseUpgradeCost: 20_000_000,
    upgradeCostGrowth: 2.3,
    maxLevel: 12,
    requiresLevel: 3,
    flavor: "درآمدِ روزِ بازی",
    items: [
      { id: "vip", name: "جایگاهِ VIP", emoji: "💺", effect: "income", base: 1_000_000, baseCost: 20_000_000, costGrowth: 1.9, maxLevel: 8, unlockLevel: 2 },
      { id: "gate", name: "گیتِ سریع", emoji: "🚪", effect: "speed", base: 8, baseCost: 25_000_000, costGrowth: 2.0, maxLevel: 5, unlockLevel: 3 },
      { id: "season", name: "بلیتِ فصلی", emoji: "📆", effect: "capacity", base: 2, baseCost: 40_000_000, costGrowth: 2.0, maxLevel: 6, unlockLevel: 4 },
    ],
  },
  {
    id: "sponsor",
    name: "اسپانسرِ پیراهن",
    emoji: "🤝",
    basePayout: 8_000_000,
    cycleSeconds: 300,
    cycleMin: 150,
    payoutGrowth: 1.5,
    pendingCapCycles: 3,
    baseUpgradeCost: 40_000_000,
    upgradeCostGrowth: 2.4,
    maxLevel: 12,
    requiresLevel: 6,
    flavor: "قراردادِ تبلیغاتی — دوره‌ای و بزرگ",
    items: [
      { id: "shirtad", name: "تبلیغِ پیراهن", emoji: "👕", effect: "income", base: 2_000_000, baseCost: 40_000_000, costGrowth: 2.0, maxLevel: 8, unlockLevel: 2 },
      { id: "boardad", name: "تبلیغِ ورزشگاه", emoji: "📢", effect: "income", base: 3_000_000, baseCost: 70_000_000, costGrowth: 2.0, maxLevel: 8, unlockLevel: 3 },
      { id: "global", name: "اسپانسرِ بین‌المللی", emoji: "🌍", effect: "income", base: 5_000_000, baseCost: 120_000_000, costGrowth: 2.1, maxLevel: 6, unlockLevel: 4 },
    ],
  },
  {
    id: "academy",
    name: "آکادمیِ فوتبال",
    emoji: "🎓",
    basePayout: 500_000,
    cycleSeconds: 120,
    cycleMin: 60,
    payoutGrowth: 1.5,
    pendingCapCycles: 5,
    baseUpgradeCost: 15_000_000,
    upgradeCostGrowth: 2.3,
    maxLevel: 12,
    requiresLevel: 5,
    flavor: "پرورشِ بازیکنِ جوان — کم ولی ارزشِ بلندمدت",
    items: [
      { id: "pitch", name: "زمینِ تمرین", emoji: "🥅", effect: "income", base: 150_000, baseCost: 12_000_000, costGrowth: 1.8, maxLevel: 8, unlockLevel: 2 },
      { id: "coach", name: "مربیِ پایه", emoji: "🧑‍🏫", effect: "income", base: 250_000, baseCost: 25_000_000, costGrowth: 1.9, maxLevel: 8, unlockLevel: 3 },
      { id: "scout", name: "استعدادیاب", emoji: "🔎", effect: "capacity", base: 3, baseCost: 40_000_000, costGrowth: 2.0, maxLevel: 6, unlockLevel: 4 },
    ],
  },
];

export function unitDef(id: string): UnitDef {
  const d = UNITS.find((u) => u.id === id);
  if (!d) throw new Error(`unknown unit ${id}`);
  return d;
}

export function unitPayout(def: UnitDef, level: number): number {
  return Math.round(def.basePayout * def.payoutGrowth ** (level - 1));
}
export function unitUpgradeCost(def: UnitDef, level: number): number {
  return Math.round(def.baseUpgradeCost * def.upgradeCostGrowth ** (level - 1));
}
export function itemUpgradeCost(item: ItemDef, currentLevel: number): number {
  return Math.round(item.baseCost * item.costGrowth ** currentLevel);
}

export const ITEM_EFFECT_ICON: Record<ItemEffect, string> = {
  income: "💰",
  speed: "⚡",
  capacity: "📦",
};

export const ITEM_EFFECT_NAME: Record<ItemEffect, string> = {
  income: "درآمد",
  speed: "سرعت",
  capacity: "بافر",
};

/** اثرِ تجمعیِ یک آیتم در سطحِ lvl (۰ = بدون اثر) */
export function itemEffectTotal(item: ItemDef, lvl: number): number {
  return item.base * Math.max(0, lvl);
}

/** توضیحِ خوانا برای اثرِ تجمعی */
export function itemEffectDescribe(item: ItemDef, lvl: number): string {
  if (lvl <= 0) return "—";
  const amt = itemEffectTotal(item, lvl);
  if (item.effect === "income") return `+${faMoney(amt)} هر دوره`;
  if (item.effect === "speed") return `−${faNum(amt)} ثانیه از دوره`;
  return `+${faNum(amt)} دورهٔ بافر`;
}

/** افزایشِ هر سطحِ ارتقا */
export function itemEffectPerLevel(item: ItemDef): string {
  if (item.effect === "income") return `+${faMoney(item.base)}/دوره`;
  if (item.effect === "speed") return `−${faNum(item.base)}ث/دوره`;
  return `+${faNum(item.base)} دورهٔ بافر`;
}

/** کمترین سطحِ واحد برای باز شدنِ آیتمِ بعدی */
export function nextItemUnlockLevel(def: UnitDef, unitLevel: number): number | null {
  let next: number | null = null;
  for (const it of def.items) {
    if (unitLevel >= it.unlockLevel) continue;
    if (next === null || it.unlockLevel < next) next = it.unlockLevel;
  }
  return next;
}

/** تعدادِ آیتم‌های فعال (سطح > ۰) */
export function activeItemCount(
  def: UnitDef,
  itemLevels: Record<string, number>,
): number {
  return def.items.filter((it) => (itemLevels[it.id] ?? 0) > 0).length;
}

export interface UnitStats {
  payout: number; // درآمدِ هر دوره (با آیتم‌ها و ضریبِ مدیر)
  cycle: number; // ثانیهٔ هر دوره
  cap: number; // سقفِ بافر
  ratePerSecond: number;
  baseCapCycles: number; // تعدادِ دوره‌های ذخیره (پایه + آیتمِ capacity)
}

/** آمارِ مؤثرِ واحد از سطحِ واحد + آیتم‌های داخلی + ضریبِ مدیر + هوادار */
export function unitStats(
  def: UnitDef,
  level: number,
  itemLevels: Record<string, number>,
  incomeMult = 1,
  speedMult = 1,
  fanMult = 1,
): UnitStats {
  let payout = unitPayout(def, level);
  let cycleCut = 0;
  let extraCapCycles = 0;

  for (const it of def.items) {
    const lvl = itemLevels[it.id] ?? 0;
    if (lvl <= 0) continue;
    if (it.effect === "income") payout += it.base * lvl;
    else if (it.effect === "speed") cycleCut += it.base * lvl;
    else if (it.effect === "capacity") extraCapCycles += it.base * lvl;
  }

  const effPayout = Math.round(payout * incomeMult * fanMult);
  const baseCycle = Math.max(def.cycleMin, def.cycleSeconds - cycleCut);
  const cycle = Math.max(1, baseCycle / speedMult);
  const cap = effPayout * (def.pendingCapCycles + extraCapCycles);
  return {
    payout: effPayout,
    cycle,
    cap,
    ratePerSecond: effPayout / cycle,
    baseCapCycles: def.pendingCapCycles + extraCapCycles,
  };
}

/** درآمدِ جمع‌شده در بافرِ واحد تا این لحظه (تا سقف) */
export function unitPending(
  def: UnitDef,
  level: number,
  itemLevels: Record<string, number>,
  lastMs: number,
  nowMs: number,
  incomeMult = 1,
  speedMult = 1,
  fanMult = 1,
): number {
  const { cap, ratePerSecond } = unitStats(
    def,
    level,
    itemLevels,
    incomeMult,
    speedMult,
    fanMult,
  );
  const rawElapsed = Math.max(0, (nowMs - lastMs) / 1000);
  const elapsed = Math.min(offlineCapSeconds(), rawElapsed);
  return Math.min(cap, Math.floor(elapsed * ratePerSecond));
}
