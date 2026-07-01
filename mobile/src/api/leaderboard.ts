import { api } from './client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
}

export interface MyRank {
  rank: number | null;
  score: number;
}

export function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  return api.get<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
}

export function getMyRank(): Promise<MyRank> {
  return api.get<MyRank>('/leaderboard/me');
}
