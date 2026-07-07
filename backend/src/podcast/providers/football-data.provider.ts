import { Injectable } from '@nestjs/common';
import type {
  MatchResult,
  NewsItem,
  UpcomingMatch,
} from '../podcast.types';

/**
 * توکنِ تزریقِ منبعِ داده. با @Inject(FOOTBALL_DATA) به سرویس تزریق می‌شود
 * تا بتوان بعداً پیاده‌سازیِ واقعی (API-Football/football-data.org یا RSS)
 * را جایگزینِ نمونهٔ زیر کرد بدون دست‌زدن به بقیهٔ پایپلاین.
 */
export const FOOTBALL_DATA = 'FOOTBALL_DATA_PROVIDER';

export interface FootballDataProvider {
  /** اخبارِ بازهٔ اخیر (پیش‌فرض ۲۴ ساعت). */
  recentNews(sinceHours: number): Promise<NewsItem[]>;
  /** نتایجِ بازی‌های تمام‌شدهٔ بازهٔ اخیر. */
  recentResults(sinceHours: number): Promise<MatchResult[]>;
  /** بازی‌های پیشِ‌رو تا N روزِ آینده. */
  upcoming(withinDays: number): Promise<UpcomingMatch[]>;
}

/**
 * پیاده‌سازیِ نمونه (Mock) — دادهٔ ساختگیِ واقع‌نما نسبت به «حالا» تولید می‌کند
 * تا کلِ زنجیره بدون کلیدِ API قابل‌اجرا و تست باشد.
 *
 * برای اتصالِ منبعِ واقعی: کلاسِ جدیدی بساز که همین اینترفیس را implement کند
 * (مثلاً با fetch به API-Football)، و در podcast.module آن را به‌جای این
 * provider به توکنِ FOOTBALL_DATA بده. قیدِ CLAUDE.md: سرویسِ غیرتحریمی.
 */
@Injectable()
export class SampleFootballDataProvider implements FootballDataProvider {
  async recentNews(sinceHours: number): Promise<NewsItem[]> {
    const now = Date.now();
    const h = (n: number): Date => new Date(now - n * 3600_000);
    const cutoff = now - sinceHours * 3600_000;

    const all: NewsItem[] = [
      {
        title: 'قهرمانیِ زودهنگام در لیگ برتر قطعی شد',
        summary:
          'با بردِ دیشب، صدرنشین با اختلافِ نه امتیاز و سه هفته مانده به پایان، جام را عملاً قطعی کرد.',
        source: 'ورزش‌سه',
        url: 'https://example.com/news/1',
        publishedAt: h(3),
        importance: 0.95,
      },
      {
        title: 'مصدومیتِ ستارهٔ خط حمله پیش از دربی',
        summary:
          'کادر پزشکی از احتمالِ غیبتِ مهاجمِ اول تیم در دربیِ آخرِ هفته خبر داد.',
        source: 'ایسنا',
        url: 'https://example.com/news/2',
        publishedAt: h(8),
        importance: 0.8,
      },
      {
        title: 'انتقالِ زمستانیِ جنجالی نهایی شد',
        summary: 'باشگاه به‌طور رسمی جذبِ هافبکِ ملی‌پوش را اعلام کرد.',
        source: 'طرفداری',
        url: 'https://example.com/news/3',
        publishedAt: h(14),
        importance: 0.7,
      },
      {
        title: 'گفت‌وگو با سرمربی دربارهٔ برنامهٔ فصلِ بعد',
        summary: 'سرمربی از ماندنِ خود و تقویتِ خطِ دفاعی سخن گفت.',
        source: 'ورزش‌سه',
        url: 'https://example.com/news/4',
        publishedAt: h(20),
        importance: 0.5,
      },
      // خبرِ قدیمی‌تر از بازه — باید فیلتر شود
      {
        title: 'گزارشِ هفتهٔ گذشته',
        summary: 'مرورِ نتایجِ هفتهٔ پیش.',
        source: 'آرشیو',
        url: 'https://example.com/news/old',
        publishedAt: h(40),
        importance: 0.3,
      },
    ];

    return all.filter((n) => n.publishedAt.getTime() >= cutoff);
  }

  async recentResults(sinceHours: number): Promise<MatchResult[]> {
    const now = Date.now();
    const h = (n: number): Date => new Date(now - n * 3600_000);
    const cutoff = now - sinceHours * 3600_000;

    const all: MatchResult[] = [
      {
        competition: 'لیگ برتر',
        homeTeam: 'پرسپولیس',
        awayTeam: 'سپاهان',
        homeScore: 2,
        awayScore: 1,
        playedAt: h(4),
        importance: 0.9,
      },
      {
        competition: 'لیگ برتر',
        homeTeam: 'استقلال',
        awayTeam: 'تراکتور',
        homeScore: 0,
        awayScore: 0,
        playedAt: h(6),
        importance: 0.85,
      },
      {
        competition: 'لیگ قهرمانان آسیا',
        homeTeam: 'الهلال',
        awayTeam: 'النصر',
        homeScore: 3,
        awayScore: 2,
        playedAt: h(18),
        importance: 0.75,
      },
    ];

    return all.filter((r) => r.playedAt.getTime() >= cutoff);
  }

  async upcoming(withinDays: number): Promise<UpcomingMatch[]> {
    const now = Date.now();
    const inH = (n: number): Date => new Date(now + n * 3600_000);
    const limit = now + withinDays * 24 * 3600_000;

    const all: UpcomingMatch[] = [
      {
        competition: 'لیگ برتر',
        homeTeam: 'استقلال',
        awayTeam: 'پرسپولیس',
        kickoffAt: inH(6), // امروز
        importance: 1.0,
      },
      {
        competition: 'لیگ برتر',
        homeTeam: 'سپاهان',
        awayTeam: 'فولاد',
        kickoffAt: inH(10), // امروز
        importance: 0.6,
      },
      {
        competition: 'لیگ قهرمانان آسیا',
        homeTeam: 'پرسپولیس',
        awayTeam: 'الاتحاد',
        kickoffAt: inH(54), // این هفته
        importance: 0.9,
      },
      {
        competition: 'لیگ برتر',
        homeTeam: 'تراکتور',
        awayTeam: 'گل‌گهر',
        kickoffAt: inH(80), // این هفته
        importance: 0.55,
      },
    ];

    return all.filter((m) => m.kickoffAt.getTime() <= limit);
  }
}
