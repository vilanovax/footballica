// ============================================================
//  نردبانِ جایزهٔ استریکِ روزانه — ۷ روزه و چرخه‌ای.
//  روزِ ۷ یک کارت هم می‌دهد (کمیاب). اعداد قابلِ تنظیم.
// ============================================================

export interface StreakReward {
  coins: number;
  cards?: number;
}

export const STREAK_REWARDS: StreakReward[] = [
  { coins: 20 }, // روز ۱
  { coins: 30 }, // روز ۲
  { coins: 40 }, // روز ۳
  { coins: 50 }, // روز ۴
  { coins: 60 }, // روز ۵
  { coins: 80 }, // روز ۶
  { coins: 100, cards: 1 }, // روز ۷
];

/** جایزهٔ روزِ N (چرخه‌ایِ ۷ روزه). */
export function rewardForDay(day: number): StreakReward {
  const idx = (Math.max(1, day) - 1) % STREAK_REWARDS.length;
  return STREAK_REWARDS[idx];
}
