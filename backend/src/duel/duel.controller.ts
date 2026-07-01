import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DuelService } from './duel.service';
import { FindDuelDto } from './dto/find-duel.dto';
import { DuelAnswerDto } from './dto/duel-answer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@UseGuards(JwtAuthGuard)
@Controller('duels')
export class DuelController {
  constructor(private readonly duel: DuelService) {}

  // مچ‌میکینگ: به دوئلِ بازی بپیوند یا یکی بساز
  @Post('find')
  find(@CurrentUser() user: JwtPayload, @Body() dto: FindDuelDto) {
    return this.duel.findOrCreate(user.sub, dto.totalRounds ?? 5);
  }

  // دوئل‌های من (خانه)
  @Get()
  mine(@CurrentUser() user: JwtPayload) {
    return this.duel.listMine(user.sub);
  }

  // ثبتِ پاسخِ یک راندِ دوئل
  @Post('rounds/:roundId/answer')
  answer(
    @CurrentUser() user: JwtPayload,
    @Param('roundId') roundId: string,
    @Body() dto: DuelAnswerDto,
  ) {
    return this.duel.answer(user.sub, roundId, dto.optionId);
  }

  // راندِ بعدیِ من در این دوئل
  @Post(':id/next-round')
  nextRound(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.duel.nextRound(user.sub, id);
  }

  // وضعیتِ دوئل
  @Get(':id')
  state(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.duel.getState(user.sub, id);
  }
}
