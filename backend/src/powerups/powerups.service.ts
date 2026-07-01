import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { EconomyService } from '../economy/economy.service';
import { POWERUPS, type PowerupType } from './powerup.constants';

const MODE_DURATION: Record<string, number> = { QUICK: 15, BOMB: 8, DUEL: 15 };

export type PowerupResult =
  | { type: 'fifty'; removedOptionId: string }
  | { type: 'extra_time'; deadlineAt: string; addedSeconds: number }
  | {
      type: 'swap';
      round: {
        roundId: string;
        question: { id: string; text: string; difficulty: string };
        options: { id: string; text: string; order: number }[];
        deadlineAt: string;
        serverNow: string;
      };
    };

@Injectable()
export class PowerupsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly economy: EconomyService,
  ) {}

  async use(
    userId: string,
    roundId: string,
    type: PowerupType,
    pay: 'card' | 'coin',
  ): Promise<PowerupResult> {
    const round = await this.prisma.matchRound.findUnique({
      where: { id: roundId },
      include: {
        question: { include: { options: true } },
        match: { include: { players: true } },
      },
    });
    if (!round) throw new NotFoundException('راند یافت نشد');
    if (!round.match.players.some((p) => p.userId === userId)) {
      throw new ForbiddenException('بازیکنِ این مَچ نیستی');
    }

    // نباید قبلاً جواب داده باشد یا زمان تمام شده باشد
    const answered = await this.prisma.answer.findUnique({
      where: { roundId_userId: { roundId, userId } },
    });
    if (answered) throw new BadRequestException('قبلاً پاسخ داده‌ای');
    if (Date.now() > round.deadlineAt.getTime() + 500) {
      throw new BadRequestException('زمانِ این سؤال تمام شده');
    }

    // هر پاورآپ فقط یک‌بار در هر راند
    const usedKey = `powerup:${roundId}`;
    const added = await this.redis.sadd(usedKey, type);
    if (added === 0) {
      throw new BadRequestException('این پاورآپ را در این سؤال زده‌ای');
    }
    await this.redis.expire(usedKey, 300);

    // هزینه را از کیف‌پول کم کن؛ اگر ناموفق بود رزرو را آزاد کن
    const def = POWERUPS[type];
    const cost =
      pay === 'card' ? { cards: def.cost.cards } : { coins: def.cost.coins };
    try {
      await this.economy.spend(userId, cost, `powerup_${type}`);
    } catch (e) {
      await this.redis.srem(usedKey, type);
      throw e;
    }

    if (type === 'fifty') return this.applyFifty(round);
    if (type === 'extra_time') return this.applyExtraTime(round);
    return this.applySwap(round);
  }

  // ✂️ یک گزینهٔ غلط را حذف کن
  private applyFifty(round: {
    question: { options: { id: string; isCorrect: boolean }[] };
  }): PowerupResult {
    const wrongs = round.question.options.filter((o) => !o.isCorrect);
    const removed = wrongs[Math.floor(Math.random() * wrongs.length)];
    return { type: 'fifty', removedOptionId: removed.id };
  }

  // ⏱️ چند ثانیه به deadline اضافه کن (سرور-محور)
  private async applyExtraTime(round: {
    id: string;
    deadlineAt: Date;
  }): Promise<PowerupResult> {
    const seconds = POWERUPS.extra_time.seconds ?? 7;
    const newDeadline = new Date(round.deadlineAt.getTime() + seconds * 1000);
    await this.prisma.matchRound.update({
      where: { id: round.id },
      data: { deadlineAt: newDeadline },
    });
    await this.redis.set(
      `round:${round.id}:deadline`,
      newDeadline.getTime(),
      'PX',
      seconds * 1000 + 20000,
    );
    return {
      type: 'extra_time',
      deadlineAt: newDeadline.toISOString(),
      addedSeconds: seconds,
    };
  }

  // 🔄 سؤال را با یکی دیگر عوض کن (تایمر ری‌ست می‌شود)
  private async applySwap(round: {
    id: string;
    matchId: string;
    match: { mode: string };
  }): Promise<PowerupResult> {
    const used = await this.prisma.matchRound.findMany({
      where: { matchId: round.matchId },
      select: { questionId: true },
    });
    const seen = used.map((r) => r.questionId);

    const where = {
      isApproved: true,
      ...(seen.length ? { id: { notIn: seen } } : {}),
    };
    const eligible = await this.prisma.question.count({ where });
    if (eligible === 0) throw new BadRequestException('سؤالِ جایگزینی نیست');
    const skip = Math.floor(Math.random() * eligible);
    const next = await this.prisma.question.findFirst({
      where,
      include: { options: true },
      skip,
      orderBy: { id: 'asc' },
    });
    if (!next) throw new BadRequestException('سؤالِ جایگزینی نیست');

    const durationSec = MODE_DURATION[round.match.mode] ?? 15;
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + durationSec * 1000);

    await this.prisma.matchRound.update({
      where: { id: round.id },
      data: { questionId: next.id, startedAt, deadlineAt },
    });
    await this.redis.set(
      `round:${round.id}:deadline`,
      deadlineAt.getTime(),
      'PX',
      durationSec * 1000 + 2000,
    );

    return {
      type: 'swap',
      round: {
        roundId: round.id,
        question: {
          id: next.id,
          text: next.text,
          difficulty: next.difficulty,
        },
        options: next.options
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ id: o.id, text: o.text, order: o.order })),
        deadlineAt: deadlineAt.toISOString(),
        serverNow: startedAt.toISOString(),
      },
    };
  }
}
