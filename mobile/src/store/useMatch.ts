// ============================================================
//  useMatch — وضعیتِ زندهٔ یک مَچ + اکشن‌های حلقهٔ اصلی.
//  همهٔ تصمیم‌های «درست/زمان» سمت سرور است؛ این استور فقط وضعیت
//  UI و پاسخِ سرور را نگه می‌دارد.
// ============================================================

import { create } from 'zustand';
import {
  createMatch,
  submitAnswer,
  nextRound,
  type GameMode,
  type RoundView,
  type AnswerResult,
} from '../api/match';

type Status =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'answered'
  | 'finished'
  | 'error';

interface MatchState {
  status: Status;
  error: string | null;

  matchId: string | null;
  mode: GameMode | null;
  totalRounds: number;

  round: RoundView | null;
  roundNumber: number; // ۱..totalRounds
  endsAtMs: number; // deadline بر حسب ساعتِ کلاینت (سنکرون‌شده)

  score: number;
  lastResult: AnswerResult | null;
  summary: { score: number; totalRounds: number } | null;

  start: (userId: string, mode: GameMode, totalRounds?: number) => Promise<void>;
  answer: (userId: string, optionId: string | null) => Promise<void>;
  next: (userId: string) => Promise<void>;
  reset: () => void;
}

// deadline سرور را به ساعتِ کلاینت تبدیل می‌کند (حذفِ اختلافِ ساعت/تأخیر).
function toClientDeadline(round: RoundView): number {
  const serverNow = new Date(round.serverNow).getTime();
  const deadline = new Date(round.deadlineAt).getTime();
  return Date.now() + (deadline - serverNow);
}

function applyRound(round: RoundView): Partial<MatchState> {
  return {
    status: 'playing',
    round,
    roundNumber: round.roundIndex + 1,
    endsAtMs: toClientDeadline(round),
    lastResult: null,
  };
}

export const useMatch = create<MatchState>((set, get) => ({
  status: 'idle',
  error: null,
  matchId: null,
  mode: null,
  totalRounds: 5,
  round: null,
  roundNumber: 0,
  endsAtMs: 0,
  score: 0,
  lastResult: null,
  summary: null,

  async start(userId, mode, totalRounds = 5) {
    set({ status: 'loading', error: null, score: 0, summary: null });
    try {
      const res = await createMatch({ userId, mode, totalRounds });
      set({
        matchId: res.matchId,
        mode: res.mode,
        totalRounds: res.totalRounds,
        ...applyRound(res.round),
      });
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
    }
  },

  async answer(userId, optionId) {
    const { round, status } = get();
    if (!round || status !== 'playing') return;
    set({ status: 'answered' }); // قفلِ خوش‌بینانه تا پاسخِ سرور
    try {
      const result = await submitAnswer(round.roundId, { userId, optionId });
      set((s) => ({
        status: 'answered',
        lastResult: result,
        score: s.score + result.points,
      }));
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
    }
  },

  async next(userId) {
    const { matchId } = get();
    if (!matchId) return;
    set({ status: 'loading', error: null });
    try {
      const res = await nextRound(matchId, { userId });
      if (res.finished && res.summary) {
        set({
          status: 'finished',
          summary: {
            score: res.summary.score,
            totalRounds: res.summary.totalRounds,
          },
        });
      } else if (res.round) {
        set(applyRound(res.round));
      }
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
    }
  },

  reset() {
    set({
      status: 'idle',
      error: null,
      matchId: null,
      mode: null,
      round: null,
      roundNumber: 0,
      endsAtMs: 0,
      score: 0,
      lastResult: null,
      summary: null,
    });
  },
}));

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'خطا در ارتباط با سرور';
}
