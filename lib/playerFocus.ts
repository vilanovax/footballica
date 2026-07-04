/** ترجیح مسیر اصلی بازیکن — فقط ترتیب و تاکید UI را عوض می‌کند، نه قفل محتوا */
export type PlayerFocus = "arena" | "club" | "both";

export const PLAYER_FOCUS_OPTIONS: {
  id: PlayerFocus;
  label: string;
  detail: string;
  emoji: string;
}[] = [
  {
    id: "arena",
    label: "رقابت و جدول",
    detail: "کوییز، سرعت، برد و رتبه",
    emoji: "⚔️",
  },
  {
    id: "club",
    label: "ساخت باشگاه",
    detail: "اقتصاد، صعود و کریر",
    emoji: "🏟️",
  },
  {
    id: "both",
    label: "هر دو",
    detail: "Arena و Club با وزن برابر",
    emoji: "⚖️",
  },
];

export function playerFocusLabel(focus: PlayerFocus): string {
  return PLAYER_FOCUS_OPTIONS.find((o) => o.id === focus)?.label ?? "هر دو";
}
