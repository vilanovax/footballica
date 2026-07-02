/** تب‌های نوارِ پایین */
export type Tab = "home" | "games" | "leaderboard" | "shop" | "profile";

/** همهٔ صفحه‌ها: تب‌ها + جریان‌های تمام‌صفحه */
export type Screen =
  | Tab
  | "quiz"
  | "result"
  | "club"
  | "bomb"
  | "duel"
  | "penalty"
  | "survival";

export const TAB_SET: Tab[] = ["home", "games", "leaderboard", "shop", "profile"];

export function isTab(s: Screen): s is Tab {
  return (TAB_SET as string[]).includes(s);
}

/** نتیجهٔ یک سؤال برای بازیکن و حریف (برای صفحهٔ نتیجه) */
export interface AnswerOutcome {
  youCorrect: boolean;
  foeCorrect: boolean;
  label: string; // متنِ سؤالِ پرسیده‌شده برای مرورِ نتیجه
}

export type PlayMode = "quick" | "duel";

export interface MatchResult {
  mode: PlayMode;
  youScore: number;
  foeScore: number;
  outcomes: AnswerOutcome[];
  xpEarned: number;
  fansEarned: number;
  vaultEarned: number;
  cardsEarned: number;
}

export const OPPONENT = {
  name: "رضا حریف",
  short: "ر.م",
} as const;
