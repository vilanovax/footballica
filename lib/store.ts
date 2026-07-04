import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UPGRADES, CLUB } from "./club";
import { vaultCapacity, vaultUpgradeCost, VAULT_MAX, isBank } from "./vault";
import {
  UNITS,
  unitDef,
  unitPending,
  unitStats,
  unitUpgradeCost,
  itemUpgradeCost,
} from "./units";
import { managerDef } from "./managers";
import { levelForXp } from "./progress";
import { ECONOMY, fanIncomeMultiplier, type ActivityReward } from "./economy";
import { nextStreak, syncLivesState } from "./player";
import { streakMilestoneReward } from "./home";
import {
  buildMissionSnapshot,
  claimableMissionCount,
  missionById,
  missionStatus,
} from "./missions";
import { todayKey } from "./player";
import type { PowerUpId, PowerUpInventory } from "./powerups";
import { powerUpDef } from "./powerups";

export type UpgradeResult = "ok" | "poor" | "locked" | "max";

export interface VaultDepositResult {
  deposited: number;
  overflow: number;
}

/** هویتِ باشگاهِ ساختهٔ کاربر (کپی‌رایت-امن: خیالی و شخصی‌سازی‌شده) */
export interface ClubIdentity {
  name: string;
  color: string; // hex
  crest: string; // ایموجیِ لوگو
  /** شهر باشگاه — اختیاری، برای رقابت شهری */
  city?: string;
  /** تیم قلبی واقعی — اختیاری */
  heartTeam?: string;
  /** تیم بین‌المللی محبوب — اختیاری، اغلب بعداً تکمیل می‌شود */
  internationalTeam?: string;
}

interface GameState {
  // پیشرفت
  cards: number;
  fans: number;
  budget: number; // خزانهٔ باشگاه — پول قابلِ خرج (تومانِ درون‌بازی)
  xp: number; // تجربه (خرج نمی‌شود؛ فقط سطح را بالا می‌برد)
  reputation: number; // اعتبارِ باشگاه (محاسباتی — فاز بعد)
  levels: Record<string, number>;
  // اقتصادِ باشگاه: واحدها درآمد می‌سازند → collect → خزانه (بودجه) → خرج
  units: Record<string, { level: number; lastCollect: number }>;
  itemLevels: Record<string, Record<string, number>>; // unitId → itemId → level
  hired: Record<string, boolean>; // مدیرانِ استخدام‌شده (managerId)
  assign: Record<string, string | null>; // unitId → managerId منصوب‌شده
  vaultLevel: number; // ظرفیتِ خزانه (سقفِ بودجه)
  matchesWon: number; // برای بازشدنِ واحدهایی مثلِ بلیت‌فروشی
  // سناریو / هویت
  setupDone: boolean;
  club: ClubIdentity;
  // رکوردها و آمارِ بازیکن
  survivalBest: number;
  bombBest: number;
  totalCorrect: number;
  lives: number;
  livesUpdatedAt: number;
  streakDays: number;
  lastPlayDate: string;
  // موجودیِ سوپرپاورها
  powerups: PowerUpInventory;
  // گزارشِ سؤال‌ها (فعلاً محلی؛ در فاز سرور به API می‌رود)
  reports: { questionId: string; reason: string; at: number }[];
  /** آموزشِ مسیر پول: تا اولین واریز به خزانه */
  showVaultTutorial: boolean;
  // ماموریت‌ها
  gamesPlayed: number;
  unitCollectCount: number;
  vaultFillCount: number;
  dailyDate: string;
  dailyProgress: Record<string, number>;
  missionClaimed: Record<string, boolean>;
  // اکشن‌ها
  addCards: (n: number) => void;
  addFans: (n: number) => void;
  addXp: (n: number) => void;
  addReputation: (n: number) => void;
  /** واریزِ درآمد (مسابقه یا واحد) به خزانه — تا سقفِ ظرفیت */
  depositVault: (amount: number) => VaultDepositResult;
  /** اعمالِ جایزهٔ یک فعالیت (XP، هوادار، کارت، پول→گاوصندوق) */
  applyActivityReward: (reward: ActivityReward) => VaultDepositResult;
  // اقتصادِ باشگاه (واحدها + گاوصندوق)
  ensureUnitClock: (id: string) => void;
  collectUnit: (id: string) => number; // درآمدِ واحد → خزانه
  collectAllUnits: () => number; // همهٔ واحدهای آماده → خزانه
  upgradeUnit: (id: string) => UpgradeResult;
  upgradeItem: (unitId: string, itemId: string) => UpgradeResult;
  hireManager: (managerId: string) => UpgradeResult; // استخدام (باز کردن)
  assignManager: (unitId: string, managerId: string) => UpgradeResult; // انتصاب
  unassignUnit: (unitId: string) => void;
  upgradeVault: () => UpgradeResult;
  recordWin: () => void;
  completeSetup: (club: ClubIdentity) => void;
  updateClubProfile: (
    patch: Partial<Pick<ClubIdentity, "city" | "heartTeam" | "internationalTeam">>,
  ) => void;
  reportQuestion: (questionId: string, reason: string) => void;
  /** رکوردِ بقا را ذخیره کن؛ اگر رکوردِ جدید بود true برمی‌گرداند */
  saveSurvival: (score: number) => boolean;
  saveBomb: (score: number) => boolean;
  syncLives: () => void;
  spendLife: () => boolean;
  recordDailyPlay: () => void;
  addTotalCorrect: (n: number) => void;
  /** خریدِ سوپرپاور از فروشگاه */
  buyPowerUp: (id: PowerUpId) => UpgradeResult;
  /** مصرفِ یک عدد از موجودی؛ false اگر نداشت */
  usePowerUp: (id: PowerUpId) => boolean;
  /** همگام‌سازی اقتصاد باشگاه بعد از rehydrate (مدیران + بانک) */
  syncClubEconomy: () => void;
  completeVaultTutorial: () => void;
  ensureDailyMissions: () => void;
  claimMission: (id: string) => "ok" | "locked" | "claimed";
  claimableMissions: () => number;
  resetSave: () => void;
}

const initialLevels = Object.fromEntries(
  UPGRADES.map((u) => [u.id, 1]),
) as Record<string, number>;

const initialUnits = Object.fromEntries(
  UNITS.map((u) => [u.id, { level: 1, lastCollect: 0 }]),
) as Record<string, { level: number; lastCollect: number }>;

const initialItemLevels = Object.fromEntries(
  UNITS.map((u) => [u.id, {} as Record<string, number>]),
) as Record<string, Record<string, number>>;

const DEFAULT_CLUB: ClubIdentity = {
  name: CLUB.name,
  color: "#2f6fed",
  crest: CLUB.emoji,
};

function missionSnapFromState(s: GameState) {
  return buildMissionSnapshot({
    gamesPlayed: s.gamesPlayed,
    totalCorrect: s.totalCorrect,
    unitCollectCount: s.unitCollectCount,
    vaultFillCount: s.vaultFillCount,
    matchesWon: s.matchesWon,
    streakDays: s.streakDays,
    bombBest: s.bombBest,
    fans: s.fans,
    setupDone: s.setupDone,
    units: s.units,
    hired: s.hired,
    assign: s.assign,
    vaultLevel: s.vaultLevel,
    dailyProgress: s.dailyProgress,
    dailyDate: s.dailyDate,
    missionClaimed: s.missionClaimed,
  });
}

function bumpDailyProgress(
  dailyDate: string,
  dailyProgress: Record<string, number>,
  key: string,
  amount = 1,
) {
  const today = todayKey();
  const base = dailyDate === today ? dailyProgress : {};
  return {
    dailyDate: today,
    dailyProgress: { ...base, [key]: (base[key] ?? 0) + amount },
  };
}

const initialState = {
  cards: 2,
  fans: 0,
  budget: 0,
  xp: 0,
  reputation: 0,
  levels: initialLevels,
  units: initialUnits,
  itemLevels: initialItemLevels,
  hired: {} as Record<string, boolean>,
  assign: Object.fromEntries(UNITS.map((u) => [u.id, null])) as Record<
    string,
    string | null
  >,
  vaultLevel: 1,
  matchesWon: 0,
  setupDone: false,
  club: DEFAULT_CLUB,
  survivalBest: 0,
  bombBest: 0,
  totalCorrect: 0,
  lives: ECONOMY.lives.max,
  livesUpdatedAt: Date.now(),
  streakDays: 0,
  lastPlayDate: "",
  powerups: {} as PowerUpInventory,
  reports: [] as { questionId: string; reason: string; at: number }[],
  showVaultTutorial: true,
  gamesPlayed: 0,
  unitCollectCount: 0,
  vaultFillCount: 0,
  dailyDate: "",
  dailyProgress: {} as Record<string, number>,
  missionClaimed: {} as Record<string, boolean>,
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addCards: (n) => set((s) => ({ cards: s.cards + n })),
      addFans: (n) => set((s) => ({ fans: s.fans + n })),
      addXp: (n) => set((s) => ({ xp: s.xp + n })),
      addReputation: (n) => set((s) => ({ reputation: s.reputation + n })),

      depositVault: (amount) => {
        if (amount <= 0) return { deposited: 0, overflow: 0 };
        const { vaultLevel, budget } = get();

        // بانکِ اسپانسر: بدون سقفِ ظرفیت
        if (isBank(vaultLevel)) {
          set((s) => ({ budget: s.budget + amount }));
          get().completeVaultTutorial();
          return { deposited: amount, overflow: 0 };
        }

        const cap = vaultCapacity(vaultLevel);
        const free = Math.max(0, cap - budget);
        const deposited = Math.min(amount, free);
        const overflow = amount - deposited;
        if (deposited > 0) {
          set((s) => ({ budget: s.budget + deposited }));
          get().completeVaultTutorial();
        }
        const after = get();
        if (after.budget >= cap && deposited > 0) {
          set((s) => ({ vaultFillCount: s.vaultFillCount + 1 }));
        }
        return { deposited, overflow };
      },

      applyActivityReward: (reward) => {
        set((s) => ({
          xp: s.xp + reward.xp,
          fans: s.fans + reward.fans,
          cards: s.cards + reward.cards,
        }));
        return get().depositVault(reward.vaultMoney);
      },

      // ساعتِ یک واحد را روی «الان» بگذار اگر شروع نشده
      ensureUnitClock: (id) => {
        const u = get().units[id];
        if (u && !u.lastCollect) {
          set((s) => ({
            units: { ...s.units, [id]: { ...s.units[id], lastCollect: Date.now() } },
          }));
        }
      },

      // برداشتِ درآمدِ یک واحد → خزانه (تا جای خالیِ ظرفیت)
      collectUnit: (id) => {
        const def = unitDef(id);
        const { units, assign, vaultLevel, budget } = get();
        const u = units[id];
        if (!u) return 0;

        const m = assign[id] ? managerDef(assign[id]!) : null;
        const income = m?.incomeMult ?? 1;
        const speed = m?.speedMult ?? 1;
        const items = get().itemLevels[id] ?? {};

        const fanMult = fanIncomeMultiplier(get().fans);
        const now = Date.now();
        const last = u.lastCollect || now;
        const pending = unitPending(
          def,
          u.level,
          items,
          last,
          now,
          income,
          speed,
          fanMult,
        );
        if (pending <= 0) return 0;

        const rate = unitStats(
          def,
          u.level,
          items,
          income,
          speed,
          fanMult,
        ).ratePerSecond;

        let deposit: number;
        let newLast: number;

        if (isBank(vaultLevel)) {
          deposit = pending;
          newLast = now;
        } else {
          const free = Math.max(0, vaultCapacity(vaultLevel) - budget);
          deposit = Math.min(pending, free);
          if (deposit <= 0) return 0;
          const rem = pending - deposit;
          newLast = now - (rate > 0 ? rem / rate : 0) * 1000;
        }

        const { deposited } = get().depositVault(deposit);
        if (deposited <= 0) return 0;

        set((s) => ({
          units: { ...s.units, [id]: { ...s.units[id], lastCollect: newLast } },
          unitCollectCount: s.unitCollectCount + 1,
          ...bumpDailyProgress(s.dailyDate, s.dailyProgress, "daily_collect"),
        }));
        return deposited;
      },

      collectAllUnits: () => {
        let total = 0;
        const xp = get().xp;
        for (const u of UNITS) {
          if (levelForXp(xp) < unitDef(u.id).requiresLevel) continue;
          total += get().collectUnit(u.id);
        }
        return total;
      },

      // ارتقای یک واحد (نرخِ درآمد ↑) — با بودجه
      upgradeUnit: (id) => {
        const def = unitDef(id);
        const { units, budget } = get();
        const u = units[id];
        if (!u) return "max";
        if (u.level >= def.maxLevel) return "max";
        const cost = unitUpgradeCost(def, u.level);
        if (budget < cost) return "poor";
        set((s) => ({
          budget: s.budget - cost,
          units: { ...s.units, [id]: { ...s.units[id], level: u.level + 1 } },
        }));
        return "ok";
      },

      // ارتقای یک آیتمِ داخلیِ واحد — با بودجه
      upgradeItem: (unitId, itemId) => {
        const def = unitDef(unitId);
        const item = def.items.find((it) => it.id === itemId);
        if (!item) return "max";
        const { units, itemLevels, budget } = get();
        const unitLevel = units[unitId]?.level ?? 1;
        if (unitLevel < item.unlockLevel) return "locked";
        const lvl = itemLevels[unitId]?.[itemId] ?? 0;
        if (lvl >= item.maxLevel) return "max";
        const cost = itemUpgradeCost(item, lvl);
        if (budget < cost) return "poor";
        set((s) => ({
          budget: s.budget - cost,
          itemLevels: {
            ...s.itemLevels,
            [unitId]: { ...(s.itemLevels[unitId] ?? {}), [itemId]: lvl + 1 },
          },
        }));
        return "ok";
      },

      // استخدامِ مدیر (باز کردن) — با بودجه
      hireManager: (managerId) => {
        const def = managerDef(managerId);
        if (!def) return "max";
        const { hired, budget } = get();
        if (hired[managerId]) return "max";
        if (budget < def.cost) return "poor";
        set((s) => ({
          budget: s.budget - def.cost,
          hired: { ...s.hired, [managerId]: true },
        }));
        return "ok";
      },

      // انتصابِ مدیرِ استخدام‌شده به یک واحد (هر مدیر فقط روی یک واحد)
      assignManager: (unitId, managerId) => {
        const def = managerDef(managerId);
        if (!def) return "max";
        const { hired, assign } = get();
        if (!hired[managerId]) return "poor"; // اول باید استخدام شود
        if (def.target !== "all" && def.target !== unitId) return "locked";
        // اگر این مدیر روی واحدِ دیگری است، از آن‌جا بردار
        const next: Record<string, string | null> = { ...assign };
        for (const uid of Object.keys(next)) {
          if (next[uid] === managerId) next[uid] = null;
        }
        next[unitId] = managerId;
        set({ assign: next });
        return "ok";
      },

      unassignUnit: (unitId) =>
        set((s) => ({ assign: { ...s.assign, [unitId]: null } })),

      // ارتقای گاوصندوق (ظرفیت ↑ / تبدیل به بانک) — از خزانه
      upgradeVault: () => {
        const { vaultLevel, budget } = get();
        if (vaultLevel >= VAULT_MAX) return "max";
        const cost = vaultUpgradeCost(vaultLevel);
        if (budget < cost) return "poor";
        set({
          budget: budget - cost,
          vaultLevel: vaultLevel + 1,
        });
        return "ok";
      },

      recordWin: () => set((s) => ({ matchesWon: s.matchesWon + 1 })),

      completeSetup: (club) => {
        const now = Date.now();
        const units = Object.fromEntries(
          Object.entries(get().units).map(([id, u]) => [id, { ...u, lastCollect: now }]),
        );
        set({ club, setupDone: true, units });
      },

      updateClubProfile: (patch) =>
        set((s) => ({
          club: { ...s.club, ...patch },
        })),

      reportQuestion: (questionId, reason) =>
        set((s) => ({
          reports: [
            ...s.reports.slice(-49), // سقفِ ۵۰ گزارشِ اخیر
            { questionId, reason, at: Date.now() },
          ],
        })),

      saveSurvival: (score) => {
        const prev = get().survivalBest;
        if (score > prev) {
          set({ survivalBest: score });
          return true;
        }
        return false;
      },

      saveBomb: (score) => {
        const prev = get().bombBest;
        if (score > prev) {
          set({ bombBest: score });
          return true;
        }
        return false;
      },

      syncLives: () => {
        const { lives, livesUpdatedAt } = get();
        const next = syncLivesState(lives, livesUpdatedAt);
        if (next.lives !== lives || next.livesUpdatedAt !== livesUpdatedAt) {
          set(next);
        }
      },

      spendLife: () => {
        get().syncLives();
        const { lives, livesUpdatedAt } = get();
        if (lives <= 0) return false;
        set({
          lives: lives - 1,
          livesUpdatedAt:
            lives === ECONOMY.lives.max ? Date.now() : livesUpdatedAt,
        });
        return true;
      },

      recordDailyPlay: () => {
        set((s) => {
          const next = nextStreak(s.lastPlayDate, s.streakDays);
          const reward = streakMilestoneReward(next.streakDays);
          const daily = bumpDailyProgress(
            s.dailyDate,
            s.dailyProgress,
            "daily_play",
          );
          return {
            ...next,
            gamesPlayed: s.gamesPlayed + 1,
            ...daily,
            ...(reward ? { cards: s.cards + reward.cards } : {}),
          };
        });
      },

      addTotalCorrect: (n) =>
        set((s) => ({
          totalCorrect: s.totalCorrect + n,
          ...bumpDailyProgress(s.dailyDate, s.dailyProgress, "daily_correct", n),
        })),

      buyPowerUp: (id) => {
        const def = powerUpDef(id);
        const { cards } = get();
        if (cards < def.price) return "poor";
        set((s) => ({
          cards: s.cards - def.price,
          powerups: {
            ...s.powerups,
            [id]: (s.powerups[id] ?? 0) + 1,
          },
        }));
        return "ok";
      },

      usePowerUp: (id) => {
        const count = get().powerups[id] ?? 0;
        if (count <= 0) return false;
        set((s) => ({
          powerups: { ...s.powerups, [id]: count - 1 },
        }));
        return true;
      },

      syncClubEconomy: () => {
        const { xp, assign } = get();
        for (const u of UNITS) {
          if (levelForXp(xp) < unitDef(u.id).requiresLevel) continue;
          if (!assign[u.id]) continue;
          get().collectUnit(u.id);
        }
      },

      completeVaultTutorial: () => {
        if (!get().showVaultTutorial) return;
        set({ showVaultTutorial: false });
      },

      ensureDailyMissions: () => {
        const today = todayKey();
        if (get().dailyDate !== today) {
          set({ dailyDate: today, dailyProgress: {} });
        }
      },

      claimMission: (id) => {
        get().ensureDailyMissions();
        const def = missionById(id);
        if (!def) return "locked";
        const snap = missionSnapFromState(get());
        const status = missionStatus(def, snap);
        if (status.claimed) return "claimed";
        if (!status.complete) return "locked";
        get().applyActivityReward(def.reward);
        set((s) => ({
          missionClaimed: { ...s.missionClaimed, [id]: true },
        }));
        return "ok";
      },

      claimableMissions: () =>
        claimableMissionCount(missionSnapFromState(get())),

      resetSave: () => set({ ...initialState }),
    }),
    {
      name: "footballica-save",
      version: 6,
      migrate: (persisted, version) => {
        const s = persisted as Record<string, unknown>;
        if (version < 2) {
          const coins = typeof s.coins === "number" ? s.coins : 0;
          const cards = typeof s.cards === "number" ? s.cards : 2;
          s.cards = cards + Math.max(0, Math.floor(coins / 30));
          delete s.coins;
          delete s.incomeAvailable;
        }
        if (version < 3) {
          const matchesWon = typeof s.matchesWon === "number" ? s.matchesWon : 0;
          const budget = typeof s.budget === "number" ? s.budget : 0;
          s.showVaultTutorial = matchesWon === 0 && budget === 0;
        }
        if (version < 4) {
          s.gamesPlayed = typeof s.gamesPlayed === "number" ? s.gamesPlayed : 0;
          s.unitCollectCount =
            typeof s.unitCollectCount === "number" ? s.unitCollectCount : 0;
          s.vaultWithdrawCount =
            typeof s.vaultWithdrawCount === "number" ? s.vaultWithdrawCount : 0;
          s.vaultFillCount =
            typeof s.vaultFillCount === "number" ? s.vaultFillCount : 0;
          s.dailyDate = typeof s.dailyDate === "string" ? s.dailyDate : "";
          s.dailyProgress =
            typeof s.dailyProgress === "object" && s.dailyProgress
              ? s.dailyProgress
              : {};
          s.missionClaimed =
            typeof s.missionClaimed === "object" && s.missionClaimed
              ? s.missionClaimed
              : {};
        }
        if (version < 5) {
          const club = s.club as Record<string, unknown> | undefined;
          if (club && typeof club === "object") {
            if (club.city === undefined) club.city = undefined;
            if (club.heartTeam === undefined) club.heartTeam = undefined;
            if (club.internationalTeam === undefined) club.internationalTeam = undefined;
          }
        }
        if (version < 6) {
          const budget = typeof s.budget === "number" ? s.budget : 0;
          const vaultBalance =
            typeof s.vaultBalance === "number" ? s.vaultBalance : 0;
          s.budget = budget + vaultBalance;
          delete s.vaultBalance;
          delete s.vaultWithdrawCount;
        }
        return persisted;
      },
      storage: createJSONStorage(() => localStorage),
      // سمتِ سرور localStorage نیست؛ rehydrate را دستی در page انجام می‌دهیم
      skipHydration: true,
      // فقط داده را ذخیره کن، نه اکشن‌ها
      partialize: (s) => ({
        cards: s.cards,
        fans: s.fans,
        budget: s.budget,
        xp: s.xp,
        reputation: s.reputation,
        levels: s.levels,
        units: s.units,
        itemLevels: s.itemLevels,
        hired: s.hired,
        assign: s.assign,
        vaultLevel: s.vaultLevel,
        matchesWon: s.matchesWon,
        setupDone: s.setupDone,
        club: s.club,
        survivalBest: s.survivalBest,
        bombBest: s.bombBest,
        totalCorrect: s.totalCorrect,
        lives: s.lives,
        livesUpdatedAt: s.livesUpdatedAt,
        streakDays: s.streakDays,
        lastPlayDate: s.lastPlayDate,
        powerups: s.powerups,
        reports: s.reports,
        showVaultTutorial: s.showVaultTutorial,
        gamesPlayed: s.gamesPlayed,
        unitCollectCount: s.unitCollectCount,
        vaultFillCount: s.vaultFillCount,
        dailyDate: s.dailyDate,
        dailyProgress: s.dailyProgress,
        missionClaimed: s.missionClaimed,
      }),
    },
  ),
);
