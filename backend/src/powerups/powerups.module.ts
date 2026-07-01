import { Module } from '@nestjs/common';
import { PowerupsController } from './powerups.controller';
import { PowerupsService } from './powerups.service';

@Module({
  controllers: [PowerupsController],
  providers: [PowerupsService],
})
export class PowerupsModule {}
