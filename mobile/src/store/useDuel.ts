// ============================================================
//  useDuel — وضعیتِ زندهٔ یک دوئل + اکشن‌های لِگِ بازیکن.
//  همهٔ تصمیم‌ها سمت سرور است؛ حریف (چه انسان چه ربات) از دید
//  این استور فقط «حریف» است.
// ============================================================

import { create } from 'zustand';
import {
  findDuel,
  duelNextRound,
  duelAnswer,
  duelState,
  type DuelRoundView,
  type DuelAnswerResult,
  type DuelState,
} from '../api/duel';

type Status =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'answered'
  | 'waiting' // لِگِ من تمام شده، منتظرِ حریف
  | 'finished'
  | 'error';

interface DuelStore {
  status: Status;
  error: string | null;

  matchId: string | null;
  totalRounds: number;
  roundNumber: number;
  endsAtMs: number;

  round: DuelRoundView | null;
  lastResult: DuelAnswerResult | null;
  myScore: number;

  opponentName: string | null;
  result: DuelState['result'];

  find: (totalRounds?: number) => Promise<string | null>;
  begin: (matchId: string, totalRounds: number) => Promise<void>;
  answer: (optionId: string | null) => Promise<void>;
  next: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

function clientDeadline(round: DuelRoundView): number {
  const serverNow = new Date(round.serverNow).getTime();
  const deadline = new Date(round.deadlineAt).getTime();
  return Date.now() + (deadline - serverNow);
}

const errMsg = (e: unknown): string =>
  e instanceof Error ? e.message : 'خطا در ارتباط با سرور';

export const useDuel = create<DuelStore>((set, get) => ({
  status: 'idle',
  error: null,
  matchId: null,
  totalRounds: 5,
  roundNumber: 0,
  endsAtMs: 0,
  round: null,
  lastResult: null,
  myScore: 0,
  opponentName: null,
  result: null,

  // مچ‌میکینگ؛ matchId را برمی‌گرداند تا صفحه navigate کند
  async find(totalRounds = 5) {
    set({ status: 'loading', error: null });
    try {
      const res = await findDuel(totalRounds);
      return res.matchId;
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
      return null;
    }
  },

  // شروعِ صفحهٔ دوئل: وضعیت را بگیر؛ اگر لِگم مانده ادامه بده، وگرنه نتیجه/انتظار
  async begin(matchId, totalRounds) {
    set({
      status: 'loading',
      error: null,
      matchId,
      totalRounds,
      myScore: 0,
      result: null,
      lastResult: null,
      opponentName: null,
    });
    try {
      const st = await duelState(matchId);
      set({ totalRounds: st.totalRounds });
      if (st.status === 'FINISHED') {
        set({
          status: 'finished',
          result: st.result,
          opponentName: st.opponent?.name ?? 'حریف',
        });
        return;
      }
      if (st.me.legFinished) {
        set({ status: 'waiting', opponentName: st.opponent?.name ?? null });
        return;
      }
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
      return;
    }
    await get().next();
  },

  async next() {
    const { matchId } = get();
    if (!matchId) return;
    set({ status: 'loading', error: null, lastResult: null });
    try {
      const res = await duelNextRound(matchId);
      if (res.finishedLeg) {
        await get().refresh();
      } else {
        set({
          status: 'playing',
          round: res.round,
          roundNumber: res.round.order + 1,
          endsAtMs: clientDeadline(res.round),
        });
      }
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
    }
  },

  async answer(optionId) {
    const { round, status } = get();
    if (!round || status !== 'playing') return;
    set({ status: 'answered' });
    try {
      const res = await duelAnswer(round.roundId, optionId);
      set((s) => ({ lastResult: res, myScore: s.myScore + res.points }));
      if (res.matchFinished) {
        await get().refresh();
      } else if (res.legFinished) {
        set({ status: 'waiting' });
        await get().refresh();
      }
      // در غیر این صورت در حالتِ answered می‌ماند تا کاربر «سؤال بعد» را بزند
    } catch (e) {
      set({ status: 'error', error: errMsg(e) });
    }
  },

  async refresh() {
    const { matchId } = get();
    if (!matchId) return;
    try {
      const st = await duelState(matchId);
      if (st.status === 'FINISHED') {
        set({
          status: 'finished',
          result: st.result,
          opponentName: st.opponent?.name ?? 'حریف',
        });
      } else {
        set({
          status: get().status === 'playing' ? 'playing' : 'waiting',
          opponentName: st.opponent?.name ?? null,
        });
      }
    } catch {
      // خطای موقتِ poll را نادیده بگیر
    }
  },

  reset() {
    set({
      status: 'idle',
      error: null,
      matchId: null,
      roundNumber: 0,
      endsAtMs: 0,
      round: null,
      lastResult: null,
      myScore: 0,
      opponentName: null,
      result: null,
    });
  },
}));
