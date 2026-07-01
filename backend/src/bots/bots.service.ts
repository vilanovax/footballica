import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { BotDifficulty, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminBotView {
  id: string;
  name: string | null;
  avatar: string | null;
  difficulty: BotDifficulty | null;
  createdAt: Date;
  duelsPlayed: number;
}

@Injectable()
export class BotsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- CRUD (ادمین) ----------
  async create(input: {
    name: string;
    difficulty: BotDifficulty;
    avatar?: string;
  }): Promise<AdminBotView> {
    // شمارهٔ مصنوعیِ یکتا؛ ربات هرگز واقعاً وارد نمی‌شود.
    const phone = `bot:${Math.random().toString(36).slice(2, 12)}`;
    const bot = await this.prisma.user.create({
      data: {
        phone,
        name: input.name,
        avatar: input.avatar ?? null,
        isBot: true,
        botDifficulty: input.difficulty,
      },
    });
    return this.toView(bot, 0);
  }

  async list(): Promise<AdminBotView[]> {
    const bots = await this.prisma.user.findMany({
      where: { isBot: true },
      orderBy: { createdAt: 'desc' },
    });
    // تعدادِ دوئل‌های هر ربات
    const views: AdminBotView[] = [];
    for (const b of bots) {
      const duelsPlayed = await this.prisma.matchPlayer.count({
        where: { userId: b.id },
      });
      views.push(this.toView(b, duelsPlayed));
    }
    return views;
  }

  async update(
    id: string,
    input: { name?: string; difficulty?: BotDifficulty; avatar?: string },
  ): Promise<AdminBotView> {
    await this.assertBot(id);
    const bot = await this.prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.difficulty !== undefined
          ? { botDifficulty: input.difficulty }
          : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      },
    });
    const duelsPlayed = await this.prisma.matchPlayer.count({
      where: { userId: id },
    });
    return this.toView(bot, duelsPlayed);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    await this.assertBot(id);
    const played = await this.prisma.matchPlayer.count({ where: { userId: id } });
    if (played > 0) {
      // حذفِ رباتی که بازی کرده، تاریخچهٔ دوئل‌ها را می‌شکند.
      throw new BadRequestException(
        'این ربات در دوئل‌هایی شرکت کرده و قابلِ حذف نیست.',
      );
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // ---------- انتخابِ ربات برای مچ‌میکینگ ----------
  // فعلاً تصادفی؛ در آینده می‌توان بر اساسِ سطحِ بازیکن درجهٔ سختی را تطبیق داد.
  async pickRandom(): Promise<User | null> {
    const total = await this.prisma.user.count({ where: { isBot: true } });
    if (total === 0) return null;
    const skip = Math.floor(Math.random() * total);
    return this.prisma.user.findFirst({
      where: { isBot: true },
      skip,
      orderBy: { id: 'asc' },
    });
  }

  private async assertBot(id: string): Promise<void> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u || !u.isBot) throw new NotFoundException('ربات یافت نشد');
  }

  private toView(u: User, duelsPlayed: number): AdminBotView {
    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      difficulty: u.botDifficulty,
      createdAt: u.createdAt,
      duelsPlayed,
    };
  }
}
