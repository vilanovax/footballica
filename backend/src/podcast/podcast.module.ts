import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PodcastController } from './podcast.controller';
import { PodcastService } from './podcast.service';
import { PodcastScheduler } from './podcast.scheduler';
import { ScriptService } from './script.service';
import { FeedService } from './feed.service';
import {
  FOOTBALL_DATA,
  SampleFootballDataProvider,
} from './providers/football-data.provider';
import { MockTtsService, TTS } from './tts.service';
import {
  GoogleDriveStorageProvider,
  LocalStorageProvider,
  STORAGE,
  type StorageProvider,
} from './storage.service';

/**
 * ماژولِ پادکستِ خودکار.
 *
 * قطعاتِ قابل‌تعویض (بدون دست‌زدن به بقیهٔ زنجیره) از راهِ توکنِ تزریق:
 *   FOOTBALL_DATA → منبعِ داده (فعلاً نمونه/Mock)
 *   TTS           → موتورِ صوت (فعلاً Mock، طبق انتخابِ کاربر)
 *   STORAGE       → میزبان (Google Drive یا Local — با PODCAST_STORAGE)
 */
@Module({
  imports: [PrismaModule],
  controllers: [PodcastController],
  providers: [
    PodcastService,
    PodcastScheduler,
    ScriptService,
    FeedService,
    { provide: FOOTBALL_DATA, useClass: SampleFootballDataProvider },
    { provide: TTS, useClass: MockTtsService },
    // انتخابِ میزبان با env: PODCAST_STORAGE=gdrive|local (پیش‌فرض: gdrive طبق انتخابِ کاربر)
    LocalStorageProvider,
    GoogleDriveStorageProvider,
    {
      provide: STORAGE,
      inject: [GoogleDriveStorageProvider, LocalStorageProvider],
      useFactory: (
        gdrive: GoogleDriveStorageProvider,
        local: LocalStorageProvider,
      ): StorageProvider => {
        const choice = process.env.PODCAST_STORAGE ?? 'gdrive';
        return choice === 'local' ? local : gdrive;
      },
    },
  ],
  exports: [PodcastService],
})
export class PodcastModule {}
