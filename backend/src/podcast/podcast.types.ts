// ============================================================
//  انواعِ مشترکِ پایپلاینِ پادکست
//  زنجیره: جمع‌آوری داده → رتبه‌بندی → متن → صوت → آپلود → فید
// ============================================================

/** یک خبرِ فوتبالیِ خام از منبع (RSS/API). */
export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  /** وزنِ اهمیت (۰..۱) — منبع یا مرحلهٔ رتبه‌بندی پر می‌کند. */
  importance: number;
}

/** نتیجهٔ یک بازیِ تمام‌شده. */
export interface MatchResult {
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  playedAt: Date;
  /** وزنِ اهمیتِ بازی (۰..۱) — دربی/تیم بزرگ بالاتر. */
  importance: number;
}

/** یک بازیِ پیشِ‌رو (امروز یا این هفته). */
export interface UpcomingMatch {
  competition: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;
  importance: number;
}

/** بستهٔ خامِ دادهٔ یک روز — ورودیِ مرحلهٔ متن‌سازی. */
export interface PodcastDigest {
  generatedAt: Date;
  news: NewsItem[];
  results: MatchResult[];
  today: UpcomingMatch[];
  thisWeek: UpcomingMatch[];
}

/** متنِ گویندگیِ آماده به‌همراه عنوان و توضیحِ اپیزود. */
export interface GeneratedScript {
  title: string;
  description: string;
  /** متنِ کاملِ خواندنی برای TTS. */
  ssml: string;
  /** تخمینِ مدتِ صوت به ثانیه (از تعداد واژه). */
  estimatedSeconds: number;
}

/** خروجیِ مرحلهٔ TTS — فایلِ صوتیِ محلی. */
export interface TtsResult {
  filePath: string;
  mimeType: string;
  byteSize: number;
  durationSec: number;
}

/** خروجیِ مرحلهٔ آپلود — نشانیِ عمومیِ فایل. */
export interface StorageResult {
  /** نشانیِ عمومیِ قابل‌پخش (enclosure در RSS). */
  publicUrl: string;
  /** شناسهٔ فایل در میزبان (مثلاً fileId گوگل‌درایو). */
  externalId?: string;
  provider: string;
}
