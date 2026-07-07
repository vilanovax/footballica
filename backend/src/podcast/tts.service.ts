import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { GeneratedScript, TtsResult } from './podcast.types';

export const TTS = 'TTS_SERVICE';

export interface TtsService {
  /** متنِ گویندگی را به فایلِ صوتیِ محلی تبدیل می‌کند. */
  synthesize(script: GeneratedScript, outDir: string): Promise<TtsResult>;
}

/**
 * پیاده‌سازیِ نمونه (Mock) — طبق انتخابِ کاربر.
 * یک فایلِ WAVِ معتبرِ «سکوت» به اندازهٔ مدتِ تخمینیِ متن می‌سازد (تا enclosureِ
 * فید یک فایلِ صوتیِ واقعی و قابل‌پخش باشد) و متنِ خوانده‌شده را کنارش .txt ذخیره
 * می‌کند تا در توسعه قابل‌بازبینی باشد.
 *
 * برای TTSِ واقعی: کلاسِ جدیدی بساز که همین اینترفیس را implement کند (fetch به
 * سرویسِ TTSِ فارسیِ غیرتحریمی) و در podcast.module آن را به توکنِ TTS بده.
 * بقیهٔ پایپلاین بدونِ تغییر کار می‌کند.
 */
@Injectable()
export class MockTtsService implements TtsService {
  private readonly logger = new Logger(MockTtsService.name);

  // پارامترهای WAVِ سبک: مونو، ۸ کیلوهرتز، ۸ بیت (بایت‌بر‌ثانیه = ۸۰۰۰).
  private readonly SAMPLE_RATE = 8000;
  private readonly BITS = 8;
  /** سقفِ مدتِ فایلِ ماک برای جلوگیری از فایلِ حجیم. */
  private readonly MAX_SECONDS = 600;

  async synthesize(
    script: GeneratedScript,
    outDir: string,
  ): Promise<TtsResult> {
    await fs.mkdir(outDir, { recursive: true });

    const seconds = Math.min(script.estimatedSeconds, this.MAX_SECONDS);
    const wav = this.buildSilentWav(seconds);

    const base = `episode-${script.estimatedSeconds}s-${wav.length}b`;
    const audioPath = join(outDir, `${base}.wav`);
    const scriptPath = join(outDir, `${base}.txt`);

    await fs.writeFile(audioPath, wav);
    await fs.writeFile(
      scriptPath,
      `# ${script.title}\n\n${script.description}\n\n${script.ssml}\n`,
      'utf8',
    );

    this.logger.log(
      `TTSِ ماک: فایلِ ${wav.length} بایتی برای ~${seconds} ثانیه ساخته شد`,
    );

    return {
      filePath: audioPath,
      mimeType: 'audio/wav',
      byteSize: wav.length,
      durationSec: seconds,
    };
  }

  /** یک بافرِ WAVِ PCMِ سکوت به مدتِ داده‌شده می‌سازد. */
  private buildSilentWav(seconds: number): Buffer {
    const dataLen = this.SAMPLE_RATE * seconds; // ۸ بیت مونو → ۱ بایت/سمپل
    const buf = Buffer.alloc(44 + dataLen);

    // RIFF header
    buf.write('RIFF', 0, 'ascii');
    buf.writeUInt32LE(36 + dataLen, 4);
    buf.write('WAVE', 8, 'ascii');

    // fmt chunk
    buf.write('fmt ', 12, 'ascii');
    buf.writeUInt32LE(16, 16); // اندازهٔ chunk
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(1, 22); // مونو
    buf.writeUInt32LE(this.SAMPLE_RATE, 24);
    buf.writeUInt32LE(this.SAMPLE_RATE * (this.BITS / 8), 28); // byteRate
    buf.writeUInt16LE(this.BITS / 8, 32); // blockAlign
    buf.writeUInt16LE(this.BITS, 34);

    // data chunk
    buf.write('data', 36, 'ascii');
    buf.writeUInt32LE(dataLen, 40);
    // در PCMِ ۸ بیتی، سکوت = مقدارِ ۱۲۸ (بایت‌ها از پیش با صفر پر شده‌اند؛
    // پرکردن با ۱۲۸ صدای بی‌نویز می‌دهد).
    buf.fill(128, 44);

    return buf;
  }
}
