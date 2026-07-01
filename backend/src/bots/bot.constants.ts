// ============================================================
//  پارامترهای ربات — «مغزِ» رفتارِ ربات در دوئل.
//  این‌ها عمداً در یک فایل جدا هستند تا تیمِ بالانس بدون دست‌زدن به
//  منطق، دقت/سرعتِ ربات‌ها را تنظیم کند.
// ============================================================

import type { BotDifficulty } from '@prisma/client';

export interface BotDifficultyParams {
  /** احتمالِ پاسخِ درست (۰..۱). */
  pCorrect: number;
  /** بازهٔ زمانِ «فکرکردن» به میلی‌ثانیه (برای امتیازِ سرعت و حسِ انسانی). */
  minMs: number;
  maxMs: number;
}

// دقت و سرعت به تفکیکِ درجهٔ سختی.
// EASY: ضعیف و کند · MEDIUM: متوسط · HARD: دقیق و سریع.
export const BOT_DIFFICULTY: Record<BotDifficulty, BotDifficultyParams> = {
  EASY: { pCorrect: 0.45, minMs: 6000, maxMs: 12000 },
  MEDIUM: { pCorrect: 0.65, minMs: 3000, maxMs: 8000 },
  HARD: { pCorrect: 0.85, minMs: 1500, maxMs: 5000 },
};

// تنظیماتِ پرکردنِ دوئل با ربات (قابلِ override با env).
export const DUEL_BOT_CONFIG = {
  // اگر false شود، هیچ رباتی به دوئل اضافه نمی‌شود (فقط human-vs-human).
  fillEnabled: process.env.DUEL_BOT_FILL !== 'false',
};

/** نامِ نمایشیِ فارسیِ درجهٔ سختی (برای پنلِ ادمین). */
export const BOT_DIFFICULTY_FA: Record<BotDifficulty, string> = {
  EASY: 'آسان (ضعیف)',
  MEDIUM: 'متوسط',
  HARD: 'سخت (حرفه‌ای)',
};
