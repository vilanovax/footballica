/**
 * Game of the Day habit branding — weekday + kind FOMO labels.
 * Client-safe (no server-only imports). Uses Asia/Tehran weekday to match GotD dateKey.
 */

import type { Locale } from "@/lib/i18n/config";
import type { GameOfTheDayKind } from "@/lib/grid/gotd";

const WEEKDAY_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAY_FA = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
] as const;

/** Kind adjective for English “Mystery Monday” style titles. */
const KIND_EN: Record<GameOfTheDayKind, string> = {
  mystery: "Mystery",
  grid: "Grid",
  starPath: "Star Path",
  memory: "Memory",
  tikiTaka: "Tiki-Taka",
};

const KIND_FA: Record<GameOfTheDayKind, string> = {
  mystery: "بازیکن مرموز",
  grid: "جدول فوتبال",
  starPath: "مسیر ستاره",
  memory: "حافظه جفت‌ها",
  tikiTaka: "تیکی‌تاکا",
};

const tehranWeekdayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tehran",
  weekday: "short",
});

/** 0 = Sunday … 6 = Saturday in Asia/Tehran. */
export function tehranWeekdayIndex(date: Date = new Date()): number {
  const short = tehranWeekdayFmt.format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? date.getDay();
}

/**
 * Habit headline for the GotD slot.
 * EN: "Mystery Monday" · FA: "دوشنبه · بازیکن مرموز"
 */
export function gotdHabitHeadline(
  kind: GameOfTheDayKind,
  locale: Locale,
  date: Date = new Date(),
): string {
  const day = tehranWeekdayIndex(date);
  if (locale === "fa") {
    return `${WEEKDAY_FA[day]} · ${KIND_FA[kind]}`;
  }
  const weekday = WEEKDAY_EN[day];
  const label = KIND_EN[kind];
  // Multi-word kinds keep weekday after: "Star Path Wednesday"
  if (kind === "starPath" || kind === "tikiTaka") {
    return `${label} ${weekday}`;
  }
  return `${label} ${weekday}`;
}
