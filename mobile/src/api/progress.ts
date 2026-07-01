// ============================================================
//  Progress — استریک روزانه + اچیومنت. آینهٔ /streak و /achievements.
// ============================================================

import { api } from './client';

export interface StreakReward {
  coins: number;
  cards?: number;
}

export interface StreakStatus {
  current: number;
  longest: number;
  canClaimToday: boolean;
  claimableDay: number;
  claimableReward: StreakReward;
}

export interface ClaimResult {
  current: number;
  longest: number;
  reward: StreakReward;
  unlocked: { key: string; title: string; icon: string }[];
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  reward: StreakReward;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export function getStreak(): Promise<StreakStatus> {
  return api.get<StreakStatus>('/streak');
}

export function claimStreak(): Promise<ClaimResult> {
  return api.post<ClaimResult>('/streak/claim');
}

export function getAchievements(): Promise<Achievement[]> {
  return api.get<Achievement[]>('/achievements');
}
