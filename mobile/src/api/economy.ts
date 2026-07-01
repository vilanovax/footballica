// ============================================================
//  Economy — کیف‌پول (سکه/هوادار/کارت/جان). آینهٔ /economy/*.
// ============================================================

import { api } from './client';

export interface Wallet {
  coins: number;
  fans: number;
  cards: number;
  lives: number;
  maxLives: number;
  nextLifeInSec: number;
}

export function getWallet(): Promise<Wallet> {
  return api.get<Wallet>('/economy/wallet');
}

export function refillLives(): Promise<Wallet> {
  return api.post<Wallet>('/economy/refill-lives');
}
