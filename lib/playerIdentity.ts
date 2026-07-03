/** شهرها و تیم‌های محبوب — اختیاری، برای شخصی‌سازی و رقابت شهری (فاز بعد) */

export interface IdentityOption {
  id: string;
  label: string;
  emoji?: string;
}

export const CITIES: IdentityOption[] = [
  { id: "tehran", label: "تهران", emoji: "🏙️" },
  { id: "isfahan", label: "اصفهان", emoji: "🕌" },
  { id: "mashhad", label: "مشهد", emoji: "🕋" },
  { id: "shiraz", label: "شیراز", emoji: "🌹" },
  { id: "tabriz", label: "تبریز", emoji: "🏔️" },
  { id: "ahvaz", label: "اهواز", emoji: "☀️" },
  { id: "kerman", label: "کرمان", emoji: "🏜️" },
  { id: "rasht", label: "رشت", emoji: "🌧️" },
  { id: "yazd", label: "یزد", emoji: "🧱" },
  { id: "other", label: "سایر شهرها", emoji: "📍" },
];

/** تیم قلبی — ایران و پرطرفدار */
export const HEART_TEAMS: IdentityOption[] = [
  { id: "esteghlal", label: "استقلال", emoji: "💙" },
  { id: "persepolis", label: "پرسپولیس", emoji: "❤️" },
  { id: "sepahan", label: "سپاهان", emoji: "🟡" },
  { id: "tractor", label: "تراکتور", emoji: "🔴" },
  { id: "foolad", label: "فولاد", emoji: "🟠" },
  { id: "none_iran", label: "تیم خاصی ندارم", emoji: "⚽" },
];

/** تیم بین‌المللی محبوب — بعداً در پروفایل تکمیل می‌شود */
export const INTL_TEAMS: IdentityOption[] = [
  { id: "real", label: "رئال مادرید", emoji: "👑" },
  { id: "barca", label: "بارسلونا", emoji: "🔵🔴" },
  { id: "liverpool", label: "لیورپول", emoji: "🔴" },
  { id: "man_utd", label: "منچستر یونایتد", emoji: "😈" },
  { id: "bayern", label: "بایرن", emoji: "🔴" },
  { id: "psg", label: "پاریس", emoji: "🔵" },
  { id: "milan", label: "آ.ث. میلان", emoji: "🔴⚫" },
  { id: "none_intl", label: "ندارم / بعداً", emoji: "🌍" },
];

export function identityLabel(
  id: string | undefined,
  list: IdentityOption[],
): string | null {
  if (!id) return null;
  return list.find((o) => o.id === id)?.label ?? null;
}

export function identityEmoji(
  id: string | undefined,
  list: IdentityOption[],
): string {
  if (!id) return "";
  return list.find((o) => o.id === id)?.emoji ?? "";
}

export function isMeaningfulTeam(id: string | undefined): boolean {
  return Boolean(id && id !== "none_iran" && id !== "none_intl");
}
