import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@UseGuards(JwtAuthGuard)
@Controller('economy')
export class EconomyController {
  constructor(private readonly economy: EconomyService) {}

  // کیف‌پولِ فعلی (جان با بازیابیِ خودکار محاسبه می‌شود)
  @Get('wallet')
  wallet(@CurrentUser() user: JwtPayload) {
    return this.economy.getWallet(user.sub);
  }

  // پرکردنِ جان با سکه
  @Post('refill-lives')
  refill(@CurrentUser() user: JwtPayload) {
    return this.economy.refillLives(user.sub);
  }
}
