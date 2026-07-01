import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * توکنِ تزریقِ کلاینتِ Redis.
 * سرویس‌ها با @Inject(REDIS) به همین نمونه دسترسی می‌گیرند
 * (به‌جای ساختِ new Redis در هر سرویس — قابل‌تست و تک‌نمونه).
 */
export const REDIS = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (): Redis => {
        const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
        return new Redis(url, { maxRetriesPerRequest: null });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
