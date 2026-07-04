import type { ClubIdentity } from "./store";

export type CollectibleCategory =
  | "crest"
  | "kit"
  | "banner"
  | "academy"
  | "event";

export type CollectibleCurrency = "cards" | "budget";

export type CollectibleRarity = "common" | "rare" | "epic";

export type CollectibleId =
  | "crest_gold_star"
  | "crest_shield"
  | "crest_flame"
  | "kit_classic_green"
  | "kit_night_blue"
  | "kit_royal_gold"
  | "banner_champions"
  | "banner_derby"
  | "academy_scout_map"
  | "academy_young_talent"
  | "event_season_kickoff"
  | "event_arena_medal";

export interface CollectibleDef {
  id: CollectibleId;
  name: string;
  emoji: string;
  category: CollectibleCategory;
  rarity: CollectibleRarity;
  currency: CollectibleCurrency;
  price: number;
  desc: string;
  /** فقط cosmetic / prestige — هرگز رنکد را تحت‌تأثیر نمی‌گذارد */
  affectsRanked: false;
  equippable?: boolean;
  /** برای لباس‌های equippable */
  kitColor?: string;
}

export interface EquippedCosmetics {
  crestId?: CollectibleId;
  kitId?: CollectibleId;
}

export type OwnedCollectibles = Partial<Record<CollectibleId, boolean>>;

export const COLLECTIBLE_CATEGORIES: {
  id: CollectibleCategory;
  label: string;
  detail: string;
}[] = [
  { id: "crest", label: "نشان باشگاه", detail: "لوگوی تزئینی — فقط هویت بصری" },
  { id: "kit", label: "لباس باشگاه", detail: "رنگ و استایل — بدون مزیت رقابتی" },
  { id: "banner", label: "بنر استادیوم", detail: "آیتم نمایشی برای غرور باشگاه" },
  { id: "academy", label: "کارت آکادمی", detail: "کلکسیون prestige — نه boost مهارتی" },
  { id: "event", label: "رویداد فصلی", detail: "یادگاری محدود — فقط collection" },
];

export const COLLECTIBLES: CollectibleDef[] = [
  {
    id: "crest_gold_star",
    name: "ستارهٔ طلایی",
    emoji: "⭐",
    category: "crest",
    rarity: "epic",
    currency: "cards",
    price: 8,
    desc: "نشان ویژه برای باشگاه‌های صعودکننده",
    affectsRanked: false,
    equippable: true,
  },
  {
    id: "crest_shield",
    name: "سپر باشگاه",
    emoji: "🛡️",
    category: "crest",
    rarity: "rare",
    currency: "cards",
    price: 5,
    desc: "لوگوی محافظتی برای هویت باشگاه",
    affectsRanked: false,
    equippable: true,
  },
  {
    id: "crest_flame",
    name: "شعلهٔ رقابت",
    emoji: "🔥",
    category: "crest",
    rarity: "common",
    currency: "cards",
    price: 3,
    desc: "نشان انرژی برای شروع کلکسیون",
    affectsRanked: false,
    equippable: true,
  },
  {
    id: "kit_classic_green",
    name: "سبز کلاسیک",
    emoji: "🟢",
    category: "kit",
    rarity: "common",
    currency: "cards",
    price: 3,
    desc: "رنگ سنتی زمین — فقط ظاهری",
    affectsRanked: false,
    equippable: true,
    kitColor: "#2f9e5f",
  },
  {
    id: "kit_night_blue",
    name: "آبی شب بازی",
    emoji: "🔵",
    category: "kit",
    rarity: "rare",
    currency: "cards",
    price: 5,
    desc: "لباس شب مسابقات — بدون اثر رنکد",
    affectsRanked: false,
    equippable: true,
    kitColor: "#2f6fed",
  },
  {
    id: "kit_royal_gold",
    name: "طلایی افتخار",
    emoji: "🟡",
    category: "kit",
    rarity: "epic",
    currency: "cards",
    price: 8,
    desc: "رنگ قهرمانی — فقط prestige",
    affectsRanked: false,
    equippable: true,
    kitColor: "#c9a227",
  },
  {
    id: "banner_champions",
    name: "بنر قهرمانان",
    emoji: "🏆",
    category: "banner",
    rarity: "epic",
    currency: "budget",
    price: 2_000_000,
    desc: "آویز استادیوم برای نمایش افتخارات",
    affectsRanked: false,
  },
  {
    id: "banner_derby",
    name: "بنر دربی",
    emoji: "🚩",
    category: "banner",
    rarity: "rare",
    currency: "budget",
    price: 800_000,
    desc: "یادگار رقابت‌های مهم — فقط تزئینی",
    affectsRanked: false,
  },
  {
    id: "academy_scout_map",
    name: "نقشهٔ استعدادیابی",
    emoji: "🗺️",
    category: "academy",
    rarity: "common",
    currency: "cards",
    price: 2,
    desc: "کارت کلکسیونی آکادمی — نه boost پاسخ",
    affectsRanked: false,
  },
  {
    id: "academy_young_talent",
    name: "استعداد جوان",
    emoji: "🎓",
    category: "academy",
    rarity: "rare",
    currency: "cards",
    price: 4,
    desc: "یادگاری مسیر آکادمی باشگاه",
    affectsRanked: false,
  },
  {
    id: "event_season_kickoff",
    name: "افتتاح فصل",
    emoji: "🎟️",
    category: "event",
    rarity: "rare",
    currency: "cards",
    price: 5,
    desc: "مهر شروع فصل — محدود به کلکسیون",
    affectsRanked: false,
  },
  {
    id: "event_arena_medal",
    name: "مدال Arena",
    emoji: "🥇",
    category: "event",
    rarity: "epic",
    currency: "cards",
    price: 7,
    desc: "افتخار رقابتی — فقط نمایشی، نه مزیت رنکد",
    affectsRanked: false,
  },
];

export function collectibleDef(id: CollectibleId): CollectibleDef {
  const item = COLLECTIBLES.find((c) => c.id === id);
  if (!item) throw new Error(`unknown collectible ${id}`);
  return item;
}

export function collectiblesByCategory(
  category: CollectibleCategory,
): CollectibleDef[] {
  return COLLECTIBLES.filter((c) => c.category === category);
}

export function categoryLabel(category: CollectibleCategory): string {
  return COLLECTIBLE_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

export function rarityLabel(rarity: CollectibleRarity): string {
  if (rarity === "epic") return "افسانه";
  if (rarity === "rare") return "نادر";
  return "معمولی";
}

export function ownedCollectibleCount(owned: OwnedCollectibles): number {
  return COLLECTIBLES.filter((c) => owned[c.id]).length;
}

export function ownedCollectibleItems(owned: OwnedCollectibles): CollectibleDef[] {
  return COLLECTIBLES.filter((c) => owned[c.id]);
}

const RARITY_ORDER: Record<CollectibleRarity, number> = {
  epic: 0,
  rare: 1,
  common: 2,
};

export function sortCollectiblesByRarity(items: CollectibleDef[]): CollectibleDef[] {
  return [...items].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}

export function clubAvatarLabel(
  club: ClubIdentity,
  equipped: EquippedCosmetics,
): string {
  if (equipped.crestId) {
    try {
      return collectibleDef(equipped.crestId).emoji;
    } catch {
      return club.crest;
    }
  }
  return club.crest;
}

export function clubAvatarColor(
  club: ClubIdentity,
  equipped: EquippedCosmetics,
): string {
  if (equipped.kitId) {
    try {
      const kit = collectibleDef(equipped.kitId);
      if (kit.kitColor) return kit.kitColor;
    } catch {
      /* fallback */
    }
  }
  return club.color;
}

export function isEquipped(
  id: CollectibleId,
  equipped: EquippedCosmetics,
): boolean {
  return equipped.crestId === id || equipped.kitId === id;
}
