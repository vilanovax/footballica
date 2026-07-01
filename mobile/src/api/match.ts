// ============================================================
//  تایپ‌ها و فراخوانی‌های مَچ — آینهٔ دقیقِ قراردادِ بک‌اند.
//  ⚠️ توجه: RoundView هیچ فیلدِ isCorrect ندارد (server-authoritative).
// ============================================================

import { api } from './client';

export type GameMode = 'QUICK' | 'BOMB';

export interface RoundOption {
  id: string;
  text: string;
  order: number;
}

export interface RoundView {
  roundId: string;
  roundIndex: number;
  question: { id: string; text: string; difficulty: string };
  options: RoundOption[];
  deadlineAt: string; // ISO — منبعِ حقیقتِ زمان
  serverNow: string; // ISO — برای سنکرونِ ساعتِ کلاینت
}

export interface CreateMatchResult {
  matchId: string;
  mode: GameMode;
  totalRounds: number;
  round: RoundView;
}

export interface AnswerResult {
  isCorrect: boolean;
  isLate: boolean;
  points: number;
  correctOptionId?: string;
  msTaken: number;
}

export interface NextRoundResult {
  finished: boolean;
  round?: RoundView;
  summary?: { matchId: string; score: number; totalRounds: number };
}

export function createMatch(input: {
  userId: string;
  mode: GameMode;
  totalRounds?: number;
}): Promise<CreateMatchResult> {
  return api.post<CreateMatchResult>('/matches', input);
}

export function submitAnswer(
  roundId: string,
  input: { userId: string; optionId: string | null },
): Promise<AnswerResult> {
  return api.post<AnswerResult>(`/rounds/${roundId}/answer`, input);
}

export function nextRound(
  matchId: string,
  input: { userId: string },
): Promise<NextRoundResult> {
  return api.post<NextRoundResult>(`/matches/${matchId}/next-round`, input);
}
