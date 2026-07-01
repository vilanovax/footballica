import { Injectable, BadRequestException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ECONOMY } from './economy.constants';

export interface WalletView {
  coins: number;
  fans: number;
  cards: number;
  lives: number;
  maxLives: number;
  /** ثانیه تا جانِ بعدی؛ ۰ یعنی پر است. */
  nextLifeInSec: number;
}

export interface Reward {
  coins?: number;
  fans?: number;
  cards?: number;
}

const REGEN_MS = ECONOMY.lives.regenMinutes * 60 * 1000;

@Injectable()
export class EconomyService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- کیف‌پول (با اعمالِ بازیابیِ جان) ----------
  async getWallet(userId: string): Promise<WalletView> {
    const user = await this.applyRegen(userId);
    return this.toWallet(user);
  }

  // ---------- بازیابیِ خودکارِ جان ----------
  // چند جان از آخرین محاسبه تا حالا پر شده را حساب و ذخیره می‌کند.
  async applyRegen(userId: string): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.lives >= ECONOMY.lives.max) return user;

    const now = Date.now();
    const elapsed = now - user.lastLifeRegenAt.getTime();
    if (elapsed < REGEN_MS) return user;

    const regened = Math.floor(elapsed / REGEN_MS);
    const newLives = Math.min(ECONOMY.lives.max, user.lives + regened);
    // مبنا را به‌اندازهٔ جان‌های پرشده جلو ببر (باقی‌ماندهٔ زمان حفظ شود)
    const advancedBy = (newLives - user.lives) * REGEN_MS;
    const newBase = new Date(user.lastLifeRegenAt.getTime() + advancedBy);

    return this.prisma.user.update({
      where: { id: userId },
      data: { lives: newLives, lastLifeRegenAt: newBase },
    });
  }

  // ---------- خرجِ یک جان (شروعِ بازی) ----------
  async spendLife(userId: string, reason: string): Promise<void> {
    const user = await this.applyRegen(userId);
    if (user.lives <= 0) {
      throw new BadRequestException('جان کافی نداری؛ صبر کن یا پرش کن.');
    }
    // اگر جان پر بود، تایمرِ بازیابی از همین حالا شروع شود
    const data: Prisma.UserUpdateInput = { lives: { decrement: 1 } };
    if (user.lives >= ECONOMY.lives.max) data.lastLifeRegenAt = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data }),
      this.tx(userId, 'LIVES', -1, reason),
    ]);
  }

  // ---------- اعطای جایزه ----------
  async award(userId: string, reward: Reward, reason: string): Promise<void> {
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    const data: Prisma.UserUpdateInput = {};
    if (reward.coins) {
      data.coins = { increment: reward.coins };
      ops.push(this.tx(userId, 'COINS', reward.coins, reason));
    }
    if (reward.fans) {
      data.fans = { increment: reward.fans };
      ops.push(this.tx(userId, 'FANS', reward.fans, reason));
    }
    if (reward.cards) {
      data.cards = { increment: reward.cards };
      ops.push(this.tx(userId, 'CARDS', reward.cards, reason));
    }
    if (ops.length === 0) return;
    ops.unshift(this.prisma.user.update({ where: { id: userId }, data }));
    await this.prisma.$transaction(ops);
  }

  // ---------- پرکردنِ جان با سکه ----------
  async refillLives(userId: string): Promise<WalletView> {
    const user = await this.applyRegen(userId);
    if (user.lives >= ECONOMY.lives.max) {
      throw new BadRequestException('جانت پر است.');
    }
    if (user.coins < ECONOMY.lives.refillCost) {
      throw new BadRequestException('سکهٔ کافی برای پرکردنِ جان نداری.');
    }
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          coins: { decrement: ECONOMY.lives.refillCost },
          lives: ECONOMY.lives.max,
          lastLifeRegenAt: new Date(),
        },
      }),
      this.tx(userId, 'COINS', -ECONOMY.lives.refillCost, 'refill_lives'),
      this.tx(userId, 'LIVES', ECONOMY.lives.max - user.lives, 'refill_lives'),
    ]);
    return this.toWallet(updated);
  }

  // ---------- کمکی‌ها ----------
  private tx(
    userId: string,
    currency: 'COINS' | 'FANS' | 'CARDS' | 'LIVES',
    amount: number,
    reason: string,
  ) {
    return this.prisma.walletTransaction.create({
      data: { userId, currency, amount, reason },
    });
  }

  private toWallet(user: User): WalletView {
    let nextLifeInSec = 0;
    if (user.lives < ECONOMY.lives.max) {
      const elapsed = Date.now() - user.lastLifeRegenAt.getTime();
      nextLifeInSec = Math.max(0, Math.ceil((REGEN_MS - elapsed) / 1000));
    }
    return {
      coins: user.coins,
      fans: user.fans,
      cards: user.cards,
      lives: user.lives,
      maxLives: ECONOMY.lives.max,
      nextLifeInSec,
    };
  }
}
