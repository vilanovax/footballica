/**
 * مدیرانِ باشگاه — نیروی کلیدی.
 * استخدام (با بودجه) → انتصاب به یک واحد → اتوماسیونِ برداشت + ضریبِ درآمد + ضریبِ سرعت.
 * target = idِ واحد یا "all" (روی هر واحدی می‌نشیند).
 * آواتارها: فایل‌ها را در public/managers/ بگذار (m1.png ... m10.png)؛ تا آن‌موقع ایموجی fallback است.
 */
export type Rarity = "معمولی" | "حرفه‌ای" | "ستاره" | "افسانه‌ای";

export interface ManagerDef {
  id: string;
  name: string;
  target: string; // unitId یا "all"
  incomeMult: number; // مثلاً ۱٫۳۵
  speedMult: number; // مثلاً ۱٫۲ (۲۰٪ سریع‌تر)
  cost: number; // هزینهٔ استخدام (بودجه)
  rarity: Rarity;
  img: string;
  emoji: string;
}

export const MANAGERS: ManagerDef[] = [
  // --- فروشگاه ---
  { id: "m_frog", name: "دستیارِ تازه‌کار", target: "shop", incomeMult: 1.1, speedMult: 1.05, cost: 10_000_000, rarity: "معمولی", img: "/managers/m7.png", emoji: "🐸" },
  { id: "m_afro", name: "مدیرِ فروشِ حرفه‌ای", target: "shop", incomeMult: 1.35, speedMult: 1.15, cost: 50_000_000, rarity: "حرفه‌ای", img: "/managers/m4.png", emoji: "🧑🏾‍💼" },
  { id: "m_queen", name: "مدیرِ فروشِ ستاره", target: "shop", incomeMult: 1.5, speedMult: 1.15, cost: 150_000_000, rarity: "ستاره", img: "/managers/m2.png", emoji: "👸" },
  { id: "m_goggles", name: "مدیرِ نوآور", target: "shop", incomeMult: 1.65, speedMult: 1.1, cost: 260_000_000, rarity: "افسانه‌ای", img: "/managers/m10.png", emoji: "👩‍🔬" },

  // --- بلیت‌فروشی ---
  { id: "m_glasses", name: "مسئولِ گیشه", target: "tickets", incomeMult: 1.1, speedMult: 1.05, cost: 15_000_000, rarity: "معمولی", img: "/managers/m9.png", emoji: "🧑‍💼" },
  { id: "m_pirate", name: "مدیرِ بلیت", target: "tickets", incomeMult: 1.25, speedMult: 1.2, cost: 60_000_000, rarity: "حرفه‌ای", img: "/managers/m6.png", emoji: "🏴‍☠️" },
  { id: "m_monster", name: "مدیرِ ورزشگاه", target: "tickets", incomeMult: 1.45, speedMult: 1.15, cost: 130_000_000, rarity: "ستاره", img: "/managers/m3.png", emoji: "👾" },

  // --- غرفهٔ خوراکی ---
  { id: "m_food", name: "مدیرِ غرفه", target: "food", incomeMult: 1.2, speedMult: 1.15, cost: 25_000_000, rarity: "حرفه‌ای", img: "", emoji: "🌭" },
  // --- پارکینگ ---
  { id: "m_park", name: "مدیرِ پارکینگ", target: "parking", incomeMult: 1.15, speedMult: 1.1, cost: 20_000_000, rarity: "معمولی", img: "", emoji: "🅿️" },
  // --- اسپانسر ---
  { id: "m_sponsor", name: "مدیرِ اسپانسرینگ", target: "sponsor", incomeMult: 1.5, speedMult: 1.1, cost: 140_000_000, rarity: "ستاره", img: "", emoji: "🤝" },
  // --- آکادمی ---
  { id: "m_academy", name: "مدیرِ آکادمی", target: "academy", incomeMult: 1.25, speedMult: 1.15, cost: 80_000_000, rarity: "حرفه‌ای", img: "", emoji: "🎓" },

  // --- همهٔ واحدها ---
  { id: "m_ranger", name: "مدیرِ مالی", target: "all", incomeMult: 1.2, speedMult: 1.1, cost: 300_000_000, rarity: "ستاره", img: "/managers/m5.png", emoji: "🤠" },
  { id: "m_robot", name: "مدیرِ اتوماسیون", target: "all", incomeMult: 1.15, speedMult: 1.25, cost: 400_000_000, rarity: "افسانه‌ای", img: "/managers/m1.png", emoji: "🤖" },
  { id: "m_alien", name: "مدیرِ افسانه‌ای", target: "all", incomeMult: 1.35, speedMult: 1.3, cost: 600_000_000, rarity: "افسانه‌ای", img: "/managers/m8.png", emoji: "👽" },
];

export function managerDef(id: string): ManagerDef | null {
  return MANAGERS.find((m) => m.id === id) ?? null;
}

/** مدیرانی که می‌توانند روی این واحد بنشینند (تخصصی + همه‌کاره) */
export function managersFor(unitId: string): ManagerDef[] {
  return MANAGERS.filter((m) => m.target === unitId || m.target === "all");
}

export const RARITY_COLOR: Record<Rarity, string> = {
  "معمولی": "#8aa0aa",
  "حرفه‌ای": "#2f9e5f",
  "ستاره": "#2f6fed",
  "افسانه‌ای": "#e0a92e",
};
