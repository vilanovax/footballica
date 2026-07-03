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

/** نمایش اصلی اقتصاد باشگاه — ۶٬۱۸۴٬۱۶۶ → ۶٬۱۸۴ میلیون تومان */
export function faClubMoney(n: number): { value: string; unit: "میلیون" | "میلیارد" } {
  n = Math.max(0, Math.floor(n));
  if (n >= 1_000_000_000) {
    const billions = n / 1_000_000_000;
    if (billions >= 10) {
      return { value: faCount(Math.round(billions)), unit: "میلیارد" };
    }
    const rounded = Math.round(billions * 10) / 10;
    return {
      value: faNum(String(rounded).replace(".", "٫")),
      unit: "میلیارد",
    };
  }
  return { value: faCount(Math.floor(n / 1000)), unit: "میلیون" };
}

export function faClubMoneyLabel(n: number): string {
  const { value, unit } = faClubMoney(n);
  return `${value} ${unit} تومان`;
}

/** گاوصندوق به میلیون واقعی — ۵٬۰۰۰٬۰۰۰ → ۵ */
export function faVaultM(n: number): string {
  return faNum(Math.max(0, Math.floor(n / 1_000_000)));
}
