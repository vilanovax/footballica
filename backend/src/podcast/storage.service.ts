import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { basename, join } from 'path';
import type { StorageResult, TtsResult } from './podcast.types';

export const STORAGE = 'STORAGE_PROVIDER';

export interface StorageProvider {
  /** فایلِ صوتی را آپلود کرده و نشانیِ عمومیِ قابل‌پخش برمی‌گرداند. */
  upload(audio: TtsResult): Promise<StorageResult>;
}

/**
 * میزبانِ محلی (پیش‌فرضِ dev) — فایل را زیرِ پوشهٔ عمومی کپی می‌کند و نشانی را
 * بر پایهٔ PUBLIC_BASE_URL می‌سازد. برای زمانی‌که Google Drive تنظیم نشده.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly publicDir =
    process.env.PODCAST_PUBLIC_DIR ?? join(process.cwd(), 'public', 'podcast');
  private readonly baseUrl =
    process.env.PODCAST_PUBLIC_BASE_URL ?? 'http://localhost:3000/podcast/media';

  async upload(audio: TtsResult): Promise<StorageResult> {
    await fs.mkdir(this.publicDir, { recursive: true });
    const name = basename(audio.filePath);
    const dest = join(this.publicDir, name);
    await fs.copyFile(audio.filePath, dest);
    this.logger.log(`فایل به‌صورت محلی منتشر شد: ${dest}`);
    return {
      publicUrl: `${this.baseUrl.replace(/\/$/, '')}/${name}`,
      provider: 'local',
    };
  }
}

/**
 * میزبانِ Google Drive (انتخابِ کاربر). با REST + fetch آپلود می‌کند تا نیاز به
 * افزودنِ SDKِ سنگین (googleapis) نباشد.
 *
 * نیازمندِ env:
 *   GDRIVE_ACCESS_TOKEN  — توکنِ OAuth2 با scopeِ drive.file
 *   GDRIVE_FOLDER_ID     — (اختیاری) پوشهٔ مقصد
 *
 * توکن را باید بیرون از این سرویس (refresh flow) تازه نگه داری؛ اینجا صرفاً
 * مصرف می‌شود. اگر توکن نبود، خطا می‌دهد تا factory به Local برنگردد ناخواسته.
 */
@Injectable()
export class GoogleDriveStorageProvider implements StorageProvider {
  private readonly logger = new Logger(GoogleDriveStorageProvider.name);

  async upload(audio: TtsResult): Promise<StorageResult> {
    const token = process.env.GDRIVE_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        'GDRIVE_ACCESS_TOKEN تنظیم نشده — نمی‌توان روی Google Drive آپلود کرد.',
      );
    }
    const folderId = process.env.GDRIVE_FOLDER_ID;
    const name = basename(audio.filePath);
    const bytes = await fs.readFile(audio.filePath);

    // آپلودِ multipart: متادیتا (JSON) + محتوای فایل، در یک درخواست.
    const boundary = 'footballica-podcast-boundary';
    const metadata: Record<string, unknown> = { name, mimeType: audio.mimeType };
    if (folderId) metadata.parents = [folderId];

    const pre = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: ${audio.mimeType}\r\n\r\n`,
      'utf8',
    );
    const post = Buffer.from(`\r\n--${boundary}--`, 'utf8');
    const body = Buffer.concat([pre, bytes, post]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );
    if (!uploadRes.ok) {
      const t = await uploadRes.text();
      throw new Error(`آپلودِ Drive شکست خورد (${uploadRes.status}): ${t}`);
    }
    const { id } = (await uploadRes.json()) as { id: string };

    // عمومی‌کردن فایل تا enclosure برای پادگیرها قابل‌دانلود باشد.
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      },
    );
    if (!permRes.ok) {
      const t = await permRes.text();
      this.logger.warn(`عمومی‌کردنِ فایل شکست خورد (${permRes.status}): ${t}`);
    }

    this.logger.log(`روی Google Drive آپلود شد: fileId=${id}`);
    return {
      // لینکِ دانلودِ مستقیم — برای enclosureِ RSS مناسب است.
      publicUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      externalId: id,
      provider: 'gdrive',
    };
  }
}
