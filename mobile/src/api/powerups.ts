// ============================================================
//  Powerups — کارت‌های سوپرپاور (بازیِ تک‌نفره). آینهٔ /powerups.
// ============================================================

import { api } from './client';
import type { RoundView } from './match';

export type PowerupType = 'fifty' | 'extra_time' | 'swap';

export interface Powerup {
  type: PowerupType;
  title: string;
  icon: string;
  cost: { cards: number; coins: number };
  seconds?: number;
}

export type PowerupResult =
  | { type: 'fifty'; removedOptionId: string }
  | { type: 'extra_time'; deadlineAt: string; addedSeconds: number }
  | {
      type: 'swap';
      round: Omit<RoundView, 'roundIndex'>;
    };

export function getPowerups(): Promise<Powerup[]> {
  return api.get<Powerup[]>('/powerups');
}

export function usePowerup(
  roundId: string,
  type: PowerupType,
  pay: 'card' | 'coin',
): Promise<PowerupResult> {
  return api.post<PowerupResult>(`/powerups/rounds/${roundId}`, { type, pay });
}
