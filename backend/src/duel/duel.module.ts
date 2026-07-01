import { Module } from '@nestjs/common';
import { DuelController } from './duel.controller';
import { DuelService } from './duel.service';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [BotsModule],
  controllers: [DuelController],
  providers: [DuelService],
})
export class DuelModule {}
