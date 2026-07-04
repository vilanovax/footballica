import type { DuelKind } from "./types";

export const DUEL_KIND_OPTIONS: {
  id: DuelKind;
  title: string;
  detail: string;
  emoji: string;
  rules: string;
}[] = [
  {
    id: "friendly",
    title: "دوئل دوستانه",
    detail: "XP و هوادار · کمک تاکتیکی محدود",
    emoji: "🤝",
    rules: "پاورآپ مجاز است؛ برای تمرین و retention.",
  },
  {
    id: "ranked",
    title: "دوئل رنکد",
    detail: "رتبه Arena · بدون کمک",
    emoji: "🏆",
    rules: "فقط دانش و سرعت — هیچ پاورآپی فعال نیست.",
  },
];

export function duelPowerupsAllowed(kind: DuelKind): boolean {
  return kind === "friendly";
}

export function duelKindLabel(kind: DuelKind): string {
  return kind === "ranked" ? "دوئل رنکد" : "دوئل دوستانه";
}
