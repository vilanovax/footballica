// ============================================================
//  ابزارِ فارسی (بک‌اند) — اعداد و تاریخ جلالی + وقتِ تهران
//  قانون CLAUDE.md: همهٔ اعداد با toFa نمایش داده شوند، تاریخ جلالی.
//  نسخهٔ بک‌اندِ mobile/src/lib/fa.ts (این دو پکیج کدِ مشترک ندارند).
// ============================================================

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل هر رقمِ لاتین در رشته/عدد به رقم فارسی. */
export function toFa(input: number | string): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const WEEKDAYS_FA = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه',
];

/** تبدیل میلادی به جلالی (الگوریتم استاندارد). خروجی: {jy, jm, jd}. */
export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gDaysInMonth.slice(0, gm - 1).reduce((a, b) => a + b, 0);

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

/** نمایشِ کوتاهِ تاریخ جلالی، مثل «۱۰ تیر ۱۴۰۵». */
export function faDate(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
}

/** نامِ روزِ هفته به فارسی. */
export function faWeekday(date: Date): string {
  return WEEKDAYS_FA[date.getDay()];
}

/** ساعت و دقیقهٔ فعلی به وقتِ تهران — برای زمان‌بندیِ کرون. */
export function tehranHourMinute(date: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hour: hour % 24, minute };
}

/** کلیدِ روزِ تهران به‌صورت YYYY-MM-DD — برای «آیا امروز اجرا شده؟». */
export function tehranDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
