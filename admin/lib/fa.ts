const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(input: number | string): string {
  return String(input).replace(/\d/g, (d) => FA[Number(d)]);
}
