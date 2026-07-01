import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PowerupsService } from './powerups.service';
import { UsePowerupDto } from './dto/use-powerup.dto';
import { POWERUPS } from './powerup.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@Controller('powerups')
export class PowerupsController {
  constructor(private readonly powerups: PowerupsService) {}

  // کاتالوگِ پاورآپ‌ها (عمومی — برای نمایش در UI)
  @Get()
  catalog() {
    return Object.values(POWERUPS);
  }

  // استفاده از پاورآپ روی یک راندِ تک‌نفره (نیازمندِ ورود)
  @UseGuards(JwtAuthGuard)
  @Post('rounds/:roundId')
  use(
    @CurrentUser() user: JwtPayload,
    @Param('roundId') roundId: string,
    @Body() dto: UsePowerupDto,
  ) {
    return this.powerups.use(user.sub, roundId, dto.type, dto.pay);
  }
}
