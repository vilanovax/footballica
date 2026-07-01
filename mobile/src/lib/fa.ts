// ============================================================
//  ابزارِ فارسی — اعداد و تاریخ جلالی
//  قانون CLAUDE.md: همهٔ اعداد با toFa نمایش داده شوند.
// ============================================================

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل هر عددِ لاتین در رشته/عدد به رقم فارسی. */
export function toFa(input: number | string): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** نمایشِ امتیاز با علامت (+/−) و ارقام فارسی. */
export function toFaSigned(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return sign + toFa(Math.abs(n));
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/**
 * تبدیل میلادی به جلالی (الگوریتم استاندارد). خروجی: {jy, jm, jd}.
 */
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

/** نمایش کوتاهِ تاریخ جلالی، مثل «۱۰ تیر ۱۴۰۵». */
export function faDate(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
}
