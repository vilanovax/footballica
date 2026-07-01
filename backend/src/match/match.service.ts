import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchEngineService, RoundView } from './match-engine.service';
import { CreateMatchDto } from './dto/create-match.dto';

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
  ) {}

  // ---------- ساخت مَچ تک‌نفره + شروع راند اول ----------
  async createMatch(dto: CreateMatchDto): Promise<CreateMatchResult> {
    const userId = await this.ensureUser(dto.userId);

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
