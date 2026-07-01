import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StreakService } from './streak.service';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProgressController {
  constructor(
    private readonly streak: StreakService,
    private readonly achievements: AchievementsService,
  ) {}

  @Get('streak')
  streakStatus(@CurrentUser() user: JwtPayload) {
    return this.streak.status(user.sub);
  }

  @Post('streak/claim')
  claim(@CurrentUser() user: JwtPayload) {
    return this.streak.claim(user.sub);
  }

  @Get('achievements')
  list(@CurrentUser() user: JwtPayload) {
    return this.achievements.list(user.sub);
  }
}
