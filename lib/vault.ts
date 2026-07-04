/**
 * گاوصندوق / خزانهٔ باشگاه — هستهٔ اقتصاد.
 * درآمد واحدها و مسابقات وارد خزانه می‌شود (تا سقف ظرفیت) و مستقیم خرج می‌شود.
 * سطح آخر = بانکِ اسپانسر (بدون سقف ظرفیت).
 */
export interface VaultLevel {
  name: string;
  capacity: number; // سقفِ ذخیره (تومان)
  upgradeCost: number; // هزینهٔ ارتقا به سطحِ بعد (بودجه) — ۰ یعنی سطحِ نهایی
  note?: string;
  bank?: boolean;
}

export const VAULT_LEVELS: VaultLevel[] = [
  { name: "گاوصندوقِ آهنی", capacity: 5_000_000, upgradeCost: 8_000_000 },
  { name: "گاوصندوقِ باشگاه", capacity: 15_000_000, upgradeCost: 25_000_000 },
  {
    name: "گاوصندوقِ امنیتی",
    capacity: 50_000_000,
    upgradeCost: 80_000_000,
    note: "پاداشِ روزانهٔ کوچک",
  },
  {
    name: "خزانهٔ باشگاه",
    capacity: 150_000_000,
    upgradeCost: 250_000_000,
    note: "اتصال به مدیرِ مالی",
  },
  {
    name: "خزانهٔ VIP",
    capacity: 500_000_000,
    upgradeCost: 800_000_000,
    note: "درآمدِ آفلاینِ بیشتر",
  },
  {
    name: "بانکِ اسپانسر",
    capacity: 2_000_000_000,
    upgradeCost: 0,
    note: "بدون سقف ظرفیت",
    bank: true,
  },
];

export const VAULT_MAX = VAULT_LEVELS.length;

export function vaultInfo(level: number): VaultLevel {
  const i = Math.min(Math.max(1, level), VAULT_MAX) - 1;
  return VAULT_LEVELS[i];
}

export function vaultCapacity(level: number): number {
  return vaultInfo(level).capacity;
}

/** هزینهٔ ارتقا از سطحِ فعلی به بعدی (۰ اگر نهایی) */
export function vaultUpgradeCost(level: number): number {
  return vaultInfo(level).upgradeCost;
}

export function isBank(level: number): boolean {
  return Boolean(vaultInfo(level).bank);
}

/** درآمدِ انباشته در گاوصندوق تا این لحظه (مصون از زمانِ آفلاین، تا سقف) */
export function vaultAccrued(
  ratePerSecond: number,
  capacity: number,
  lastMs: number,
  nowMs: number,
): number {
  const elapsed = Math.max(0, (nowMs - lastMs) / 1000);
  return Math.min(capacity, Math.floor(elapsed * ratePerSecond));
}
