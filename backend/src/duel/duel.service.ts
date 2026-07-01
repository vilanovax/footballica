import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { DuelRound, Question, QuestionOption, User } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { BotsService } from '../bots/bots.service';
import { BOT_DIFFICULTY, DUEL_BOT_CONFIG } from '../bots/bot.constants';

const DUEL_DURATION_SEC = 15;
const BASE_POINTS = 100;
const SPEED_BONUS = 50;

export interface DuelRoundView {
  roundId: string;
  order: number;
  question: { id: string; text: string; difficulty: string };
  options: { id: string; text: string; order: number }[]; // ⚠️ بدون isCorrect
  deadlineAt: string;
  serverNow: string;
}

export interface FindDuelResult {
  matchId: string;
  status: 'waiting' | 'matched';
  totalRounds: number;
}

@Injectable()
export class DuelService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly bots: BotsService,
  ) {}

  // ---------- مچ‌میکینگِ ساده (async) ----------
  async findOrCreate(
    userId: string,
    totalRounds = 5,
  ): Promise<FindDuelResult> {
    await this.ensureUser(userId);

    // اگر خودم دوئلِ بازِ منتظری دارم، همان را برگردان
    const mineWaiting = await this.prisma.match.findFirst({
      where: {
        mode: 'DUEL',
        status: 'WAITING',
        players: { some: { userId } },
      },
    });
    if (mineWaiting) {
      return {
        matchId: mineWaiting.id,
        status: 'waiting',
        totalRounds: mineWaiting.totalRounds,
      };
    }

    // یک دوئلِ بازِ حریفِ دیگر پیدا کن (قدیمی‌ترین)
    const open = await this.prisma.match.findFirst({
      where: {
        mode: 'DUEL',
        status: 'WAITING',
        players: { none: { userId } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (open) {
      // بپیوند و فعال کن
      await this.prisma.$transaction([
        this.prisma.matchPlayer.create({
          data: { matchId: open.id, userId },
        }),
        this.prisma.match.update({
          where: { id: open.id },
          data: { status: 'ACTIVE' },
        }),
      ]);
      return { matchId: open.id, status: 'matched', totalRounds: open.totalRounds };
    }

    // در غیر این صورت، دوئلِ جدیدِ منتظر بساز + مجموعهٔ سؤالِ ثابت
    const questionIds = await this.pickQuestionIds(totalRounds);
    const match = await this.prisma.match.create({
      data: {
        mode: 'DUEL',
        status: 'WAITING',
        totalRounds,
        players: { create: { userId } },
        duelQuestions: {
          create: questionIds.map((questionId, order) => ({
            questionId,
            order,
          })),
        },
      },
    });
    return { matchId: match.id, status: 'waiting', totalRounds };
  }

  // ---------- راندِ بعدیِ همین بازیکن ----------
  async nextRound(
    userId: string,
    matchId: string,
  ): Promise<{ finishedLeg: true } | { finishedLeg: false; round: DuelRoundView }> {
    const match = await this.getPlayableMatch(matchId, userId);

    const answered = await this.prisma.duelRound.count({
      where: { matchId, userId, answeredAt: { not: null } },
    });
    if (answered >= match.totalRounds) return { finishedLeg: true };

    const order = answered;

    // اگر راندِ همین order قبلاً شروع شده ولی جواب داده نشده → ادامه بده
    const existing = await this.prisma.duelRound.findUnique({
      where: { matchId_userId_order: { matchId, userId, order } },
      include: { question: { include: { options: true } } },
    });
    if (existing && !existing.answeredAt) {
      return { finishedLeg: false, round: this.toView(existing, existing.question) };
    }

    // سؤالِ ثابتِ این order را از مجموعهٔ دوئل بگیر
    const dq = await this.prisma.duelQuestion.findUnique({
      where: { matchId_order: { matchId, order } },
      include: { question: { include: { options: true } } },
    });
    if (!dq) throw new NotFoundException('سؤالِ دوئل یافت نشد');

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + DUEL_DURATION_SEC * 1000);
    const round = await this.prisma.duelRound.create({
      data: {
        matchId,
        userId,
        questionId: dq.questionId,
        order,
        startedAt,
        deadlineAt,
      },
    });

    await this.redis.set(
      `duelround:${round.id}:deadline`,
      deadlineAt.getTime(),
      'PX',
      DUEL_DURATION_SEC * 1000 + 2000,
    );

    return { finishedLeg: false, round: this.toView(round, dq.question) };
  }

  // ---------- ثبتِ پاسخ ----------
  async answer(
    userId: string,
    roundId: string,
    optionId: string | null,
  ): Promise<{
    isCorrect: boolean;
    isLate: boolean;
    points: number;
    correctOptionId: string | undefined;
    msTaken: number;
    legFinished: boolean;
    matchFinished: boolean;
  }> {
    const round = await this.prisma.duelRound.findUnique({
      where: { id: roundId },
      include: { question: { include: { options: true } } },
    });
    if (!round) throw new NotFoundException('راند یافت نشد');
    if (round.userId !== userId)
      throw new ForbiddenException('این راندِ تو نیست');
    if (round.answeredAt) throw new BadRequestException('قبلاً پاسخ داده‌ای');

    if (
      optionId != null &&
      !round.question.options.some((o) => o.id === optionId)
    ) {
      throw new BadRequestException('گزینه متعلق به این سؤال نیست');
    }

    const now = Date.now();
    const isLate = now > round.deadlineAt.getTime() + 500;
    const msTaken = Math.max(0, now - round.startedAt.getTime());
    const correctOption = round.question.options.find((o) => o.isCorrect);
    const isCorrect =
      !isLate && optionId != null && optionId === correctOption?.id;
    const points = this.calcPoints(isCorrect, msTaken);

    await this.prisma.$transaction([
      this.prisma.duelRound.update({
        where: { id: roundId },
        data: { optionId, isCorrect, msTaken, points, answeredAt: new Date() },
      }),
      this.prisma.matchPlayer.updateMany({
        where: { matchId: round.matchId, userId },
        data: { score: { increment: points } },
      }),
    ]);

    if (points !== 0) {
      await this.redis.zincrby('leaderboard:global', points, userId);
    }

    // آیا لِگِ این بازیکن تمام شد؟
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: round.matchId },
    });
    const myAnswered = await this.prisma.duelRound.count({
      where: { matchId: round.matchId, userId, answeredAt: { not: null } },
    });
    const legFinished = myAnswered >= match.totalRounds;

    let matchFinished = false;
    if (legFinished) {
      matchFinished = await this.finalizeOrFillBot(round.matchId, userId);
    }

    return {
      isCorrect,
      isLate,
      points,
      correctOptionId: correctOption?.id,
      msTaken,
      legFinished,
      matchFinished,
    };
  }

  // ---------- وضعیتِ دوئل برای یک بازیکن ----------
  async getState(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { user: true } } },
    });
    if (!match || match.mode !== 'DUEL')
      throw new NotFoundException('دوئل یافت نشد');
    const me = match.players.find((p) => p.userId === userId);
    if (!me) throw new ForbiddenException('بازیکنِ این دوئل نیستی');
    const opp = match.players.find((p) => p.userId !== userId);

    const myAnswered = await this.prisma.duelRound.count({
      where: { matchId, userId, answeredAt: { not: null } },
    });
    const oppAnswered = opp
      ? await this.prisma.duelRound.count({
          where: { matchId, userId: opp.userId, answeredAt: { not: null } },
        })
      : 0;

    const finished = match.status === 'FINISHED';

    return {
      matchId,
      status: match.status,
      totalRounds: match.totalRounds,
      me: {
        answered: myAnswered,
        legFinished: myAnswered >= match.totalRounds,
        // امتیازِ خودم را همیشه می‌بینم
        score: me.score,
      },
      opponent: opp
        ? {
            name: opp.user.name ?? 'حریف',
            answered: oppAnswered,
            // امتیازِ حریف فقط بعد از پایانِ دوئل فاش می‌شود
            score: finished ? opp.score : null,
          }
        : null,
      result: finished
        ? {
            myScore: me.score,
            oppScore: opp?.score ?? 0,
            outcome:
              me.isWinner === true
                ? 'win'
                : opp?.isWinner === true
                  ? 'loss'
                  : 'draw',
          }
        : null,
    };
  }

  // ---------- دوئل‌های من (برای صفحهٔ خانه) ----------
  async listMine(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: { mode: 'DUEL', players: { some: { userId } } },
      include: { players: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const result = [];
    for (const m of matches) {
      const me = m.players.find((p) => p.userId === userId);
      const opp = m.players.find((p) => p.userId !== userId);
      const myAnswered = await this.prisma.duelRound.count({
        where: { matchId: m.id, userId, answeredAt: { not: null } },
      });
      result.push({
        matchId: m.id,
        status: m.status,
        totalRounds: m.totalRounds,
        myAnswered,
        myTurn: m.status === 'ACTIVE' && myAnswered < m.totalRounds,
        opponentName: opp?.user.name ?? (m.status === 'WAITING' ? null : 'حریف'),
        outcome:
          m.status === 'FINISHED'
            ? me?.isWinner === true
              ? 'win'
              : opp?.isWinner === true
                ? 'loss'
                : 'draw'
            : null,
      });
    }
    return result;
  }

  // ---------- کمکی‌ها ----------
  private calcPoints(isCorrect: boolean, msTaken: number): number {
    if (!isCorrect) return 0;
    const ratio = 1 - Math.min(msTaken / (DUEL_DURATION_SEC * 1000), 1);
    return BASE_POINTS + Math.round(SPEED_BONUS * ratio);
  }

  private toView(
    round: DuelRound,
    question: Question & { options: QuestionOption[] },
  ): DuelRoundView {
    return {
      roundId: round.id,
      order: round.order,
      question: {
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
      },
      options: question.options
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((o) => ({ id: o.id, text: o.text, order: o.order })),
      deadlineAt: round.deadlineAt.toISOString(),
      serverNow: new Date().toISOString(),
    };
  }

  // اگر هر دو بازیکن لِگ‌شان تمام شد، برنده را تعیین و دوئل را ببند.
  private async maybeFinalize(matchId: string): Promise<boolean> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { players: true },
    });
    if (match.status === 'FINISHED') return true;
    if (match.players.length < 2) return false;

    for (const p of match.players) {
      const answered = await this.prisma.duelRound.count({
        where: { matchId, userId: p.userId, answeredAt: { not: null } },
      });
      if (answered < match.totalRounds) return false; // یکی هنوز مانده
    }

    const [a, b] = match.players;
    const aWins = a.score > b.score;
    const bWins = b.score > a.score;
    await this.prisma.$transaction([
      this.prisma.match.update({
        where: { id: matchId },
        data: { status: 'FINISHED', finishedAt: new Date() },
      }),
      this.prisma.matchPlayer.update({
        where: { id: a.id },
        data: { isWinner: aWins ? true : bWins ? false : null },
      }),
      this.prisma.matchPlayer.update({
        where: { id: b.id },
        data: { isWinner: bWins ? true : aWins ? false : null },
      }),
    ]);
    return true;
  }

  // بازیکن می‌تواند لِگِ خودش را حتی در حالتِ WAITING (پیش از پیوستنِ حریف)
  // بازی کند — دوئل async است. فقط دوئلِ تمام‌شده/رهاشده قابلِ بازی نیست.
  private async getPlayableMatch(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });
    if (!match || match.mode !== 'DUEL')
      throw new NotFoundException('دوئل یافت نشد');
    if (match.status === 'FINISHED' || match.status === 'ABANDONED')
      throw new ForbiddenException('این دوئل تمام شده');
    if (!match.players.some((p) => p.userId === userId))
      throw new ForbiddenException('بازیکنِ این دوئل نیستی');
    return match;
  }

  // پس از اتمامِ لِگِ یک بازیکن:
  //  - اگر حریفِ (انسانیِ) دوم هست → اگر او هم تمام کرده، نهایی کن.
  //  - اگر هنوز حریفی نیست → یک ربات جایگزین کن، لِگش را شبیه‌سازی و نهایی کن.
  //    (از دید بازیکن، حریفی عادی است؛ isBot هرگز فاش نمی‌شود.)
  private async finalizeOrFillBot(
    matchId: string,
    _finisherUserId: string,
  ): Promise<boolean> {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { players: true },
    });

    if (match.players.length >= 2) {
      return this.maybeFinalize(matchId);
    }

    // فقط خودم در دوئلم و لِگم تمام شده → ربات را وارد کن
    if (!DUEL_BOT_CONFIG.fillEnabled) return false;
    const bot = await this.bots.pickRandom();
    if (!bot) return false; // رباتی تعریف نشده → دوئل منتظر می‌ماند

    await this.prisma.$transaction([
      this.prisma.matchPlayer.create({
        data: { matchId, userId: bot.id },
      }),
      this.prisma.match.update({
        where: { id: matchId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    await this.simulateBotLeg(matchId, bot);
    return this.maybeFinalize(matchId);
  }

  // شبیه‌سازیِ کاملِ لِگِ ربات روی همان مجموعهٔ سؤالِ ثابت.
  // دقت و سرعت از BOT_DIFFICULTY می‌آید. امتیازِ ربات وارد لیدربوردِ
  // سراسری نمی‌شود (تا رتبه‌بندی از ربات‌ها پاک بماند).
  private async simulateBotLeg(matchId: string, bot: User): Promise<void> {
    const params =
      BOT_DIFFICULTY[bot.botDifficulty ?? 'MEDIUM'] ?? BOT_DIFFICULTY.MEDIUM;

    const questions = await this.prisma.duelQuestion.findMany({
      where: { matchId },
      include: { question: { include: { options: true } } },
      orderBy: { order: 'asc' },
    });

    let botScore = 0;
    const now = Date.now();

    for (const dq of questions) {
      const options = dq.question.options;
      const correct = options.find((o) => o.isCorrect);
      const wrongs = options.filter((o) => !o.isCorrect);

      const answerCorrect = Math.random() < params.pCorrect && !!correct;
      const chosen = answerCorrect
        ? correct
        : wrongs[Math.floor(Math.random() * wrongs.length)] ?? null;

      const msTaken = randInt(params.minMs, params.maxMs);
      const points = this.calcPoints(answerCorrect, msTaken);
      botScore += points;

      const startedAt = new Date(now - msTaken);
      const deadlineAt = new Date(
        startedAt.getTime() + DUEL_DURATION_SEC * 1000,
      );

      await this.prisma.duelRound.create({
        data: {
          matchId,
          userId: bot.id,
          questionId: dq.questionId,
          order: dq.order,
          startedAt,
          deadlineAt,
          optionId: chosen?.id ?? null,
          isCorrect: answerCorrect,
          msTaken,
          points,
          answeredAt: new Date(),
        },
      });
    }

    await this.prisma.matchPlayer.updateMany({
      where: { matchId, userId: bot.id },
      data: { score: { increment: botScore } },
    });
    // عمداً بدونِ zincrby لیدربورد — ربات‌ها در رتبه‌بندی نمی‌آیند.
  }

  private async pickQuestionIds(count: number): Promise<string[]> {
    const rows = await this.prisma.question.findMany({
      where: { isApproved: true },
      select: { id: true },
    });
    if (rows.length < count) {
      throw new BadRequestException('سؤالِ کافی برای دوئل موجود نیست');
    }
    // درهم‌سازیِ Fisher–Yates و برداشتِ count تا
    const ids = rows.map((r) => r.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids.slice(0, count);
  }

  private async ensureUser(userId: string): Promise<void> {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!exists) throw new NotFoundException('کاربر یافت نشد');
  }
}

/** عددِ صحیحِ تصادفی در بازهٔ [min, max]. */
function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}
