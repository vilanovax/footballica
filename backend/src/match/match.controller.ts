import { Body, Controller, Param, Post } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchEngineService } from './match-engine.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { NextRoundDto } from './dto/next-round.dto';

@Controller()
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly engine: MatchEngineService,
  ) {}

  // ساخت مَچ تک‌نفره (QUICK یا BOMB) + شروع راند اول
  // پاسخ شاملِ گزینه‌هاست ولی ⚠️ بدونِ isCorrect.
  @Post('matches')
  createMatch(@Body() dto: CreateMatchDto) {
    return this.matchService.createMatch(dto);
  }

  // ثبت پاسخِ یک راند. درستی و زمان سمت سرور سنجیده می‌شود.
  @Post('rounds/:id/answer')
  submitAnswer(@Param('id') roundId: string, @Body() dto: SubmitAnswerDto) {
    return this.engine.submitAnswer(roundId, dto.userId, dto.optionId);
  }

  // شروع راند بعد (یا پایان مَچ اگر راندها تمام شده‌اند)
  @Post('matches/:id/next-round')
  nextRound(@Param('id') matchId: string, @Body() dto: NextRoundDto) {
    return this.matchService.nextRound(matchId, dto.userId);
  }
}
