/**
 * پارامترهای اقتصادِ بازی — تنها منبعِ حقیقت برای بالانس.
 * (برگرفته از سندِ اقتصاد فوتبالیکا. بعداً سمتِ سرور خوانده می‌شود.)
 */
export const ECONOMY = {
  lives: { max: 5, regenMinutes: 20, refillCost: 50 },
  coins: { winQuick: 50, loseQuick: 12, perCorrect: 5 },
  fans: { winDuel: 120, loseDuel: 15 },
  upgrade: { costMultiplier: 1.6 },
  promotion: { fansNeeded: [1000, 3000, 8000, 20000] },
  rewardMultiplier: [1.0, 1.3, 1.6, 2.0, 3.0], // بر اساس دسته
} as const;

// امتیازدهیِ کوییز: سریع و درست = امتیازِ بیشتر (پاداشِ سرعت)
export const SCORING = {
  timePerQuestion: 10, // ثانیه
  basePoints: 60, // امتیازِ پایهٔ یک جوابِ درست
  speedBonusMax: 40, // حداکثر پاداشِ سرعت (خطی با زمانِ باقی‌مانده)
} as const;

export function scoreAnswer(correct: boolean, secondsLeft: number): number {
  if (!correct) return 0;
  const ratio = Math.max(0, secondsLeft) / SCORING.timePerQuestion;
  return Math.round(SCORING.basePoints + SCORING.speedBonusMax * ratio);
}
