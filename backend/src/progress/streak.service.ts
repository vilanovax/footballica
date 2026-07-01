import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EconomyService } from '../economy/economy.service';
import { AchievementsService } from './achievements.service';
import { rewardForDay, type StreakReward } from './streak.constants';

export interface StreakStatus {
  current: number;
  longest: number;
  canClaimToday: boolean;
  // جایزه‌ای که اگر امروز claim کنی می‌گیری
  claimableDay: number;
  claimableReward: StreakReward;
}

@Injectable()
export class StreakService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly economy: EconomyService,
    private readonly achievements: AchievementsService,
  ) {}

  // ---------- وضعیتِ استریک ----------
  async status(userId: string): Promise<StreakStatus> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const today = dayString(0);
    const canClaimToday = user.streakLastDay !== today;
    const claimableDay = this.nextStreakValue(user.streakLastDay, user.streakCurrent);
    return {
      current: user.streakCurrent,
      longest: user.streakLongest,
      canClaimToday,
      claimableDay,
      claimableReward: rewardForDay(claimableDay),
    };
  }

  // ---------- گرفتنِ جایزهٔ امروز ----------
  async claim(userId: string): Promise<{
    current: number;
    longest: number;
    reward: StreakReward;
    unlocked: { key: string; title: string; icon: string }[];
  }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const today = dayString(0);
    if (user.streakLastDay === today) {
      throw new BadRequestException('امروز جایزهٔ استریکت را گرفته‌ای.');
    }

    const newStreak = this.nextStreakValue(user.streakLastDay, user.streakCurrent);
    const longest = Math.max(user.streakLongest, newStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        streakCurrent: newStreak,
        streakLongest: longest,
        streakLastDay: today,
      },
    });

    const reward = rewardForDay(newStreak);
    await this.economy.award(
      userId,
      { coins: reward.coins, cards: reward.cards },
      `streak_day_${newStreak}`,
    );

    // ممکن است اچیومنتِ استریک باز شود
    const unlocked = await this.achievements.check(userId);

    return {
      current: newStreak,
      longest,
      reward,
      unlocked: unlocked.map((a) => ({
        key: a.key,
        title: a.title,
        icon: a.icon,
      })),
    };
  }

  // اگر دیروز claim کرده بود → +۱، وگرنه استریک از ۱ شروع می‌شود.
  private nextStreakValue(lastDay: string | null, current: number): number {
    if (lastDay === dayString(0)) return current; // امروز قبلاً
    if (lastDay === dayString(-1)) return current + 1; // دیروز → ادامه
    return 1; // فاصله افتاده یا اولین بار
  }
}

/** رشتهٔ روز به‌صورت 'YYYY-MM-DD' در وقتِ تهران؛ offsetDays برای دیروز/فردا. */
function dayString(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
