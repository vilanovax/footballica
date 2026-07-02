/**
 * پیشرفتِ کاربر: XP → Level.
 * XP خرج نمی‌شود؛ فقط سطح را بالا می‌برد. سطح، بخش‌ها را باز می‌کند.
 */
const BASE_XP = 100;
const XP_GROWTH = 1.35;

/** XP لازم برای رفتن از این سطح به سطحِ بعد */
export function xpToNext(level: number): number {
  return Math.round(BASE_XP * XP_GROWTH ** (level - 1));
}

export interface LevelInfo {
  level: number;
  into: number; // XP واردشده در سطحِ فعلی
  need: number; // XP لازم برای سطحِ بعد
  pct: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let rem = Math.max(0, Math.floor(xp));
  while (rem >= xpToNext(level)) {
    rem -= xpToNext(level);
    level += 1;
  }
  const need = xpToNext(level);
  return { level, into: rem, need, pct: (rem / need) * 100 };
}

export function levelForXp(xp: number): number {
  return levelInfo(xp).level;
}

/** چه چیزی در هر سطح باز می‌شود (برای نمایش در پروفایل) */
export const LEVEL_UNLOCKS: { level: number; label: string }[] = [
  { level: 1, label: "فروشگاه باشگاه، گاوصندوق" },
  { level: 2, label: "غرفهٔ خوراکی" },
  { level: 3, label: "بلیت‌فروشی" },
  { level: 4, label: "پارکینگ ورزشگاه" },
  { level: 5, label: "آکادمی فوتبال" },
  { level: 6, label: "اسپانسرِ پیراهن" },
  { level: 8, label: "مدیرانِ ستاره" },
  { level: 10, label: "جام حذفی" },
  { level: 12, label: "بانکِ اسپانسری" },
  { level: 15, label: "لیگِ حرفه‌ای" },
];

export function nextUnlock(level: number): { level: number; label: string } | null {
  return LEVEL_UNLOCKS.find((u) => u.level > level) ?? null;
}
