import { Injectable } from '@nestjs/common';
import { faDate, faWeekday, toFa } from '../lib/fa';
import type {
  GeneratedScript,
  MatchResult,
  NewsItem,
  PodcastDigest,
  UpcomingMatch,
} from './podcast.types';

/**
 * متن‌سازِ گویندگی — بستهٔ دادهٔ روز را به متنِ روانِ فارسیِ رادیویی تبدیل می‌کند.
 *
 * فعلاً قالب‌محور (template) است تا بدونِ وابستگی به LLM کار کند و قابل‌تست باشد.
 * برای ارتقا: خروجیِ همین سرویس را با یک LLMِ فارسی بازنویسی کن (لحن گرم‌تر)،
 * اما همین متن به‌عنوانِ fallback بماند.
 */
@Injectable()
export class ScriptService {
  /** میانگینِ سرعتِ گویندگیِ فارسی ~ ۲٫۵ واژه در ثانیه. */
  private readonly WORDS_PER_SEC = 2.5;

  build(digest: PodcastDigest): GeneratedScript {
    const d = digest.generatedAt;
    const lines: string[] = [];

    // ---- اینترو ----
    lines.push(
      `سلام و درود. به پادکستِ روزانهٔ فوتبالیکا خوش آمدید. ` +
        `امروز ${faWeekday(d)} ${faDate(d)} است. ` +
        `در این قسمت مهم‌ترین اخبارِ بیست‌وچهار ساعتِ گذشته، نتایجِ بازی‌های مهم، ` +
        `و یادآوریِ بازی‌های امروز و این هفته را با هم مرور می‌کنیم.`,
    );

    // ---- اخبار ----
    if (digest.news.length > 0) {
      lines.push('برویم سراغِ مهم‌ترین خبرها.');
      digest.news.forEach((n, i) => lines.push(this.newsLine(n, i)));
    }

    // ---- نتایج ----
    if (digest.results.length > 0) {
      lines.push('و اما نتایجِ مهم‌ترین بازی‌ها.');
      digest.results.forEach((r) => lines.push(this.resultLine(r)));
    }

    // ---- بازی‌های امروز ----
    if (digest.today.length > 0) {
      lines.push('حالا برنامهٔ امروز.');
      digest.today.forEach((m) => lines.push(this.todayLine(m)));
    } else {
      lines.push('برای امروز بازیِ مهمی در تقویم نداریم.');
    }

    // ---- بازی‌های این هفته ----
    if (digest.thisWeek.length > 0) {
      lines.push('و نگاهی به مهم‌ترین بازی‌های پیشِ‌روی این هفته.');
      digest.thisWeek.forEach((m) => lines.push(this.weekLine(m)));
    }

    // ---- اوترو ----
    lines.push(
      'این قسمت هم به پایان رسید. فردا دوباره با تازه‌ترین خبرها کنارتان هستیم. ' +
        'با فوتبالیکا همراه باشید. خداحافظ.',
    );

    const plain = lines.join('\n');
    const estimatedSeconds = Math.max(
      30,
      Math.round(this.wordCount(plain) / this.WORDS_PER_SEC),
    );

    return {
      title: `پادکست روزانهٔ فوتبالیکا — ${faDate(d)}`,
      description: this.buildDescription(digest),
      ssml: this.toSsml(lines),
      estimatedSeconds,
    };
  }

  // ---- خطوطِ متن ----

  private newsLine(n: NewsItem, i: number): string {
    return `خبرِ ${toFa(i + 1)}: ${n.title}. ${n.summary} (به نقل از ${n.source}).`;
  }

  private resultLine(r: MatchResult): string {
    const verb =
      r.homeScore === r.awayScore
        ? 'به تساوی رسیدند'
        : r.homeScore > r.awayScore
          ? `با نتیجهٔ ${toFa(r.homeScore)} بر ${toFa(r.awayScore)} به سودِ ${r.homeTeam} تمام شد`
          : `با نتیجهٔ ${toFa(r.awayScore)} بر ${toFa(r.homeScore)} به سودِ ${r.awayTeam} تمام شد`;
    if (r.homeScore === r.awayScore) {
      return `در ${r.competition}، ${r.homeTeam} و ${r.awayTeam} با تساویِ ${toFa(r.homeScore)} بر ${toFa(r.awayScore)} ${verb}.`;
    }
    return `در ${r.competition}، دیدارِ ${r.homeTeam} و ${r.awayTeam} ${verb}.`;
  }

  private todayLine(m: UpcomingMatch): string {
    return `امروز ساعتِ ${this.faClock(m.kickoffAt)}، در ${m.competition}، ${m.homeTeam} میزبانِ ${m.awayTeam} است.`;
  }

  private weekLine(m: UpcomingMatch): string {
    return `${faWeekday(m.kickoffAt)} ${faDate(m.kickoffAt)} ساعتِ ${this.faClock(m.kickoffAt)}، ${m.homeTeam} برابرِ ${m.awayTeam} در ${m.competition}.`;
  }

  private buildDescription(digest: PodcastDigest): string {
    const parts: string[] = [];
    if (digest.news.length)
      parts.push(`${toFa(digest.news.length)} خبرِ مهم`);
    if (digest.results.length)
      parts.push(`${toFa(digest.results.length)} نتیجه`);
    if (digest.today.length)
      parts.push(`${toFa(digest.today.length)} بازیِ امروز`);
    if (digest.thisWeek.length)
      parts.push(`${toFa(digest.thisWeek.length)} بازیِ این هفته`);
    return `خلاصهٔ ${parts.join('، ')} — تولیدِ خودکارِ فوتبالیکا.`;
  }

  // ---- کمکی ----

  /** ساعت به وقتِ تهران با رقمِ فارسی، مثل «۱۸:۳۰». */
  private faClock(date: Date): string {
    const s = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return toFa(s);
  }

  private wordCount(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  /**
   * پیچشِ ساده به SSML — با <break> بینِ بندها برای مکثِ طبیعی.
   * موتورهای TTSِ فارسی معمولاً SSML سبک را می‌پذیرند؛ اگر نه،
   * سرویسِ TTS می‌تواند تگ‌ها را strip کند.
   */
  private toSsml(lines: string[]): string {
    const body = lines
      .map((l) => `  <p>${this.escapeXml(l)}</p>`)
      .join('\n  <break time="600ms"/>\n');
    return `<speak>\n${body}\n</speak>`;
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
