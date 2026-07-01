// ============================================================
//  Duel — دوئل async. آینهٔ قراردادِ بک‌اند (/duels/*).
//  ⚠️ RoundView هیچ isCorrect ندارد (server-authoritative).
//  توجه: ربات‌بودنِ حریف هرگز از سرور نمی‌آید — حریف همیشه «عادی» است.
// ============================================================

import { api } from './client';

export interface DuelRoundView {
  roundId: string;
  order: number;
  question: { id: string; text: string; difficulty: string };
  options: { id: string; text: string; order: number }[];
  deadlineAt: string;
  serverNow: string;
}

export interface FindDuelResult {
  matchId: string;
  status: 'waiting' | 'matched';
  totalRounds: number;
}

export type NextDuelRound =
  | { finishedLeg: true }
  | { finishedLeg: false; round: DuelRoundView };

export interface DuelAnswerResult {
  isCorrect: boolean;
  isLate: boolean;
  points: number;
  correctOptionId?: string;
  msTaken: number;
  legFinished: boolean;
  matchFinished: boolean;
}

export interface DuelState {
  matchId: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED' | 'ABANDONED';
  totalRounds: number;
  me: { answered: number; legFinished: boolean; score: number };
  opponent: { name: string; answered: number; score: number | null } | null;
  result: { myScore: number; oppScore: number; outcome: 'win' | 'loss' | 'draw' } | null;
}

export interface DuelSummary {
  matchId: string;
  status: DuelState['status'];
  totalRounds: number;
  myAnswered: number;
  myTurn: boolean;
  opponentName: string | null;
  outcome: 'win' | 'loss' | 'draw' | null;
}

export function findDuel(totalRounds = 5): Promise<FindDuelResult> {
  return api.post<FindDuelResult>('/duels/find', { totalRounds });
}

export function duelNextRound(matchId: string): Promise<NextDuelRound> {
  return api.post<NextDuelRound>(`/duels/${matchId}/next-round`);
}

export function duelAnswer(
  roundId: string,
  optionId: string | null,
): Promise<DuelAnswerResult> {
  return api.post<DuelAnswerResult>(`/duels/rounds/${roundId}/answer`, {
    optionId,
  });
}

export function duelState(matchId: string): Promise<DuelState> {
  return api.get<DuelState>(`/duels/${matchId}`);
}

export function listDuels(): Promise<DuelSummary[]> {
  return api.get<DuelSummary[]>('/duels');
}
