import { Module } from '@nestjs/common';
import { DuelController } from './duel.controller';
import { DuelService } from './duel.service';

@Module({
  controllers: [DuelController],
  providers: [DuelService],
})
export class DuelModule {}
