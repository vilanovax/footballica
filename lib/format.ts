const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیلِ ارقامِ لاتین به فارسی */
export function faNum(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** جداکنندهٔ هزارگان + ارقامِ فارسی (مثلِ ۲٬۱۰۰) */
export function faCount(n: number): string {
  return faNum(n.toLocaleString("en-US")).replace(/,/g, "٬");
}

/** خلاصهٔ اعداد بزرگ: ۱۲۰۰ → ۱٫۲K */
export function faShort(n: number): string {
  if (n < 1000) return faNum(n);
  const k = n / 1000;
  const s = k % 1 === 0 ? String(k) : k.toFixed(1);
  return faNum(s.replace(".", "٫")) + "K";
}

/** پولِ بزرگ به‌سبکِ فارسی: ۱۵۰۰۰۰۰ → ۱٫۵م ، ۵۰۰۰۰ → ۵۰ه */
export function faMoney(n: number): string {
  n = Math.floor(n);
  if (n >= 1_000_000) {
    const m = Math.round((n / 1_000_000) * 10) / 10;
    return faNum(String(m).replace(".", "٫")) + "م";
  }
  if (n >= 1000) {
    return faNum(String(Math.round(n / 1000))) + "ه";
  }
  return faNum(n);
}
