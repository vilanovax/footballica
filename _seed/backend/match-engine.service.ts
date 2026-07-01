// ============================================================
//  match-engine.service.ts — قلبِ فنیِ فوتبالیکا
//  منطقِ server-authoritative: سرور زمان را کنترل می‌کند، درستی
//  را می‌سنجد، و امتیاز را بر مبنای سرعت/مود حساب می‌کند.
//
//  این فایل اسکلتِ مرجع برای Cursor/Claude Code است. بخش‌های
//  TODO را ایجنت بر اساس همین الگو کامل می‌کند.
//  وابستگی: @nestjs/common, prisma, ioredis
// ============================================================

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

// مدت هر مود به ثانیه (هم‌خوان با theme.timing در کلاینت)
const MODE_DURATION: Record<string, number> = {
  QUICK: 15,
  BOMB: 8,
  DUEL: 15,
};

// سقفِ امتیاز پایه برای جواب درست
const BASE_POINTS = 100;
const SPEED_BONUS = 50;   // حداکثر جایزهٔ سرعت
const BOMB_DEFUSE = 120;  // جایزهٔ خنثی‌کردن بمب
const BOMB_PENALTY = -150;

interface RoundView {
  roundId: string;
  roundIndex: number;
  question: { id: string; text: string; difficulty: string };
  // ⚠️ گزینه‌ها بدونِ isCorrect به کلاینت می‌روند
  options: { id: string; text: string; order: number }[];
  deadlineAt: string;     // کلاینت فقط برای نمایشِ تایمر استفاده می‌کند
  serverNow: string;      // برای سنکرونِ ساعتِ کلاینت
}

@Injectable()
export class MatchEngineService {
  private redis = new Redis(process.env.REDIS_URL!);

  constructor(private prisma: PrismaService) {}

  // ---------- شروع یک راند ----------
  // سرور سؤال را انتخاب می‌کند، deadline را تعیین و در Redis قفل می‌گذارد.
  async startRound(matchId: string, roundIndex: number): Promise<RoundView> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== 'ACTIVE') throw new NotFoundException('مَچ فعال نیست');

    const durationSec = MODE_DURATION[match.mode] ?? 15;

    // TODO(agent): انتخاب سؤالِ تأییدشده‌ای که کاربر قبلاً ندیده.
    // فعلاً سادهٔ تصادفی:
    const question = await this.pickQuestion(matchId);

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + durationSec * 1000);

    const round = await this.prisma.matchRound.create({
      data: { matchId, questionId: question.id, roundIndex, startedAt, deadlineAt },
      include: { question: { include: { options: true } } },
    });

    // قفلِ deadline در Redis با TTL — برای اعتبارسنجی سریع و جلوگیری از race
    await this.redis.set(
      `round:${round.id}:deadline`,
      deadlineAt.getTime(),
      'PX',
      durationSec * 1000 + 2000, // کمی حاشیه برای تأخیر شبکه
    );

    // خروجی برای کلاینت — بدونِ isCorrect
    return {
      roundId: round.id,
      roundIndex,
      question: {
        id: round.question.id,
        text: round.question.text,
        difficulty: round.question.difficulty,
      },
      options: round.question.options
        .sort((a, b) => a.order - b.order)
        .map((o) => ({ id: o.id, text: o.text, order: o.order })),
      deadlineAt: deadlineAt.toISOString(),
      serverNow: startedAt.toISOString(),
    };
  }

  // ---------- ثبت پاسخ ----------
  // زمان از روی startedAtِ ذخیره‌شده در سرور محاسبه می‌شود، نه از کلاینت.
  async submitAnswer(roundId: string, userId: string, optionId: string | null) {
    const round = await this.prisma.matchRound.findUnique({
      where: { id: roundId },
      include: { question: { include: { options: true } }, match: true },
    });
    if (!round) throw new NotFoundException('راند یافت نشد');

    // جلوگیری از پاسخِ دوباره
    const existing = await this.prisma.answer.findUnique({
      where: { roundId_userId: { roundId, userId } },
    });
    if (existing) throw new BadRequestException('قبلاً پاسخ داده‌ای');

    const now = Date.now();
    const deadline = round.deadlineAt.getTime();
    const startedAt = round.startedAt.getTime();

    // آیا دیر رسید؟ (با حاشیهٔ کوچک برای تأخیر شبکه)
    const isLate = now > deadline + 500;
    const msTaken = Math.max(0, now - startedAt);

    // درستی فقط سمت سرور
    const correctOption = round.question.options.find((o) => o.isCorrect);
    const isCorrect = !isLate && optionId != null && optionId === correctOption?.id;

    const points = this.calcPoints({
      mode: round.match.mode,
      isCorrect,
      isLate,
      msTaken,
      durationMs: (MODE_DURATION[round.match.mode] ?? 15) * 1000,
    });

    // ثبت پاسخ + به‌روزرسانیِ امتیازِ بازیکن (در یک تراکنش)
    const [answer] = await this.prisma.$transaction([
      this.prisma.answer.create({
        data: { roundId, questionId: round.questionId, userId, optionId, isCorrect, msTaken, points },
      }),
      this.prisma.matchPlayer.updateMany({
        where: { matchId: round.matchId, userId },
        data: { score: { increment: points } },
      }),
    ]);

    // به‌روزرسانی لیدربوردِ Redis
    if (points !== 0) {
      await this.redis.zincrby('leaderboard:global', points, userId);
    }

    // پاسخِ نهایی به کلاینت شاملِ optionِ درست است (حالا که قفل شد)
    return {
      isCorrect,
      isLate,
      points,
      correctOptionId: correctOption?.id, // برای نمایش تیک سبز
      msTaken,
    };
  }

  // ---------- محاسبهٔ امتیاز ----------
  private calcPoints(p: {
    mode: string; isCorrect: boolean; isLate: boolean; msTaken: number; durationMs: number;
  }): number {
    if (p.mode === 'BOMB') {
      // بمب: درست = خنثی، غلط یا دیر = انفجار
      return p.isCorrect ? BOMB_DEFUSE : BOMB_PENALTY;
    }
    if (!p.isCorrect) return 0;
    // جایزهٔ سرعت: هرچه زودتر، بیشتر (خطی، نزولی)
    const ratio = 1 - Math.min(p.msTaken / p.durationMs, 1);
    return BASE_POINTS + Math.round(SPEED_BONUS * ratio);
  }

  // TODO(agent): انتخاب سؤالِ تأییدشده و دیده‌نشده توسط کاربرانِ مَچ
  private async pickQuestion(_matchId: string) {
    const q = await this.prisma.question.findFirst({
      where: { isApproved: true },
      include: { options: true },
      // TODO: تصادفی‌سازی واقعی + فیلترِ دیده‌شده‌ها
    });
    if (!q) throw new NotFoundException('سؤالی موجود نیست');
    return q;
  }
}
