# پادکستِ خودکارِ فوتبالیکا

ماژولی که هر روز به‌صورت خودکار یک اپیزودِ پادکستِ فوتبالی می‌سازد: مهم‌ترین
اخبارِ ۲۴ ساعتِ گذشته، نتایجِ بازی‌های مهم، و یادآوریِ بازی‌های امروز و این هفته
را جمع می‌کند، به متنِ فارسیِ رادیویی تبدیل می‌کند، صدا می‌سازد، روی هاست آپلود
می‌کند، و فیدِ RSS را به‌روز می‌کند. سپس تا اجرای بعدی «منتظر می‌ماند».

کد در `backend/src/podcast/` است.

## زنجیرهٔ اجرا

```
PodcastScheduler (تیکِ هر دقیقه، وقتِ تهران)
  └─ ساعت که رسید و امروز اجرا نشده بود →
     PodcastService.runOnce()  ← با قفلِ Redis (بدونِ اجرای موازی)
        1. collect()      — FootballDataProvider: اخبار + نتایج + بازی‌های پیش‌رو
        2. رتبه‌بندی      — بر اساسِ importance، سقفِ N، تفکیکِ «امروز» و «این هفته»
        3. ScriptService  — متنِ فارسی (تاریخ جلالی، toFa) + SSML
        4. TtsService     — متن → فایلِ صوتی (فعلاً Mock: WAVِ سکوت)
        5. StorageProvider— آپلود (Google Drive یا محلی) → نشانیِ عمومی
        6. PodcastEpisode — ثبت در دیتابیس (منبعِ فید)
  └─ فیدِ RSS در GET /podcast/feed.xml از همین جدول ساخته می‌شود
```

## Endpointها

| متد | مسیر | توضیح |
|-----|------|-------|
| GET  | `/podcast/feed.xml`       | فیدِ RSSِ عمومی (سازگار با Spotify/کست‌باکس/iTunes) |
| GET  | `/podcast/episodes?limit` | فهرستِ اپیزودها (JSON) |
| POST | `/podcast/run`            | اجرای دستیِ کلِ زنجیره — نیازمندِ هدرِ `x-admin-key` |
| GET  | `/podcast/media/:file`    | سرو کردنِ فایلِ صوتی وقتی میزبان = local |

## اتوماتیک ماندن

`PODCAST_CRON_ENABLED=true` را بگذار. زمان‌بند بدونِ هیچ کتابخانهٔ جدیدی
(نه BullMQ نه `@nestjs/schedule`) کار می‌کند: یک `setInterval` هر ۶۰ ثانیه، و
یک کلیدِ Redis (`podcast:lastRunDay:<روز>`) که تضمین می‌کند فقط یک‌بار در روز و
فقط یک نمونهٔ سرور اجرا کند. برای دیپلویِ چند-نمونه‌ای همین کافی است.

> برای انتشار روی **Spotify**: فیدِ `feed.xml` را در Spotify for Podcasters ثبت
> کن؛ Spotify خودش فید را pull می‌کند. آپلودِ مستقیم لازم نیست.

## نقاطِ قابل‌تعویض (بدون دست‌زدن به بقیهٔ زنجیره)

هر سه از راهِ توکنِ تزریقِ NestJS جدا شده‌اند؛ فقط کلاسِ متصل به توکن را در
`podcast.module.ts` عوض کن:

### ۱) منبعِ داده — توکن `FOOTBALL_DATA`
اکنون `SampleFootballDataProvider` (دادهٔ نمونه). برای واقعی‌کردن، کلاسی بساز که
`FootballDataProvider` را implement کند (سه متد: `recentNews`, `recentResults`,
`upcoming`) — مثلاً با `fetch` به API-Football/football-data.org یا خواندنِ RSS
فیدهای خبری. قیدِ CLAUDE.md: سرویسِ غیرتحریمی.

### ۲) TTS — توکن `TTS`
اکنون `MockTtsService` که یک WAVِ سکوت به‌اندازهٔ مدتِ تخمینی می‌سازد (تا فید یک
فایلِ صوتیِ واقعی داشته باشد) و متن را کنارش `.txt` ذخیره می‌کند. برای صدای واقعی،
کلاسی بساز که `TtsService.synthesize` را با یک TTSِ فارسیِ غیرتحریمی پیاده کند.

### ۳) میزبان — توکن `STORAGE`
با `PODCAST_STORAGE` انتخاب می‌شود:
- `gdrive` → `GoogleDriveStorageProvider` (آپلودِ REST با `fetch`، بدونِ SDK سنگین).
  نیازمندِ `GDRIVE_ACCESS_TOKEN` (scope `drive.file`) و اختیاری `GDRIVE_FOLDER_ID`.
  فایل را عمومی می‌کند و لینکِ دانلودِ مستقیم را به‌عنوانِ enclosure می‌دهد.
- `local` → `LocalStorageProvider` (کپی زیرِ `public/podcast`، سرو از `/podcast/media`).

## دیتابیس

مدلِ `PodcastEpisode` (جدولِ `podcast_episodes`). مهاجرت:
`prisma/migrations/20260707120000_podcast_episodes/`. قبل از اجرا:

```bash
cd backend && npx prisma migrate deploy   # یا prisma migrate dev در توسعه
```

## متغیرهای محیطی

همه در `backend/.env.example` زیرِ بخشِ «پادکستِ خودکار» مستند شده‌اند.
