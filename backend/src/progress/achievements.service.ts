import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EconomyService } from '../economy/economy.service';
import {
  ACHIEVEMENTS,
  type AchievementDef,
  type Metric,
} from './achievements.constants';

export interface AchievementView extends AchievementDef {
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number; // مقدارِ فعلیِ metric
}

interface Stats {
  totalCorrect: number;
  duelsPlayed: number;
  duelWins: number;
  bestStreak: number;
}

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly economy: EconomyService,
  ) {}

  // ---------- ارزیابی و بازکردنِ اچیومنت‌های جدید ----------
  // بعد از رویدادهای مهم (پایانِ دوئل/مچ، claimِ استریک) صدا زده می‌شود.
  async check(userId: string): Promise<AchievementDef[]> {
    const [stats, unlockedKeys] = await Promise.all([
      this.computeStats(userId),
      this.unlockedKeys(userId),
    ]);

    const newlyUnlocked: AchievementDef[] = [];
    for (const def of ACHIEVEMENTS) {
      if (unlockedKeys.has(def.key)) continue;
      if (this.metricValue(stats, def.metric) >= def.threshold) {
        await this.prisma.userAchievement.create({
          data: { userId, key: def.key },
        });
        await this.economy.award(userId, def.reward, `achievement_${def.key}`);
        newlyUnlocked.push(def);
      }
    }
    return newlyUnlocked;
  }

  // ---------- فهرست برای UI ----------
  async list(userId: string): Promise<AchievementView[]> {
    const [stats, rows] = await Promise.all([
      this.computeStats(userId),
      this.prisma.userAchievement.findMany({ where: { userId } }),
    ]);
    const byKey = new Map(rows.map((r) => [r.key, r.unlockedAt]));
    return ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: byKey.has(def.key),
      unlockedAt: byKey.get(def.key) ?? null,
      progress: this.metricValue(stats, def.metric),
    }));
  }

  // ---------- آمار ----------
  private async computeStats(userId: string): Promise<Stats> {
    const [answersCorrect, duelCorrect, duelsPlayed, duelWins, user] =
      await Promise.all([
        this.prisma.answer.count({ where: { userId, isCorrect: true } }),
        this.prisma.duelRound.count({ where: { userId, isCorrect: true } }),
        this.prisma.matchPlayer.count({
          where: { userId, match: { mode: 'DUEL' } },
        }),
        this.prisma.matchPlayer.count({
          where: { userId, isWinner: true, match: { mode: 'DUEL' } },
        }),
        this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      ]);
    return {
      totalCorrect: answersCorrect + duelCorrect,
      duelsPlayed,
      duelWins,
      bestStreak: user.streakLongest,
    };
  }

  private metricValue(stats: Stats, metric: Metric): number {
    return stats[metric];
  }

  private async unlockedKeys(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { key: true },
    });
    return new Set(rows.map((r) => r.key));
  }
}
