import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';

export const LEADERBOARD_KEY = 'leaderboard:global';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  // ---------- بالاترین‌ها ----------
  async top(limit: number): Promise<LeaderboardEntry[]> {
    // ZREVRANGE key 0 limit-1 WITHSCORES → [member, score, member, score, ...]
    const raw = await this.redis.zrevrange(
      LEADERBOARD_KEY,
      0,
      limit - 1,
      'WITHSCORES',
    );
    if (raw.length === 0) return [];

    const ids: string[] = [];
    const scores: number[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      ids.push(raw[i]);
      scores.push(Number(raw[i + 1]));
    }

    const nameById = await this.resolveNames(ids);

    return ids.map((userId, i) => ({
      rank: i + 1,
      userId,
      name: nameById.get(userId) ?? 'مهمان',
      score: scores[i],
    }));
  }

  // ---------- جایگاهِ یک کاربر ----------
  async forUser(
    userId: string,
  ): Promise<{ rank: number | null; score: number }> {
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(LEADERBOARD_KEY, userId),
      this.redis.zscore(LEADERBOARD_KEY, userId),
    ]);
    return {
      rank: rank == null ? null : rank + 1, // صفرمبنا → یک‌مبنا
      score: score == null ? 0 : Number(score),
    };
  }

  private async resolveNames(ids: string[]): Promise<Map<string, string>> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const map = new Map<string, string>();
    for (const u of users) map.set(u.id, u.name ?? 'مهمان');
    return map;
  }
}
