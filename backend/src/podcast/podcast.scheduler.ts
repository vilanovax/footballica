import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';
import { tehranDayKey, tehranHourMinute } from '../lib/fa';
import { PodcastService } from './podcast.service';

/**
 * زمان‌بندِ روزانه — بدونِ وابستگیِ جدید (نه BullMQ نه @nestjs/schedule).
 * هر دقیقه تیک می‌زند؛ وقتی ساعتِ تهران به هدف رسید و امروز هنوز اجرا نشده،
 * یک‌بار زنجیرهٔ تولید را صدا می‌زند. با کلیدِ Redis در برابرِ چند نمونهٔ سرور و
 * چند تیک در یک دقیقه ایمن است. این همان «منتظر ماندنِ اتوماتیک» است.
 *
 * env:
 *   PODCAST_CRON_ENABLED = 'true'   (پیش‌فرض خاموش تا ناخواسته اجرا نشود)
 *   PODCAST_HOUR         = '8'      (ساعتِ تهران)
 *   PODCAST_MINUTE       = '0'
 */
@Injectable()
export class PodcastScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PodcastScheduler.name);
  private readonly enabled = process.env.PODCAST_CRON_ENABLED === 'true';
  private readonly hour = Number(process.env.PODCAST_HOUR ?? 8);
  private readonly minute = Number(process.env.PODCAST_MINUTE ?? 0);
  private timer?: NodeJS.Timeout;

  /** روزی‌که همین نمونه اجرا کرده — گاردِ سریعِ درون‌فرایندی. */
  private ranForDay?: string;

  constructor(
    private readonly podcast: PodcastService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log(
        'زمان‌بندِ پادکست خاموش است (PODCAST_CRON_ENABLED!=true).',
      );
      return;
    }
    this.logger.log(
      `زمان‌بندِ پادکست فعال شد — هر روز ${this.hour}:${this.minute} به‌وقتِ تهران.`,
    );
    // هر ۶۰ ثانیه بررسی کن. unref تا مانعِ خروجِ پروسه نشود.
    this.timer = setInterval(() => void this.tick(), 60_000);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    const now = new Date();
    const { hour, minute } = tehranHourMinute(now);
    if (hour !== this.hour || minute !== this.minute) return;

    const dayKey = tehranDayKey(now);
    if (this.ranForDay === dayKey) return; // گاردِ درون‌فرایندی

    // گاردِ توزیع‌شده: فقط اولین نمونه‌ای که کلیدِ امروز را می‌گیرد اجرا می‌کند.
    const claimed = await this.redis.set(
      `podcast:lastRunDay:${dayKey}`,
      now.toISOString(),
      'EX',
      26 * 3600, // کمی بیش از یک روز
      'NX',
    );
    this.ranForDay = dayKey;
    if (claimed !== 'OK') return;

    try {
      await this.podcast.runOnce('cron');
    } catch (err) {
      this.logger.error(
        `اجرای زمان‌بندی‌شده شکست خورد: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }
}
