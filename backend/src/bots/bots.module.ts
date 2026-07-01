import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';

/**
 * ماژولِ ربات‌ها — سرویسِ مدیریت/انتخابِ ربات را هم به AdminModule
 * (برای CRUD) و هم به DuelModule (برای پرکردنِ دوئل) می‌دهد.
 */
@Module({
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
