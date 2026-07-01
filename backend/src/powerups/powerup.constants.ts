// ============================================================
//  پاورآپ‌ها (کارت‌های سوپرپاور) — تعریف و هزینه.
//  فعلاً برای بازیِ تک‌نفره (تا «دوئلِ برابر» نشکند). اعداد از ECONOMY.md.
// ============================================================

export type PowerupType = 'fifty' | 'extra_time' | 'swap';

export interface PowerupDef {
  type: PowerupType;
  title: string;
  icon: string;
  cost: { cards: number; coins: number };
  /** فقط برای extra_time: چند ثانیه اضافه شود. */
  seconds?: number;
}

export const POWERUPS: Record<PowerupType, PowerupDef> = {
  fifty: {
    type: 'fifty',
    title: 'نصف‌نصف',
    icon: '✂️',
    cost: { cards: 1, coins: 30 },
  },
  extra_time: {
    type: 'extra_time',
    title: 'وقت اضافه',
    icon: '⏱️',
    cost: { cards: 1, coins: 30 },
    seconds: 7,
  },
  swap: {
    type: 'swap',
    title: 'تعویض سؤال',
    icon: '🔄',
    cost: { cards: 2, coins: 60 },
  },
};
