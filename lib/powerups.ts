/** سوپرپاورهای قابلِ خرید و استفاده در بازی */
export type PowerUpId = "half" | "time" | "swap" | "var" | "defuse" | "glove";

export type PowerUpMode = "quiz" | "bomb" | "survival";

export type PowerUpCurrency = "coin" | "card";

export interface PowerUpDef {
  id: PowerUpId;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  currency: PowerUpCurrency;
  modes: PowerUpMode[];
}

export const POWERUP_CONFIG = {
  timeBonusSeconds: 5,
} as const;

export const POWERUPS: PowerUpDef[] = [
  {
    id: "half",
    name: "نصف‌نصف",
    emoji: "🧤",
    desc: "یک گزینهٔ غلط حذف شود",
    price: 30,
    currency: "coin",
    modes: ["quiz", "survival"],
  },
  {
    id: "time",
    name: "وقت اضافه",
    emoji: "⏱️",
    desc: `+${POWERUP_CONFIG.timeBonusSeconds} ثانیه به تایمر`,
    price: 30,
    currency: "coin",
    modes: ["quiz", "survival"],
  },
  {
    id: "swap",
    name: "تعویض سؤال",
    emoji: "🔄",
    desc: "سؤال را با یکیِ جدید عوض کن",
    price: 60,
    currency: "coin",
    modes: ["quiz", "survival"],
  },
  {
    id: "var",
    name: "VAR",
    emoji: "📺",
    desc: "بعد از اشتباه، یک‌بار دوباره جواب بده",
    price: 60,
    currency: "coin",
    modes: ["quiz"],
  },
  {
    id: "defuse",
    name: "دفعِ بمب",
    emoji: "💣",
    desc: "فتیله را به حریف بفرست",
    price: 3,
    currency: "card",
    modes: ["bomb"],
  },
  {
    id: "glove",
    name: "دستکشِ طلایی",
    emoji: "🥅",
    desc: "اولین اشتباه نادیده گرفته می‌شود",
    price: 4,
    currency: "card",
    modes: ["quiz", "survival"],
  },
];

export function powerUpDef(id: PowerUpId): PowerUpDef {
  const d = POWERUPS.find((p) => p.id === id);
  if (!d) throw new Error(`unknown powerup ${id}`);
  return d;
}

export function powerUpsForMode(mode: PowerUpMode): PowerUpDef[] {
  return POWERUPS.filter((p) => p.modes.includes(mode));
}

export type PowerUpInventory = Partial<Record<PowerUpId, number>>;

export function powerUpCount(inv: PowerUpInventory, id: PowerUpId): number {
  return inv[id] ?? 0;
}
