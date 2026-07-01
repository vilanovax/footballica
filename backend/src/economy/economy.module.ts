import { Global, Module } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';

/**
 * ماژولِ اقتصاد — Global تا سرویسِ آن در موتورِ مچ و دوئل تزریق شود.
 */
@Global()
@Module({
  controllers: [EconomyController],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
