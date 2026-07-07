import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MatchModule } from './match/match.module';
import { AuthModule } from './auth/auth.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AdminModule } from './admin/admin.module';
import { DuelModule } from './duel/duel.module';
import { EconomyModule } from './economy/economy.module';
import { ProgressModule } from './progress/progress.module';
import { PowerupsModule } from './powerups/powerups.module';
import { PodcastModule } from './podcast/podcast.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    MatchModule,
    LeaderboardModule,
    AdminModule,
    DuelModule,
    EconomyModule,
    ProgressModule,
    PowerupsModule,
    PodcastModule,
  ],
})
export class AppModule {}
