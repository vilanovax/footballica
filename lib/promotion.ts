"use client";

import type { ActivityReward } from "./economy";
import { faCount, faNum } from "./format";
import { MANAGERS } from "./managers";
import { levelForXp } from "./progress";
import { UNITS, unitDef } from "./units";
import { isUnitUnlocked } from "./clubEconomy";

export type PromotionRequirementType =
  | "fans"
  | "vaultLevel"
  | "hiredCount"
  | "assignedCount"
  | "matchesWon"
  | "unitLevel"
  | "unitUnlocked";

export interface PromotionRequirementDef {
  id: string;
  label: string;
  type: PromotionRequirementType;
  target: number;
  hint: string;
  unitId?: string;
}

export interface PromotionTierDef {
  id: string;
  title: string;
  seasonTitle: string;
  narrative: string;
  requirements: PromotionRequirementDef[];
  reward?: ActivityReward;
  claimLabel?: string;
  terminal?: boolean;
}

export interface PromotionSnapshot {
  fans: number;
  vaultLevel: number;
  hiredCount: number;
  assignedCount: number;
  matchesWon: number;
  playerLevel: number;
  unitLevels: Record<string, number>;
  unitUnlocked: Record<string, boolean>;
}

export interface PromotionRequirementStatus {
  def: PromotionRequirementDef;
  progress: number;
  complete: boolean;
  pct: number;
  state: "complete" | "near" | "locked";
  progressLabel: string;
}

export interface PromotionGateStatus {
  tier: PromotionTierDef;
  id: string;
  title: string;
  seasonTitle: string;
  narrative: string;
  requirements: PromotionRequirementStatus[];
  completeCount: number;
  totalCount: number;
  pct: number;
  complete: boolean;
  nextRequirement: PromotionRequirementStatus | null;
  claimLabel?: string;
  claimReward?: ActivityReward;
  terminal: boolean;
}

export interface SeasonAdvisorInput {
  seasonStep: number;
  snapshot: PromotionSnapshot;
  budget: number;
  pendingIncome: number;
  canCollect: boolean;
  vaultFull: boolean;
  showVaultTutorial: boolean;
  upgradeCosts: Partial<
    Record<
      "shop" | "food" | "parking" | "tickets" | "academy" | "sponsor" | "vault",
      number
    >
  >;
}

export interface AdvisorMessage {
  eyebrow: string;
  title: string;
  detail: string;
  action: "club" | "play";
  focus: string;
}

export interface PromotionSourceState {
  fans: number;
  vaultLevel: number;
  matchesWon: number;
  xp: number;
  units: Record<string, { level: number }>;
  hired: Record<string, boolean>;
  assign: Record<string, string | null>;
}

export const CHEAPEST_MANAGER_COST = Math.min(...MANAGERS.map((m) => m.cost));

const PROMOTION_TIERS: PromotionTierDef[] = [
  {
    id: "division_two",
    title: "صعود به دسته دو",
    seasonTitle: "فصل ۱: ساخت باشگاه",
    narrative:
      "برای صعود، فقط خوب بازی کردن کافی نیست؛ باشگاه باید از نظر مالی و مدیریتی هم آماده باشد.",
    requirements: [
      {
        id: "fans_300",
        label: "هوادار",
        type: "fans",
        target: 300,
        hint: "با بازی و برد، محبوبیت باشگاه بالا می‌رود.",
      },
      {
        id: "shop_lv2",
        label: "فروشگاه",
        type: "unitLevel",
        unitId: "shop",
        target: 2,
        hint: "فروشگاه اولین موتور درآمد پایدار ماست.",
      },
      {
        id: "vault_lv2",
        label: "خزانه",
        type: "vaultLevel",
        target: 2,
        hint: "خزانهٔ بهتر یعنی فضای امن‌تر برای رشد.",
      },
      {
        id: "hire_1",
        label: "استخدام مدیر",
        type: "hiredCount",
        target: 1,
        hint: "باشگاه حرفه‌ای بدون مدیر جلو نمی‌رود.",
      },
      {
        id: "assign_1",
        label: "انتصاب مدیر",
        type: "assignedCount",
        target: 1,
        hint: "مدیر باید واقعاً وارد چرخهٔ درآمد شود.",
      },
      {
        id: "wins_3",
        label: "برد",
        type: "matchesWon",
        target: 3,
        hint: "نتیجه گرفتن در زمین هنوز شرط صعود است.",
      },
    ],
    reward: { xp: 150, fans: 20, vaultMoney: 1_000_000, cards: 1 },
    claimLabel: "ورود به فصل ۲",
  },
  {
    id: "matchday_business",
    title: "فصل ۲: اقتصاد روز مسابقه",
    seasonTitle: "فصل ۲: روز مسابقه",
    narrative:
      "حالا هوادار داریم؛ وقت آن است که باشگاه از روز مسابقه هم پول واقعی بسازد و در دسته دو جا بیفتد.",
    requirements: [
      {
        id: "fans_1000",
        label: "هوادار",
        type: "fans",
        target: 1000,
        hint: "در دسته دو، جمعیت بیشتر یعنی دخل بیشتر.",
      },
      {
        id: "tickets_open",
        label: "بلیت‌فروشی",
        type: "unitUnlocked",
        unitId: "tickets",
        target: 1,
        hint: "گیشهٔ روز بازی باید وارد چرخه شود.",
      },
      {
        id: "food_lv2",
        label: "غرفه خوراکی",
        type: "unitLevel",
        unitId: "food",
        target: 2,
        hint: "خوراکی‌ها پول سریع روز مسابقه را می‌سازند.",
      },
      {
        id: "parking_lv2",
        label: "پارکینگ",
        type: "unitLevel",
        unitId: "parking",
        target: 2,
        hint: "پارکینگ پایدارترین پول خدماتی روز بازی است.",
      },
      {
        id: "vault_lv3",
        label: "خزانه",
        type: "vaultLevel",
        target: 3,
        hint: "اقتصاد روز مسابقه با خزانهٔ کوچک خفه می‌شود.",
      },
      {
        id: "wins_10",
        label: "برد",
        type: "matchesWon",
        target: 10,
        hint: "برای جا افتادن در دسته دو، نتیجه هم لازم است.",
      },
    ],
    reward: { xp: 300, fans: 50, vaultMoney: 2_500_000, cards: 1 },
    claimLabel: "ورود به فصل ۳",
  },
  {
    id: "division_one",
    title: "صعود به دسته یک",
    seasonTitle: "فصل ۳: برند و آینده",
    narrative:
      "اقتصاد روز مسابقه راه افتاده؛ حالا باید برند باشگاه، قراردادهای بزرگ و آینده‌سازی را هم حرفه‌ای کنی تا به آستانهٔ دسته یک برسی.",
    requirements: [
      {
        id: "fans_2500",
        label: "هوادار",
        type: "fans",
        target: 2500,
        hint: "برای تیمی که می‌خواهد بالا برود، شهر باید واقعاً پشتش باشد.",
      },
      {
        id: "academy_lv2",
        label: "آکادمی",
        type: "unitLevel",
        unitId: "academy",
        target: 2,
        hint: "آیندهٔ باشگاه باید روی استعدادهای خودش هم بایستد.",
      },
      {
        id: "sponsor_lv2",
        label: "اسپانسر",
        type: "unitLevel",
        unitId: "sponsor",
        target: 2,
        hint: "قراردادهای بزرگ، باشگاه را از دخل روز مسابقه جلوتر می‌برند.",
      },
      {
        id: "tickets_lv3",
        label: "بلیت‌فروشی",
        type: "unitLevel",
        unitId: "tickets",
        target: 3,
        hint: "گیشه باید از حالت ابتدایی عبور کند و جمعیت بزرگ‌تری را پوشش بدهد.",
      },
      {
        id: "vault_lv4",
        label: "خزانه",
        type: "vaultLevel",
        target: 4,
        hint: "قراردادهای بزرگ و رشد باشگاه به خزانهٔ قوی‌تری نیاز دارند.",
      },
      {
        id: "wins_20",
        label: "برد",
        type: "matchesWon",
        target: 20,
        hint: "در این مرحله، فقط زیرساخت کافی نیست؛ باید تیم واقعاً نتیجه هم بگیرد.",
      },
    ],
    terminal: true,
  },
];

export function buildPromotionSnapshot(state: PromotionSourceState): PromotionSnapshot {
  const hiredCount = Object.values(state.hired).filter(Boolean).length;
  const assignedCount = Object.values(state.assign).filter(Boolean).length;
  return {
    fans: state.fans,
    vaultLevel: state.vaultLevel,
    hiredCount,
    assignedCount,
    matchesWon: state.matchesWon,
    playerLevel: levelForXp(state.xp),
    unitLevels: Object.fromEntries(
      UNITS.map((u) => [u.id, state.units[u.id]?.level ?? 1]),
    ) as Record<string, number>,
    unitUnlocked: Object.fromEntries(
      UNITS.map((u) => [u.id, isUnitUnlocked(u.id, state.xp)]),
    ) as Record<string, boolean>,
  };
}

export function currentDivisionLabel(seasonStep: number): string {
  if (seasonStep >= 3) return "دستهٔ یک";
  if (seasonStep >= 2) return "دستهٔ دو";
  return "دستهٔ سه";
}

function activeTier(seasonStep: number): PromotionTierDef {
  const index = Math.min(Math.max(1, seasonStep), PROMOTION_TIERS.length) - 1;
  return PROMOTION_TIERS[index]!;
}

function promotionValue(snapshot: PromotionSnapshot, def: PromotionRequirementDef): number {
  switch (def.type) {
    case "fans":
      return snapshot.fans;
    case "vaultLevel":
      return snapshot.vaultLevel;
    case "hiredCount":
      return snapshot.hiredCount;
    case "assignedCount":
      return snapshot.assignedCount;
    case "matchesWon":
      return snapshot.matchesWon;
    case "unitLevel":
      return snapshot.unitUnlocked[def.unitId!] ? (snapshot.unitLevels[def.unitId!] ?? 1) : 0;
    case "unitUnlocked":
      return snapshot.unitUnlocked[def.unitId!] ? 1 : 0;
  }
}

function progressLabel(def: PromotionRequirementDef, progress: number): string {
  if (def.type === "fans") return `${faCount(progress)} / ${faCount(def.target)}`;
  if (def.type === "vaultLevel") {
    return `سطح ${faNum(progress)} / ${faNum(def.target)}`;
  }
  if (def.type === "unitLevel") {
    if (progress <= 0 && def.unitId) {
      return `قفل تا سطح ${faNum(unitDef(def.unitId).requiresLevel)}`;
    }
    return `سطح ${faNum(progress)} / ${faNum(def.target)}`;
  }
  if (def.type === "unitUnlocked") {
    return progress >= 1
      ? "باز شده"
      : `قفل تا سطح ${faNum(unitDef(def.unitId!).requiresLevel)}`;
  }
  return `${faNum(progress)} / ${faNum(def.target)}`;
}

function progressState(
  def: PromotionRequirementDef,
  progress: number,
): PromotionRequirementStatus["state"] {
  if (progress >= def.target) return "complete";
  const pct = def.target > 0 ? progress / def.target : 0;
  if (def.type === "fans" || def.type === "matchesWon") {
    return pct >= 0.6 ? "near" : "locked";
  }
  if (def.type === "unitUnlocked") return "locked";
  return progress === def.target - 1 ? "near" : "locked";
}

export function promotionGateStatus(
  seasonStep: number,
  snapshot: PromotionSnapshot,
): PromotionGateStatus {
  const tier = activeTier(seasonStep);
  const requirements = tier.requirements.map((def) => {
    const raw = promotionValue(snapshot, def);
    const progress = Math.min(raw, def.target);
    const complete = progress >= def.target;
    const pct =
      def.target > 0 ? Math.min(100, Math.round((progress / def.target) * 100)) : 0;
    return {
      def,
      progress,
      complete,
      pct,
      state: progressState(def, progress),
      progressLabel: progressLabel(def, progress),
    } satisfies PromotionRequirementStatus;
  });

  const completeCount = requirements.filter((item) => item.complete).length;
  const totalCount = requirements.length;
  return {
    tier,
    id: tier.id,
    title: tier.title,
    seasonTitle: tier.seasonTitle,
    narrative: tier.narrative,
    requirements,
    completeCount,
    totalCount,
    pct: Math.round((completeCount / totalCount) * 100),
    complete: completeCount === totalCount,
    nextRequirement: requirements.find((item) => !item.complete) ?? null,
    claimLabel: tier.claimLabel,
    claimReward: tier.reward,
    terminal: Boolean(tier.terminal),
  };
}

export function canClaimPromotion(
  seasonStep: number,
  snapshot: PromotionSnapshot,
): boolean {
  const gate = promotionGateStatus(seasonStep, snapshot);
  return gate.complete && !gate.terminal;
}

export interface PromotionCelebration {
  eyebrow: string;
  title: string;
  detail: string;
  nextSeasonTitle: string;
  divisionFrom: string;
  divisionTo: string;
  unlocks: { emoji: string; label: string; hint: string }[];
}

export function promotionCelebrationForTier(tierId: string): PromotionCelebration | null {
  if (tierId === "division_two") {
    return {
      eyebrow: "صعود رسمی",
      title: "به دسته دو خوش آمدی",
      detail:
        "باشگاهت حالا آمادهٔ اقتصاد روز مسابقه است؛ بازی، جمعیت و خدمات باهم پول می‌سازند.",
      nextSeasonTitle: "فصل ۲: روز مسابقه",
      divisionFrom: "دستهٔ سه",
      divisionTo: "دستهٔ دو",
      unlocks: [
        { emoji: "🎟️", label: "بلیت‌فروشی", hint: "گیشهٔ اصلی روز بازی" },
        { emoji: "🌭", label: "غرفه خوراکی", hint: "درآمد سریع روز مسابقه" },
        { emoji: "🅿️", label: "پارکینگ", hint: "پول پایدار خدماتی" },
      ],
    };
  }
  if (tierId === "matchday_business") {
    return {
      eyebrow: "صعود رسمی",
      title: "به دسته یک خوش آمدی",
      detail:
        "باشگاه حالا فقط از روز مسابقه پول نمی‌سازد؛ وقت آن است که برند، آکادمی و قراردادهای بزرگ آیندهٔ تیم را شکل بدهند.",
      nextSeasonTitle: "فصل ۳: برند و آینده",
      divisionFrom: "دستهٔ دو",
      divisionTo: "دستهٔ یک",
      unlocks: [
        { emoji: "🎓", label: "آکادمی فوتبال", hint: "سرمایه‌گذاری روی آینده" },
        { emoji: "🤝", label: "اسپانسر پیراهن", hint: "قراردادهای بزرگ‌تر باشگاه" },
        { emoji: "🎟️", label: "گیشهٔ قوی‌تر", hint: "جمعیت بیشتر و فروش بهتر" },
      ],
    };
  }
  return null;
}

export function seasonAdvisorMessage(input: SeasonAdvisorInput): AdvisorMessage {
  const {
    seasonStep,
    snapshot,
    budget,
    pendingIncome,
    canCollect,
    vaultFull,
    showVaultTutorial,
  } = input;

  if (canCollect && pendingIncome > 0) {
    return showVaultTutorial
      ? {
          eyebrow: "مشاور باشگاه",
          title: "اولین دخل باشگاه آماده است",
          detail:
            "درآمد فروشگاه را به خزانه بفرست تا پول واقعاً قابل خرج برای توسعه داشته باشیم.",
          action: "club",
          focus: "اولین collect",
        }
      : {
          eyebrow: "مشاور باشگاه",
          title: "درآمد داخل ساختمان‌ها مانده است",
          detail:
            "تا جمعش نکنی، هنوز برای ارتقا و استخدام به درد نمی‌خورد. اول برو سراغ خزانه.",
          action: "club",
          focus: "جمع‌آوری درآمد",
        };
  }

  if (vaultFull) {
    return {
      eyebrow: "مشاور باشگاه",
      title: "خزانه جا کم آورده است",
      detail:
        "درآمد تازه می‌رسد، ولی اگر خرج نکنی یا خزانه را بزرگ نکنی، بخشی از رشد هدر می‌رود.",
      action: "club",
      focus: "فشار خزانه",
    };
  }

  if (seasonStep === 1) {
    if (snapshot.unitLevels.shop < 2) {
      return budget >= (input.upgradeCosts.shop ?? Number.MAX_SAFE_INTEGER)
        ? {
            eyebrow: "فصل ۱: ساخت باشگاه",
            title: "وقت ارتقای فروشگاه است",
            detail:
              "فروشگاه کوچک است، ولی فعلاً ستون اصلی درآمد ماست. آن را به سطح ۲ برسان.",
            action: "club",
            focus: "فروشگاه",
          }
        : {
            eyebrow: "فصل ۱: ساخت باشگاه",
            title: "برای تقویت فروشگاه، چند بازی دیگر لازم است",
            detail:
              "با چند بازی و کمی درآمد بیشتر، بودجهٔ ارتقای فروشگاه جور می‌شود و حلقهٔ اقتصاد راه می‌افتد.",
            action: "play",
            focus: "بودجهٔ ارتقا",
          };
    }

    if (snapshot.vaultLevel < 2) {
      return budget >= (input.upgradeCosts.vault ?? Number.MAX_SAFE_INTEGER)
        ? {
            eyebrow: "فصل ۱: ساخت باشگاه",
            title: "حالا نوبت خزانه است",
            detail:
              "فروشگاه جان گرفته؛ برای این‌که رشد خفه نشود، خزانه را به سطح ۲ برسان.",
            action: "club",
            focus: "ارتقای خزانه",
          }
        : {
            eyebrow: "مشاور باشگاه",
            title: "خزانهٔ بهتر هنوز بودجه می‌خواهد",
            detail:
              "کمی درآمد دیگر جمع کن تا ظرفیت لازم برای رشد پایدار باشگاه را داشته باشیم.",
            action: "play",
            focus: "درآمد بیشتر",
          };
    }

    if (snapshot.hiredCount < 1) {
      return budget >= CHEAPEST_MANAGER_COST
        ? {
            eyebrow: "فصل ۱: حرفه‌ای شدن",
            title: "وقت اولین استخدام است",
            detail:
              "تا همه‌چیز را خودت جمع کنی، رشد کند می‌شود. اولین مدیر را برای نظم دادن به باشگاه بگیر.",
            action: "club",
            focus: "اولین مدیر",
          }
        : {
            eyebrow: "فصل ۱: حرفه‌ای شدن",
            title: "برای اولین مدیر، کمی دیگر پول لازم داریم",
            detail:
              "چند بازی و collect دیگر ما را به هزینهٔ اولین مدیر می‌رساند.",
            action: "play",
            focus: "بودجهٔ مدیر",
          };
    }

    if (snapshot.assignedCount < 1) {
      return {
        eyebrow: "مشاور باشگاه",
        title: "مدیر را وارد بازی کن",
        detail:
          "استخدام کافی نیست؛ او را روی یکی از ساختمان‌ها بگذار تا چرخهٔ درآمد واقعاً حرفه‌ای شود.",
        action: "club",
        focus: "انتصاب مدیر",
      };
    }

    if (snapshot.matchesWon < 3) {
      return {
        eyebrow: "مسیر صعود",
        title: "حالا نتیجه در زمین مهم‌تر می‌شود",
        detail:
          "ساختار باشگاه بهتر شده؛ چند برد دیگر لازم داریم تا فصل اول را ببندیم.",
        action: "play",
        focus: "بردهای صعود",
      };
    }

    if (snapshot.fans < 300) {
      return {
        eyebrow: "مسیر صعود",
        title: "هوادار بیشتری لازم داریم",
        detail:
          "حالا باشگاه آماده‌تر است؛ با بازی و برد، محبوبیت را بالا ببر تا شرط آخر صعود هم کامل شود.",
        action: "play",
        focus: "هوادار",
      };
    }

    return {
      eyebrow: "پایان فصل ۱",
      title: "باشگاه آمادهٔ صعود است",
      detail:
        "شرط‌های پایه کامل شده‌اند. حالا می‌توانی فصل ۲ و اقتصاد روز مسابقه را باز کنی.",
      action: "club",
      focus: "صعود",
    };
  }

  if (seasonStep === 2) {
    if (!snapshot.unitUnlocked.tickets) {
      return {
        eyebrow: "فصل ۲: روز مسابقه",
        title: "گیشهٔ روز بازی هنوز قفل است",
        detail: `برای باز شدن بلیت‌فروشی باید به سطح ${faNum(unitDef("tickets").requiresLevel)} برسی و مسیر باشگاه را جلو ببری.`,
        action: "play",
        focus: "باز شدن بلیت‌فروشی",
      };
    }

    if (snapshot.unitLevels.food < 2) {
      return budget >= (input.upgradeCosts.food ?? Number.MAX_SAFE_INTEGER)
        ? {
            eyebrow: "فصل ۲: روز مسابقه",
            title: "غرفهٔ خوراکی را تقویت کن",
            detail:
              "روز مسابقه بدون خوراکی، پول سریع از دست می‌رود. این ساختمان را به سطح ۲ برسان.",
            action: "club",
            focus: "غرفه خوراکی",
          }
        : {
            eyebrow: "فصل ۲: روز مسابقه",
            title: "برای خوراکی، بودجهٔ بیشتری لازم است",
            detail:
              "چند بازی و collect دیگر لازم است تا درآمد روز مسابقه جان بگیرد.",
            action: "play",
            focus: "بودجهٔ خوراکی",
          };
    }

    if (snapshot.unitLevels.parking < 2) {
      return budget >= (input.upgradeCosts.parking ?? Number.MAX_SAFE_INTEGER)
        ? {
            eyebrow: "فصل ۲: روز مسابقه",
            title: "پارکینگ را هم وارد بازی کن",
            detail:
              "پارکینگ پایدارترین پول خدماتی روز بازی است؛ این‌جا را هم به سطح ۲ برسان.",
            action: "club",
            focus: "پارکینگ",
          }
        : {
            eyebrow: "فصل ۲: روز مسابقه",
            title: "پارکینگ هنوز خرج می‌خواهد",
            detail:
              "قبل از شلوغ شدن روز مسابقه، باید بودجهٔ این ارتقا را جور کنیم.",
            action: "play",
            focus: "بودجهٔ پارکینگ",
          };
    }

    if (snapshot.vaultLevel < 3) {
      return budget >= (input.upgradeCosts.vault ?? Number.MAX_SAFE_INTEGER)
        ? {
            eyebrow: "فصل ۲: روز مسابقه",
            title: "خزانه باید یک پله دیگر بزرگ شود",
            detail:
              "وقتی بلیت و خوراکی و پارکینگ فعال شوند، خزانهٔ کوچک جواب نمی‌دهد. آن را به سطح ۳ برسان.",
            action: "club",
            focus: "خزانهٔ سطح ۳",
          }
        : {
            eyebrow: "فصل ۲: روز مسابقه",
            title: "فشار روز مسابقه روی خزانه زیاد می‌شود",
            detail: "کمی درآمد دیگر لازم است تا ظرفیت فصل دوم را باز کنیم.",
            action: "play",
            focus: "بودجهٔ خزانه",
          };
    }

    if (snapshot.matchesWon < 10) {
      return {
        eyebrow: "فصل ۲: روز مسابقه",
        title: "وقت جا افتادن در دسته دو است",
        detail:
          "زیرساخت آماده‌تر شده؛ حالا با چند برد دیگر باشگاه را در این سطح تثبیت کن.",
        action: "play",
        focus: "بردهای بیشتر",
      };
    }

    if (snapshot.fans < 1000) {
      return {
        eyebrow: "فصل ۲: روز مسابقه",
        title: "جمعیت بیشتری لازم داریم",
        detail:
          "وقتی مردم بیشتری بیایند، بلیت‌فروشی و خدمات روز مسابقه واقعاً پول‌ساز می‌شوند.",
        action: "play",
        focus: "هوادار بیشتر",
      };
    }

    return {
      eyebrow: "پایان فصل ۲",
      title: "باشگاه آمادهٔ صعود بعدی است",
      detail:
        "اقتصاد روز مسابقه جا افتاده و حالا می‌توانی فصل ۳، یعنی برند و آیندهٔ باشگاه را باز کنی.",
      action: "club",
      focus: "صعود",
    };
  }

  if (!snapshot.unitUnlocked.academy) {
    return {
      eyebrow: "فصل ۳: برند و آینده",
      title: "آکادمی هنوز قفل است",
      detail: `برای باز شدن آکادمی باید به سطح ${faNum(unitDef("academy").requiresLevel)} برسی تا رشد باشگاه فقط به امروز وابسته نباشد.`,
      action: "play",
      focus: "باز شدن آکادمی",
    };
  }

  if (snapshot.unitLevels.academy < 2) {
    return budget >= (input.upgradeCosts.academy ?? Number.MAX_SAFE_INTEGER)
      ? {
          eyebrow: "فصل ۳: برند و آینده",
          title: "آکادمی را جان بده",
          detail:
            "باشگاه بزرگ فقط با فروش روز مسابقه نمی‌ماند؛ آکادمی را به سطح ۲ برسان تا آینده‌سازی شروع شود.",
          action: "club",
          focus: "آکادمی",
        }
      : {
          eyebrow: "فصل ۳: برند و آینده",
          title: "برای آکادمی هنوز بودجه کم است",
          detail:
            "چند بازی و درآمد دیگر لازم است تا روی آیندهٔ باشگاه سرمایه‌گذاری کنی.",
          action: "play",
          focus: "بودجهٔ آکادمی",
        };
  }

  if (!snapshot.unitUnlocked.sponsor) {
    return {
      eyebrow: "فصل ۳: برند و آینده",
      title: "هنوز به قراردادهای بزرگ نرسیده‌ای",
      detail: `برای باز شدن اسپانسر باید به سطح ${faNum(unitDef("sponsor").requiresLevel)} برسی و باشگاه را به ویترین جذاب‌تری تبدیل کنی.`,
      action: "play",
      focus: "باز شدن اسپانسر",
    };
  }

  if (snapshot.unitLevels.sponsor < 2) {
    return budget >= (input.upgradeCosts.sponsor ?? Number.MAX_SAFE_INTEGER)
      ? {
          eyebrow: "فصل ۳: برند و آینده",
          title: "اولین قرارداد بزرگ را جدی کن",
          detail:
            "اسپانسرِ پیراهن را به سطح ۲ برسان تا برند باشگاه وارد چرخهٔ درآمدهای سنگین‌تر شود.",
          action: "club",
          focus: "اسپانسر",
        }
      : {
          eyebrow: "فصل ۳: برند و آینده",
          title: "برای قرارداد بزرگ، باید کمی دیگر رشد کنیم",
          detail:
            "برند قوی بدون پشتوانهٔ مالی جلو نمی‌رود؛ چند برد و collect دیگر لازم است.",
          action: "play",
          focus: "بودجهٔ اسپانسر",
        };
  }

  if (snapshot.unitLevels.tickets < 3) {
    return budget >= (input.upgradeCosts.tickets ?? Number.MAX_SAFE_INTEGER)
      ? {
          eyebrow: "فصل ۳: برند و آینده",
          title: "گیشه را یک پله دیگر بالا ببر",
          detail:
            "وقتی جمعیت بیشتر می‌شود، بلیت‌فروشی هم باید در مقیاس بزرگ‌تر کار کند. آن را به سطح ۳ برسان.",
          action: "club",
          focus: "بلیت‌فروشی",
        }
      : {
          eyebrow: "فصل ۳: برند و آینده",
          title: "برای گیشهٔ بزرگ‌تر، پول بیشتری لازم داریم",
          detail:
            "قبل از موج هوادار بعدی، باید بودجهٔ ارتقای بلیت‌فروشی را جور کنیم.",
          action: "play",
          focus: "بودجهٔ بلیت",
        };
  }

  if (snapshot.vaultLevel < 4) {
    return budget >= (input.upgradeCosts.vault ?? Number.MAX_SAFE_INTEGER)
      ? {
          eyebrow: "فصل ۳: برند و آینده",
          title: "خزانه باید در حد قراردادهای بزرگ شود",
          detail:
            "آکادمی، اسپانسر و گیشهٔ قوی‌تر، خزانهٔ کوچک را خفه می‌کنند. آن را به سطح ۴ برسان.",
          action: "club",
          focus: "خزانهٔ سطح ۴",
        }
      : {
          eyebrow: "فصل ۳: برند و آینده",
          title: "قبل از جهش بعدی، خزانه بودجه می‌خواهد",
          detail:
            "کمی درآمد دیگر لازم است تا زیرساخت مالی باشگاه در حد دسته یک شود.",
          action: "play",
          focus: "بودجهٔ خزانه",
        };
  }

  if (snapshot.matchesWon < 20) {
    return {
      eyebrow: "فصل ۳: برند و آینده",
      title: "اعتبار این سطح را باید در زمین ثابت کنی",
      detail:
        "باشگاه بزرگ‌تر شده، اما برای تثبیت جایگاهش در دسته یک به بردهای بیشتری نیاز دارد.",
      action: "play",
      focus: "بردهای بیشتر",
    };
  }

  if (snapshot.fans < 2500) {
    return {
      eyebrow: "فصل ۳: برند و آینده",
      title: "برند باشگاه هنوز جمعیت بیشتری می‌خواهد",
      detail:
        "وقتی هوادارها از چند هزار نفر عبور کنند، آکادمی و اسپانسر واقعاً اثرشان را نشان می‌دهند.",
      action: "play",
      focus: "هوادار بیشتر",
    };
  }

  return {
    eyebrow: "پایان فصل ۳",
    title: "برند باشگاه جا افتاده است",
    detail:
      "باشگاه حالا هم از امروز پول درمی‌آورد، هم برای فردایش برنامه دارد. لایهٔ بعدی را می‌توان بعداً روی همین پایه ساخت.",
    action: "club",
    focus: "پایان فصل ۳",
  };
}
