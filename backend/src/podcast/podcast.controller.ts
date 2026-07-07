import {
  Controller,
  DefaultValuePipe,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { basename, join } from 'path';
import { AdminGuard } from '../admin/admin.guard';
import { PodcastService } from './podcast.service';
import { FeedService } from './feed.service';

@Controller('podcast')
export class PodcastController {
  private readonly publicDir =
    process.env.PODCAST_PUBLIC_DIR ?? join(process.cwd(), 'public', 'podcast');

  constructor(
    private readonly podcast: PodcastService,
    private readonly feed: FeedService,
  ) {}

  /** فیدِ RSSِ عمومی — پادگیرها همین را pull می‌کنند. */
  @Get('feed.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  async feedXml(): Promise<string> {
    const episodes = await this.podcast.listEpisodes(50);
    return this.feed.build(episodes);
  }

  /** فهرستِ اپیزودها (JSON) — برای ادمین/کلاینت. */
  @Get('episodes')
  episodes(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.podcast.listEpisodes(Math.min(Math.max(limit, 1), 100));
  }

  /** اجرای دستیِ کلِ زنجیره (فقط ادمین) — برای تست یا انتشارِ فوری. */
  @UseGuards(AdminGuard)
  @Post('run')
  async run() {
    const episode = await this.podcast.runOnce('manual');
    if (!episode) {
      return { ok: false, message: 'اجرای دیگری در جریان بود یا داده‌ای نبود.' };
    }
    return { ok: true, episodeId: episode.id };
  }

  /** سرو کردنِ فایلِ صوتیِ محلی (وقتی میزبان = local است). */
  @Get('media/:file')
  media(@Param('file') file: string, @Res() res: Response): void {
    // جلوگیری از path traversal — فقط نامِ فایل، بدون مسیر.
    const safe = basename(file);
    const full = join(this.publicDir, safe);
    if (!existsSync(full)) {
      throw new NotFoundException('فایل یافت نشد');
    }
    res.setHeader('Content-Type', 'audio/wav');
    createReadStream(full).pipe(res);
  }
}
