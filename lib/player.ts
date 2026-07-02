import { ECONOMY } from "./economy";
import { levelInfo, levelForXp } from "./progress";

/** عنوانِ لیگ بر اساس سطحِ بازیکن */
export function leagueForLevel(level: number): string {
  if (level >= 15) return "لیگِ حرفه‌ای";
  if (level >= 10) return "لیگِ طلایی";
  if (level >= 6) return "لیگِ نقره‌ای";
  if (level >= 3) return "لیگِ برنزی";
  return "لیگِ مبتدی";
}

export function leagueForXp(xp: number): string {
  return leagueForLevel(levelForXp(xp));
}

/** کلیدِ تاریخِ محلی YYYY-MM-DD */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey(d = new Date()): string {
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  return todayKey(prev);
}

/** به‌روزرسانی استریکِ روزانه بعد از یک بازی */
export function nextStreak(
  lastPlayDate: string,
  streakDays: number,
  now = new Date(),
): { lastPlayDate: string; streakDays: number } {
  const today = todayKey(now);
  if (lastPlayDate === today) return { lastPlayDate, streakDays };
  if (lastPlayDate === yesterdayKey(now)) {
    return { lastPlayDate: today, streakDays: streakDays + 1 };
  }
  return { lastPlayDate: today, streakDays: 1 };
}

const REGEN_MS = ECONOMY.lives.regenMinutes * 60 * 1000;

/** محاسبهٔ جان‌های بازیابی‌شده از زمانِ آخرین به‌روزرسانی */
export function syncLivesState(
  lives: number,
  livesUpdatedAt: number,
  now = Date.now(),
): { lives: number; livesUpdatedAt: number } {
  const max = ECONOMY.lives.max;
  if (lives >= max) return { lives: max, livesUpdatedAt: now };
  const elapsed = Math.max(0, now - livesUpdatedAt);
  const gained = Math.floor(elapsed / REGEN_MS);
  if (gained <= 0) return { lives, livesUpdatedAt };
  const next = Math.min(max, lives + gained);
  const remainder = elapsed % REGEN_MS;
  return { lives: next, livesUpdatedAt: now - remainder };
}

/** میلی‌ثانیه تا جانِ بعد (۰ اگر پر است) */
export function msUntilNextLife(
  lives: number,
  livesUpdatedAt: number,
  now = Date.now(),
): number {
  const max = ECONOMY.lives.max;
  if (lives >= max) return 0;
  const elapsed = Math.max(0, now - livesUpdatedAt);
  const rem = REGEN_MS - (elapsed % REGEN_MS);
  return rem === REGEN_MS ? 0 : rem;
}

export function formatRegenCountdown(ms: number): string {
  if (ms <= 0) return "";
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h}س ${m}د` : `${h}س`;
  }
  return `${totalMin}د`;
}

/** @deprecated از rewardQuickQuiz / rewardDuel در economy.ts استفاده کن */
export function xpForMatch(
  correctCount: number,
  won: boolean,
  mode: "quick" | "duel",
): number {
  const base = correctCount * 8;
  const win = won ? (mode === "duel" ? 40 : 25) : 5;
  return base + win;
}

export { levelInfo };
