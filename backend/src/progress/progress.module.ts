import { Global, Module } from '@nestjs/common';
import { StreakService } from './streak.service';
import { AchievementsService } from './achievements.service';
import { ProgressController } from './progress.controller';

/**
 * ماژولِ پیشرفت (استریک + اچیومنت) — Global تا AchievementsService
 * در پایانِ دوئل/مچ هم قابلِ فراخوانی باشد.
 */
@Global()
@Module({
  controllers: [ProgressController],
  providers: [StreakService, AchievementsService],
  exports: [AchievementsService, StreakService],
})
export class ProgressModule {}
