import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { tehranDayKey } from '../lib/fa';
import { ScriptService } from './script.service';
import {
  FOOTBALL_DATA,
  type FootballDataProvider,
} from './providers/football-data.provider';
import { TTS, type TtsService } from './tts.service';
import { STORAGE, type StorageProvider } from './storage.service';
import type { PodcastDigest, UpcomingMatch } from './podcast.types';

/** قفلِ اجرا — جلوی اجرای هم‌زمانِ دو نمونهٔ سرور را می‌گیرد. */
const RUN_LOCK_KEY = 'podcast:run:lock';
const RUN_LOCK_TTL = 600; // ثانیه

@Injectable()
export class PodcastService {
  private readonly logger = new Logger(PodcastService.name);

  private readonly newsHours = Number(process.env.PODCAST_NEWS_HOURS ?? 24);
  private readonly resultHours = Number(process.env.PODCAST_RESULT_HOURS ?? 24);
  private readonly weekDays = Number(process.env.PODCAST_WEEK_DAYS ?? 7);
  private readonly maxNews = Number(process.env.PODCAST_MAX_NEWS ?? 5);
  private readonly maxResults = Number(process.env.PODCAST_MAX_RESULTS ?? 5);
  private readonly workDir =
    process.env.PODCAST_WORK_DIR ?? join(process.cwd(), 'storage', 'podcast');

  constructor(
    private readonly prisma: PrismaService,
    private readonly script: ScriptService,
    @Inject(FOOTBALL_DATA) private readonly data: FootballDataProvider,
    @Inject(TTS) private readonly tts: TtsService,
    @Inject(STORAGE) private readonly storage: StorageProvider,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /**
   * کلِ زنجیره را یک‌بار اجرا می‌کند و رکوردِ اپیزود را برمی‌گرداند.
   * با قفلِ Redis محافظت می‌شود؛ اگر اجرای دیگری در جریان باشد، برمی‌گردد null.
   */
  async runOnce(trigger: 'cron' | 'manual'): Promise<{ id: string } | null> {
    const locked = await this.redis.set(
      RUN_LOCK_KEY,
      new Date().toISOString(),
      'EX',
      RUN_LOCK_TTL,
      'NX',
    );
    if (locked !== 'OK') {
      this.logger.warn('اجرای پادکست در جریان است؛ این فراخوانی رد شد.');
      return null;
    }

    try {
      this.logger.log(`شروعِ تولیدِ پادکست (${trigger})`);

      // ۱) جمع‌آوری داده
      const digest = await this.collect();

      // اگر هیچ محتوایی نبود، اپیزودِ خالی نساز.
      const hasContent =
        digest.news.length +
          digest.results.length +
          digest.today.length +
          digest.thisWeek.length >
        0;
      if (!hasContent) {
        this.logger.warn('دادهٔ کافی برای اپیزودِ امروز نبود؛ رد شد.');
        return null;
      }

      // ۲) متن‌سازی
      const script = this.script.build(digest);

      // ۳) TTS
      const audio = await this.tts.synthesize(script, this.workDir);

      // ۴) آپلود
      const stored = await this.storage.upload(audio);

      // ۵) ثبتِ اپیزود (فید از همین جدول ساخته می‌شود)
      const episode = await this.prisma.podcastEpisode.create({
        data: {
          title: script.title,
          description: script.description,
          audioUrl: stored.publicUrl,
          mimeType: audio.mimeType,
          byteSize: audio.byteSize,
          durationSec: audio.durationSec,
          scriptText: script.ssml,
          storageProvider: stored.provider,
          externalId: stored.externalId ?? null,
          sourceMeta: {
            trigger,
            news: digest.news.length,
            results: digest.results.length,
            today: digest.today.length,
            thisWeek: digest.thisWeek.length,
          },
        },
        select: { id: true },
      });

      this.logger.log(`اپیزود ساخته شد: ${episode.id} → ${stored.publicUrl}`);
      return episode;
    } catch (err) {
      this.logger.error(
        `تولیدِ پادکست شکست خورد: ${err instanceof Error ? err.message : err}`,
      );
      throw err;
    } finally {
      await this.redis.del(RUN_LOCK_KEY);
    }
  }

  /** جمع‌آوری + رتبه‌بندی + تفکیکِ امروز/این‌هفته. */
  private async collect(): Promise<PodcastDigest> {
    const now = new Date();
    const [news, results, upcoming] = await Promise.all([
      this.data.recentNews(this.newsHours),
      this.data.recentResults(this.resultHours),
      this.data.upcoming(this.weekDays),
    ]);

    const topNews = [...news]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, this.maxNews);
    const topResults = [...results]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, this.maxResults);

    const todayKey = tehranDayKey(now);
    const byKickoff = (a: UpcomingMatch, b: UpcomingMatch): number =>
      a.kickoffAt.getTime() - b.kickoffAt.getTime();

    const today = upcoming
      .filter((m) => tehranDayKey(m.kickoffAt) === todayKey)
      .sort(byKickoff);
    const thisWeek = upcoming
      .filter((m) => tehranDayKey(m.kickoffAt) !== todayKey)
      .sort((a, b) => b.importance - a.importance || byKickoff(a, b));

    return { generatedAt: now, news: topNews, results: topResults, today, thisWeek };
  }

  /** آخرین اپیزودها — برای فید و API. */
  listEpisodes(limit: number) {
    return this.prisma.podcastEpisode.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }
}
