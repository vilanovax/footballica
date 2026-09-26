"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  buyUpgrade,
  buyBooster,
  purchaseCoinPack,
  type BoosterShopType,
  type ShopErrorCode,
  type ShopResult,
} from "@/actions/shop";
import {
  UPGRADE_LIST,
  getClubLevel,
  getUpgradeCost,
  type ClubSnapshot,
} from "@/lib/club/upgrades";
import {
  COIN_PACK_LIST,
  type CoinPackTier,
} from "@/lib/game/coinPacks";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { UpgradeCard } from "@/components/club-hub/UpgradeCard";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GameOffer } from "@/components/ui/game/GameOffer";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { cn } from "@/lib/utils";

type ShopProps = {
  initialClub: ClubSnapshot;
  /** Costs sourced from GameConfig on the server. */
  boosterCosts: Record<BoosterShopType, number>;
  /** Deep-link from StatusBar coin "+" (`?tab=coins`). */
  initialTab?: Tab;
};

type Tab = "upgrades" | "boosters" | "coins";

/** Booster catalog (metadata only — cost + counts come from the server). */
const BOOSTERS: {
  type: BoosterShopType;
  iconSrc: string;
  owned: (c: ClubSnapshot) => number;
}[] = [
  {
    type: "FIFTY_FIFTY",
    iconSrc: "/icons/help.png",
    owned: (c) => c.boosterFiftyFifty,
  },
  {
    type: "FREEZE_TIMER",
    iconSrc: "/icons/timer.png",
    owned: (c) => c.boosterFreezeTimer,
  },
];

const TABS: { key: Tab; iconSrc?: string; glyph?: string }[] = [
  { key: "coins", iconSrc: "/icons/coin.png" },
  { key: "boosters", iconSrc: "/icons/energy.png" },
  { key: "upgrades", iconSrc: "/icons/upgrade.png" },
];

const PACK_ICON_SIZE: Record<CoinPackTier, "md" | "lg" | "xl"> = {
  SMALL: "md",
  MEDIUM: "lg",
  LARGE: "xl",
};

const PACK_STACK: Record<CoinPackTier, number> = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 3,
};

export function Shop({
  initialClub,
  boosterCosts,
  initialTab = "upgrades",
}: ShopProps) {
  const { t, locale } = useTranslation();
  const [club, setClub] = useState(initialClub);
  const [tab, setTab] = useState<Tab>(
    TABS.some((x) => x.key === initialTab) ? initialTab : "upgrades",
  );
  const [pending, setPending] = useState<string | null>(null);
  const [coinPulse, setCoinPulse] = useState(0);
  const [, startTransition] = useTransition();

  function errorMessage(code: ShopErrorCode): string {
    switch (code) {
      case "insufficient":
        return t("shop.errInsufficient");
      case "maxed":
        return t("shop.errMax");
      case "already_full":
        return t("status.staminaAlreadyFull");
      case "rate_limited":
        return t("shop.errRateLimited");
      default:
        return t("shop.errGeneric");
    }
  }

  function handleResult(result: ShopResult, successMsg: string) {
    if (result.ok) {
      setClub(result.club);
      setCoinPulse((k) => k + 1);
      playSound("upgrade");
      haptic(HAPTIC.tap);
      toast.success(successMsg);
    } else {
      haptic(HAPTIC.light);
      toast.error(errorMessage(result.code));
    }
  }

  function purchaseUpgrade(key: (typeof UPGRADE_LIST)[number]["key"]) {
    if (pending) return;
    setPending(key);
    startTransition(async () => {
      const result = await buyUpgrade(key);
      setPending(null);
      handleResult(
        result,
        t("shop.boughtUpgrade", { name: t(`upgrades.${key}.name`) }),
      );
    });
  }

  function purchaseBooster(type: BoosterShopType) {
    if (pending) return;
    setPending(type);
    startTransition(async () => {
      const result = await buyBooster(type);
      setPending(null);
      handleResult(
        result,
        t("shop.boughtBooster", { name: t(`shop.boosters.${type}.name`) }),
      );
    });
  }

  function buyPack(tier: CoinPackTier) {
    if (pending) return;
    setPending(tier);
    startTransition(async () => {
      const result = await purchaseCoinPack(tier);
      setPending(null);
      handleResult(
        result,
        t("shop.boughtPack", { name: t(`shop.packs.${tier}.name`) }),
      );
    });
  }

  function tabLabel(key: Tab): string {
    if (key === "upgrades") return t("shop.tabUpgrades");
    if (key === "boosters") return t("shop.tabBoosters");
    return t("shop.tabCoins");
  }

  return (
    <section className="flex flex-1 flex-col gap-2.5 pb-2">
      {/* ── Compact vault strip ─────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GamePanel tone="amber" pinstripe={false} className="px-3 py-2.5">
          <div
            aria-hidden
            className="pointer-events-none absolute -end-10 -top-8 h-24 w-24 rounded-full bg-amber-300/20 blur-3xl"
          />

          <div className="relative flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] font-black tracking-wide text-amber-200/80">
                {t("shop.eyebrow")}
              </p>
              <h1 className="truncate font-display text-base font-black leading-tight text-white">
                {t("shop.title")}
              </h1>
            </div>

            <motion.div
              key={coinPulse}
              animate={
                coinPulse
                  ? { scale: [1, 1.12, 1], y: [0, -4, 0] }
                  : undefined
              }
              transition={coinPulse ? { duration: 0.45 } : undefined}
              className="flex shrink-0 items-center gap-2 rounded-bubble bg-black/35 px-2.5 py-1.5 ring-1 ring-amber-300/35"
            >
              <GameIconWell amber className="h-9 w-9">
                <ResourceIcon kind="coin" size="md" className="h-6 w-6!" />
              </GameIconWell>
              <div className="min-w-0 text-start leading-none">
                <p className="font-display text-[9px] font-black text-white/55">
                  {t("shop.budget")}
                </p>
                <motion.p
                  key={`bal-${coinPulse}`}
                  initial={coinPulse ? { scale: 1.1 } : false}
                  animate={{ scale: 1 }}
                  className="font-display text-xl font-black tabular-nums text-amber-300"
                >
                  {toLocaleDigits(club.coins, locale)}
                </motion.p>
              </div>
            </motion.div>

            <Link
              href="/club"
              onClick={() => playSound("click")}
              className="game-cta game-cta-ghost min-h-11 shrink-0 gap-1 px-2.5 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/back.png"
                alt=""
                aria-hidden
                draggable={false}
                className="h-3.5 w-3.5 object-contain opacity-90"
              />
              {t("common.back")}
            </Link>
          </div>
        </GamePanel>
      </motion.header>

      {/* ── Mode tabs ──────────────────────────────────────────── */}
      <GamePanel tone="emerald" pinstripe={false} className="p-1">
        <div
          role="tablist"
          aria-label={t("shop.title")}
          className="relative grid grid-cols-3 gap-1"
        >
          {TABS.map(({ key, iconSrc, glyph }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  playSound("click");
                  setTab(key);
                }}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-display transition-colors",
                  active ? "text-white" : "text-white/50",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="shop-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-linear-to-b from-emerald-500/90 to-emerald-900/95 ring-1 ring-emerald-300/35"
                  />
                )}
                <span
                  className="relative flex h-5 items-center justify-center"
                  aria-hidden
                >
                  {iconSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconSrc}
                      alt=""
                      draggable={false}
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    glyph
                  )}
                </span>
                <span className="relative text-[10px] font-black sm:text-[11px]">
                  {tabLabel(key)}
                </span>
              </button>
            );
          })}
        </div>
      </GamePanel>

      {/* ── Tab content ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-2"
        >
          {tab === "upgrades" &&
            UPGRADE_LIST.map((def) => {
              const level = getClubLevel(club, def.key);
              const cost = getUpgradeCost(def.key, level);
              const canAfford = cost !== null && club.coins >= cost;
              return (
                <UpgradeCard
                  key={def.key}
                  def={def}
                  level={level}
                  maxStamina={club.maxStamina}
                  cost={cost}
                  canAfford={canAfford}
                  pending={pending === def.key}
                  onUpgrade={() => purchaseUpgrade(def.key)}
                />
              );
            })}

          {tab === "boosters" &&
            BOOSTERS.map((b) => {
              const cost = boosterCosts[b.type];
              const canAfford = club.coins >= cost;
              const isPending = pending === b.type;
              const disabled = !canAfford || isPending;
              const owned = b.owned(club);
              return (
                <GamePanel
                  key={b.type}
                  tone="emerald"
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2.5",
                    !canAfford && "opacity-85",
                  )}
                >
                  <GameIconWell size="lg" src={b.iconSrc} amber={canAfford} />

                  <div className="relative min-w-0 flex-1 text-start">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-display text-[15px] font-black text-white">
                        {t(`shop.boosters.${b.type}.name`)}
                      </p>
                      <GameChip
                        tone={owned > 0 ? "amber" : "emerald"}
                        className="text-[10px]"
                      >
                        {t("shop.owned", {
                          n: toLocaleDigits(owned, locale),
                        })}
                      </GameChip>
                    </div>
                    <p className="mt-0.5 line-clamp-2 font-display text-[11px] font-bold leading-snug text-white/70">
                      {t(`shop.boosters.${b.type}.desc`)}
                    </p>
                  </div>

                  <GameCta
                    variant={canAfford ? "accent" : "ghost"}
                    disabled={disabled}
                    onClick={() => purchaseBooster(b.type)}
                    className="min-h-12 min-w-18 shrink-0 flex-col gap-0 px-2.5 py-1.5 text-xs"
                    aria-label={`${t("shop.buy")} ${toLocaleDigits(cost, locale)}`}
                  >
                    {isPending ? (
                      <span>…</span>
                    ) : (
                      <>
                        <span className="leading-none">{t("shop.buy")}</span>
                        <span
                          dir="ltr"
                          className={cn(
                            "mt-0.5 inline-flex items-center gap-0.5 text-[11px] tabular-nums",
                            canAfford ? "opacity-80" : "text-rose-300",
                          )}
                        >
                          <ResourceIcon kind="coin" size="sm" />
                          {toLocaleDigits(cost, locale)}
                        </span>
                      </>
                    )}
                  </GameCta>
                </GamePanel>
              );
            })}

          {tab === "boosters" && (
            <p className="px-1 pt-0.5 text-center font-display text-[11px] font-bold text-white/50">
              {t("shop.boosterHint")}
            </p>
          )}

          {tab === "coins" && (
            <>
              <p className="px-1 text-center font-display text-[11px] font-bold text-white/50">
                {t("shop.coinHint")}
              </p>
              {COIN_PACK_LIST.map((pack, i) => {
                const isPending = pending === pack.tier;
                const stack = PACK_STACK[pack.tier];
                const body = (
                  <PackCardBody
                    pack={pack}
                    stack={stack}
                    locale={locale}
                    isPending={isPending}
                    pendingBusy={!!pending}
                    onBuy={() => buyPack(pack.tier)}
                    bestValueLabel={t("shop.bestValue")}
                    packName={t(`shop.packs.${pack.tier}.name`)}
                    packDesc={t(`shop.packs.${pack.tier}.desc`)}
                    coinsLabel={t("shop.coins")}
                    buyPackLabel={t("shop.buyPack")}
                    currencyLabel={t("shop.currencyIrr")}
                  />
                );

                return (
                  <motion.div
                    key={pack.tier}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.05,
                      type: "spring",
                      stiffness: 320,
                      damping: 22,
                    }}
                  >
                    {pack.highlight ? (
                      <GameOffer className="relative">{body}</GameOffer>
                    ) : (
                      <GamePanel tone="amber" className="relative px-3 py-2.5">
                        {body}
                      </GamePanel>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

type PackCardBodyProps = {
  pack: (typeof COIN_PACK_LIST)[number];
  stack: number;
  locale: Locale;
  isPending: boolean;
  pendingBusy: boolean;
  onBuy: () => void;
  bestValueLabel: string;
  packName: string;
  packDesc: string;
  coinsLabel: string;
  buyPackLabel: string;
  currencyLabel: string;
};

function PackCardBody({
  pack,
  stack,
  locale,
  isPending,
  pendingBusy,
  onBuy,
  bestValueLabel,
  packName,
  packDesc,
  coinsLabel,
  buyPackLabel,
  currencyLabel,
}: PackCardBodyProps) {
  return (
    <>
      <div className="relative flex items-center gap-2.5">
        <div className="relative flex h-12 w-14 shrink-0 items-center justify-center">
          {Array.from({ length: stack }).map((_, si) => (
            <motion.div
              key={si}
              className="absolute"
              style={{
                insetInlineStart: `${si * 8}px`,
                zIndex: stack - si,
              }}
              animate={{ y: [0, -2 - si, 0] }}
              transition={{
                duration: 1.8 + si * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: si * 0.12,
              }}
            >
              <ResourceIcon
                kind="coin"
                size={PACK_ICON_SIZE[pack.tier]}
                className={pack.tier === "LARGE" ? "h-11 w-11!" : undefined}
              />
            </motion.div>
          ))}
        </div>

        <div className="min-w-0 flex-1 text-start">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-display text-[11px] font-black text-white/60">
              {packName}
            </p>
            {pack.highlight && (
              <GameChip
                tone="amber"
                className="bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-accent-foreground"
              >
                {bestValueLabel}
              </GameChip>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-baseline gap-1 font-display font-black tabular-nums leading-none text-amber-300">
            <span className="text-2xl">
              +{toLocaleDigits(pack.coinsGranted, locale)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-white/55">
              <ResourceIcon kind="coin" size="sm" />
              {coinsLabel}
            </span>
          </p>
          <p className="mt-0.5 line-clamp-1 font-display text-[11px] font-bold text-white/55">
            {packDesc}
          </p>
        </div>
      </div>

      <GameCta
        variant="accent"
        block
        disabled={pendingBusy}
        onClick={onBuy}
        className="relative mt-2.5 min-h-12 flex-col gap-0 py-2 text-sm disabled:opacity-60"
      >
        {isPending ? (
          "…"
        ) : (
          <>
            <span className="text-[10px] font-black uppercase tracking-wide opacity-60">
              {buyPackLabel}
            </span>
            <span className="font-display text-base font-black tabular-nums leading-none">
              {toLocaleDigits(pack.price, locale)} {currencyLabel}
            </span>
          </>
        )}
      </GameCta>
    </>
  );
}
