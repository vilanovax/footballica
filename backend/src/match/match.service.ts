import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MatchEngineService, RoundView } from './match-engine.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { EconomyService } from '../economy/economy.service';
import { ECONOMY } from '../economy/economy.constants';

export interface CreateMatchResult {
  matchId: string;
  mode: string;
  totalRounds: number;
  round: RoundView;
}

export interface NextRoundResult {
  finished: boolean;
  round?: RoundView;
  // وقتی مَچ تمام می‌شود، خلاصهٔ نتیجه برمی‌گردد
  summary?: { matchId: string; score: number; totalRounds: number };
}

@Injectable()
export class MatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: MatchEngineService,
    private readonly economy: EconomyService,
  ) {}

  // ---------- ساخت مَچ تک‌نفره + شروع راند اول ----------
  async createMatch(dto: CreateMatchDto): Promise<CreateMatchResult> {
    const userId = await this.ensureUser(dto.userId);

    // خرجِ جان فقط برای کاربرانِ واقعی (مهمان/ربات معاف‌اند تا فاز۰ نشکند)
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (isRealUser(user)) {
      await this.economy.spendLife(userId, 'quick_start');
    }

    const match = await this.prisma.match.create({
      data: {
        mode: dto.mode,
        totalRounds: dto.totalRounds ?? 5,
        players: { create: { userId } },
      },
    });

    const round = await this.engine.startRound(match.id, 0);

    return {
      matchId: match.id,
      mode: match.mode,
      totalRounds: match.totalRounds,
      round,
    };
  }

  // ---------- شروع راند بعد (یا پایان مَچ) ----------
  async nextRound(matchId: string, userId: string): Promise<NextRoundResult> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true, rounds: true },
    });
    if (!match) throw new NotFoundException('مَچ یافت نشد');
    if (match.status !== 'ACTIVE')
      throw new ForbiddenException('مَچ فعال نیست');

    const player = match.players.find((p) => p.userId === userId);
    if (!player) throw new ForbiddenException('بازیکنِ این مَچ نیستی');

    const playedRounds = match.rounds.length;

    // آیا به تعداد راندهای مقرر رسیده‌ایم؟
    if (playedRounds >= match.totalRounds) {
      return this.finishMatch(matchId, userId);
    }

    const round = await this.engine.startRound(matchId, playedRounds);
    return { finished: false, round };
  }

  // ---------- پایان مَچ ----------
  private async finishMatch(
    matchId: string,
    userId: string,
  ): Promise<NextRoundResult> {
    const player = await this.prisma.matchPlayer.findFirst({
      where: { matchId, userId },
    });

    await this.prisma.$transaction([
      this.prisma.match.update({
        where: { id: matchId },
        data: { status: 'FINISHED', finishedAt: new Date() },
      }),
      // در تک‌نفره، بازیکن همیشه «برنده»ی مَچِ خودش است
      this.prisma.matchPlayer.updateMany({
        where: { matchId, userId },
        data: { isWinner: true },
      }),
    ]);

    // 🪙 سکه برای کاربرِ واقعی: پاداشِ اتمام + به‌ازای هر جوابِ درست
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (isRealUser(user)) {
      const correct = await this.prisma.answer.count({
        where: { userId, isCorrect: true, round: { matchId } },
      });
      await this.economy.award(
        userId,
        { coins: ECONOMY.coins.winQuick + correct * ECONOMY.coins.perCorrect },
        'quick_finish',
      );
    }

    return {
      finished: true,
      summary: {
        matchId,
        score: player?.score ?? 0,
        totalRounds: (
          await this.prisma.match.findUniqueOrThrow({ where: { id: matchId } })
        ).totalRounds,
      },
    };
  }

  // ---------- کاربرِ مهمان (تا فاز ۱/Auth) ----------
  // اگر کاربر با این id وجود نداشت، یک کاربرِ مهمان می‌سازد تا حلقهٔ
  // تک‌نفره بدون Auth هم قابل‌اجرا باشد.
  private async ensureUser(userId: string): Promise<string> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (existing) return existing.id;

    const guest = await this.prisma.user.create({
      data: {
        id: userId,
        phone: `guest_${userId}`,
        name: 'مهمان',
      },
    });
    return guest.id;
  }
}

/** کاربرِ واقعی = نه ربات و نه مهمان (اقتصاد فقط برای این‌ها اعمال می‌شود). */
function isRealUser(user: User): boolean {
  return (
    !user.isBot &&
    !user.phone.startsWith('guest_') &&
    !user.phone.startsWith('bot:')
  );
}
