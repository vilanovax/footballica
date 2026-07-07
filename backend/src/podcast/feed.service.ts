import { Injectable } from '@nestjs/common';
import type { PodcastEpisode } from '@prisma/client';

/**
 * سازندهٔ فیدِ RSSِ استاندارد (سازگار با iTunes/Spotify/کست‌باکس).
 * پادگیرها همین فید را pull می‌کنند؛ انتشار روی Spotify هم از راهِ همین فیدِ
 * خودمیزبان انجام می‌شود، نه آپلودِ مستقیم.
 */
@Injectable()
export class FeedService {
  private readonly title = process.env.PODCAST_TITLE ?? 'پادکست روزانهٔ فوتبالیکا';
  private readonly description =
    process.env.PODCAST_DESCRIPTION ??
    'مهم‌ترین اخبار، نتایج و بازی‌های فوتبال — تولیدِ خودکار و روزانه.';
  private readonly author = process.env.PODCAST_AUTHOR ?? 'فوتبالیکا';
  private readonly link =
    process.env.PODCAST_LINK ?? 'https://footballica.example';
  private readonly image = process.env.PODCAST_IMAGE ?? '';
  private readonly language = process.env.PODCAST_LANGUAGE ?? 'fa-IR';
  private readonly feedUrl =
    process.env.PODCAST_FEED_URL ??
    'http://localhost:3000/podcast/feed.xml';

  build(episodes: PodcastEpisode[]): string {
    const items = episodes.map((e) => this.item(e)).join('\n');
    const imageTags = this.image
      ? `    <itunes:image href="${this.esc(this.image)}"/>\n` +
        `    <image><url>${this.esc(this.image)}</url><title>${this.esc(
          this.title,
        )}</title><link>${this.esc(this.link)}</link></image>\n`
      : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.esc(this.title)}</title>
    <link>${this.esc(this.link)}</link>
    <description>${this.esc(this.description)}</description>
    <language>${this.esc(this.language)}</language>
    <itunes:author>${this.esc(this.author)}</itunes:author>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Sports"/>
    <atom:link href="${this.esc(this.feedUrl)}" rel="self" type="application/rss+xml"/>
${imageTags}${items}
  </channel>
</rss>`;
  }

  private item(e: PodcastEpisode): string {
    const pubDate = e.publishedAt.toUTCString();
    const duration = this.hms(e.durationSec);
    return `    <item>
      <title>${this.esc(e.title)}</title>
      <description>${this.esc(e.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${this.esc(e.id)}</guid>
      <enclosure url="${this.esc(e.audioUrl)}" length="${e.byteSize}" type="${this.esc(
        e.mimeType,
      )}"/>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:author>${this.esc(this.author)}</itunes:author>
    </item>`;
  }

  /** ثانیه → HH:MM:SS (قالبِ itunes:duration). */
  private hms(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const p = (n: number): string => String(n).padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(s)}`;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
