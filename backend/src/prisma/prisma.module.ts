import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * ماژول سراسری تا PrismaService در همهٔ ماژول‌ها بدون import مجدد در دسترس باشد.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
