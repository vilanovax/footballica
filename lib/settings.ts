/** تنظیمات قابل‌تغییر بازیکن — در پروفایل و localStorage ذخیره می‌شود */
export interface PlayerSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  advisorHintsEnabled: boolean;
}

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  advisorHintsEnabled: true,
};

export const PLAYER_SETTING_ROWS: {
  key: keyof PlayerSettings;
  label: string;
  detail: string;
}[] = [
  {
    key: "soundEnabled",
    label: "صدای بازی",
    detail: "افکت‌های صوتی هنگام برد، باخت و اکشن‌های مهم",
  },
  {
    key: "hapticEnabled",
    label: "لرزش لمسی",
    detail: "بازخورد کوتاه روی موبایل هنگام انتخاب و نتیجه",
  },
  {
    key: "advisorHintsEnabled",
    label: "راهنمای مربی",
    detail: "پیشنهاد قدم بعدی در Home و باشگاه",
  },
];
