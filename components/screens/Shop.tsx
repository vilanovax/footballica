"use client";

import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import {
  POWERUPS,
  powerUpCount,
  type PowerUpDef,
  type PowerUpId,
  type PowerUpMode,
} from "@/lib/powerups";
import {
  COLLECTIBLE_CATEGORIES,
  COLLECTIBLES,
  categoryLabel,
  collectibleDef,
  isEquipped,
  ownedCollectibleCount,
  rarityLabel,
  type CollectibleDef,
  type CollectibleId,
} from "@/lib/collectibles";
import { faNum, faCount, faMoney } from "@/lib/format";

const MODE_LABELS: Record<PowerUpMode, string> = {
  quiz: "مسابقه",
  bomb: "بمب",
  survival: "بقا",
};

const ITEM_TIER: Record<PowerUpId, "common" | "rare" | "epic"> = {
  half: "common",
  time: "common",
  swap: "rare",
  var: "rare",
  defuse: "rare",
  glove: "epic",
};

const BUNDLES = [
  {
    id: "c2",
    title: "۲۰ کارت تاکتیکی",
    sub: "پرطرفدار — بهترین ارزش",
    emoji: "⚡",
    toman: 49000,
    highlight: true,
    hero: true,
  },
  {
    id: "c1",
    title: "۵ کارت تاکتیکی",
    sub: "شروعِ خوب",
    emoji: "⚡",
    toman: 9000,
  },
  {
    id: "noads",
    title: "حذفِ تبلیغ",
    sub: "یک‌بار خرید، برای همیشه",
    emoji: "🚫",
    toman: 39000,
  },
  {
    id: "pass",
    title: "بلیتِ فصلی",
    sub: "جایزهٔ پلکانی هر فصل — کارت و پاورآپ اضافه",
    emoji: "🎟️",
    toman: 79000,
    highlight: true,
  },
] as const;

function modeListLabel(modes: PowerUpMode[]): string {
  return modes.map((m) => MODE_LABELS[m]).join("، ");
}

function PowerUpItem({
  powerup,
  owned,
  enough,
  missing,
  shaking,
  onBuy,
}: {
  powerup: PowerUpDef;
  owned: number;
  enough: boolean;
  missing: number;
  shaking: boolean;
  onBuy: () => void;
}) {
  const tier = ITEM_TIER[powerup.id];
  const buyLabel = enough
    ? `خرید با ${faNum(powerup.price)} کارت`
    : `نیاز به ${faNum(missing)} کارت بیشتر`;

  return (
    <GameCard
      variant="asset"
      className={`shop-item shop-item--${tier} ${
        enough ? "shop-item--ready" : "shop-item--locked"
      } ${shaking ? "animate-shake" : ""}`}
    >
      <div className="shop-item__stage">
        <span className="shop-item__emoji" aria-hidden>
          {powerup.emoji}
        </span>
        <span className={`shop-item__tier shop-item__tier--${tier}`}>
          {tier === "epic" ? "افسانه" : tier === "rare" ? "نادر" : "معمولی"}
        </span>
      </div>

      <div className="shop-item__body">
        <h3 className="shop-item__name">{powerup.name}</h3>
        <p className="shop-item__desc">{powerup.desc}</p>
        <p className="shop-item__modes-line">
          قابل استفاده: {modeListLabel(powerup.modes)}
        </p>
        <div className="shop-item__economy">
          <div className="shop-item__economy-row">
            <span className="shop-item__economy-label">هزینه</span>
            <span className="shop-item__economy-value shop-item__economy-value--cost">
              {faNum(powerup.price)} کارت
            </span>
          </div>
          <div className="shop-item__economy-row">
            <span className="shop-item__economy-label">موجودی</span>
            <span className="shop-item__economy-value">{faNum(owned)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={onBuy}
        variant={enough ? "primary" : "muted"}
        size="sm"
        className={`shop-item__buy ${!enough ? "shop-item__buy--dim" : ""}`}
      >
        {buyLabel}
      </Button>
    </GameCard>
  );
}

function CollectibleItem({
  item,
  owned,
  equipped,
  canBuy,
  missing,
  shaking,
  onBuy,
  onEquip,
}: {
  item: CollectibleDef;
  owned: boolean;
  equipped: boolean;
  canBuy: boolean;
  missing: number;
  shaking: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const priceLabel =
    item.currency === "cards"
      ? `${faNum(item.price)} کارت`
      : faMoney(item.price);

  return (
    <GameCard
      variant="asset"
      className={`shop-collectible shop-collectible--${item.rarity} ${
        owned ? "shop-collectible--owned" : canBuy ? "shop-collectible--ready" : "shop-collectible--locked"
      } ${shaking ? "animate-shake" : ""}`}
    >
      <div className="shop-collectible__stage">
        <span className="shop-collectible__emoji" aria-hidden>
          {item.emoji}
        </span>
        <span className={`shop-collectible__tier shop-collectible__tier--${item.rarity}`}>
          {rarityLabel(item.rarity)}
        </span>
      </div>

      <div className="shop-collectible__body">
        <p className="shop-collectible__category">{categoryLabel(item.category)}</p>
        <h3 className="shop-collectible__name">{item.name}</h3>
        <p className="shop-collectible__desc">{item.desc}</p>
        <p className="shop-collectible__guard">بدون اثر رنکد · فقط کلکسیون</p>
        {!owned && (
          <p className="shop-collectible__price">
            {canBuy ? priceLabel : `نیاز به ${item.currency === "cards" ? `${faNum(missing)} کارت` : faMoney(missing)} بیشتر`}
          </p>
        )}
      </div>

      {owned ? (
        item.equippable ? (
          <Button
            onClick={onEquip}
            variant={equipped ? "secondary" : "primary"}
            size="sm"
            className="shop-collectible__action"
          >
            {equipped ? "فعال ✓" : "فعال‌سازی"}
          </Button>
        ) : (
          <span className="shop-collectible__owned-badge">در کلکسیون ✓</span>
        )
      ) : (
        <Button
          onClick={onBuy}
          variant={canBuy ? "primary" : "muted"}
          size="sm"
          className={`shop-collectible__action ${!canBuy ? "shop-collectible__action--dim" : ""}`}
        >
          {canBuy ? `خرید · ${priceLabel}` : "کمبود منابع"}
        </Button>
      )}
    </GameCard>
  );
}

function BundleCard({
  bundle,
  onTap,
}: {
  bundle: (typeof BUNDLES)[number];
  onTap: () => void;
}) {
  const featured = "highlight" in bundle && bundle.highlight;
  const hero = "hero" in bundle && bundle.hero;

  if (hero) {
    return (
      <GameCard
        as="button"
        variant="hero"
        onClick={onTap}
        className="shop-offer-hero"
      >
        <div className="shop-offer-hero__glow" aria-hidden />
        <span className="shop-offer-hero__badge">ویژه</span>
        <span className="shop-offer-hero__emoji" aria-hidden>
          {bundle.emoji}
        </span>
        <p className="shop-offer-hero__title">{bundle.title}</p>
        <p className="shop-offer-hero__sub">{bundle.sub}</p>
        <span className="shop-offer-hero__cta btn-gold">
          {faCount(bundle.toman)} تومان
        </span>
      </GameCard>
    );
  }

  return (
    <GameCard
      as="button"
      variant="asset"
      onClick={onTap}
      className={`shop-offer-row ${featured ? "shop-offer-row--featured" : ""}`}
    >
      <span className="shop-offer-row__icon" aria-hidden>
        {bundle.emoji}
      </span>
      <div className="shop-offer-row__info">
        <p className="shop-offer-row__title">
          {bundle.title}
          {featured && <span className="shop-offer-row__tag">ویژه</span>}
        </p>
        <p className="shop-offer-row__sub">{bundle.sub}</p>
      </div>
      <span className="shop-offer-row__price">{faCount(bundle.toman)} تومان</span>
    </GameCard>
  );
}

export function Shop() {
  const cards = useGame((s) => s.cards);
  const budget = useGame((s) => s.budget);
  const powerups = useGame((s) => s.powerups);
  const ownedCollectibles = useGame((s) => s.ownedCollectibles);
  const equippedCosmetics = useGame((s) => s.equippedCosmetics);
  const buyPowerUp = useGame((s) => s.buyPowerUp);
  const buyCollectible = useGame((s) => s.buyCollectible);
  const equipCollectible = useGame((s) => s.equipCollectible);

  const [tab, setTab] = useState<"tactics" | "collection">("tactics");
  const [toast, setToast] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const totalOwned = useMemo(
    () => POWERUPS.reduce((n, p) => n + powerUpCount(powerups, p.id), 0),
    [powerups],
  );
  const affordable = useMemo(() => POWERUPS.filter((p) => cards >= p.price), [cards]);
  const firstAffordable = affordable[0] ?? null;
  const collectionOwned = useMemo(
    () => ownedCollectibleCount(ownedCollectibles),
    [ownedCollectibles],
  );
  const affordableCollectibles = useMemo(
    () =>
      COLLECTIBLES.filter((c) => {
        if (ownedCollectibles[c.id]) return false;
        return c.currency === "cards" ? cards >= c.price : budget >= c.price;
      }),
    [cards, budget, ownedCollectibles],
  );

  function scrollToPremium() {
    document.getElementById("shop-premium")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function buy(id: PowerUpId) {
    const p = POWERUPS.find((x) => x.id === id)!;
    const res = buyPowerUp(id);
    if (res === "ok") {
      showToast(`«${p.name}» به موجودی اضافه شد ✓`);
    } else {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
      showToast("کارت تاکتیکی کافی نیست");
    }
  }

  function buyItem(id: CollectibleId) {
    const item = collectibleDef(id);
    const res = buyCollectible(id);
    if (res === "ok") {
      showToast(`«${item.name}» به کلکسیون اضافه شد ✓`);
    } else {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
      showToast(
        item.currency === "cards" ? "کارت تاکتیکی کافی نیست" : "بودجهٔ خزانه کافی نیست",
      );
    }
  }

  function equipItem(id: CollectibleId) {
    const item = collectibleDef(id);
    const res = equipCollectible(id);
    if (res === "ok") {
      showToast(`«${item.name}» فعال شد ✓`);
    }
  }

  return (
    <div className="shop-screen pitch-stripes min-h-dvh pb-32">
      {/* store banner */}
      <GameCard
        variant="hero"
        className="shop-banner mx-5 mt-5 rounded-3xl overflow-hidden"
      >
        <div className="shop-banner__glow" aria-hidden />
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-right flex-1">
              <p className="shop-banner__eyebrow">بازار باشگاه</p>
              <h1 className="shop-banner__title">فروشگاه</h1>
            </div>
            <div className="shop-wallet">
              <span className="shop-wallet__icon" aria-hidden>
                ⚡
              </span>
              <div className="shop-wallet__text">
                <span className="shop-wallet__value">{faNum(cards)}</span>
                <span className="shop-wallet__label">کارت تاکتیکی</span>
              </div>
            </div>
          </div>
          <p className="shop-banner__hint mt-3">
            تاکتیک برای بازی دوستانه · کلکسیون برای هویت باشگاه — هر دو بدون مزیت رنکد.
          </p>
          <div className="shop-banner__stats mt-2">
            {totalOwned > 0 && (
              <span className="shop-banner__owned">
                کولهٔ تاکتیک: {faNum(totalOwned)} پاورآپ
              </span>
            )}
            {collectionOwned > 0 && (
              <span className="shop-banner__owned">
                کلکسیون: {faNum(collectionOwned)} از {faNum(COLLECTIBLES.length)}
              </span>
            )}
          </div>
          <div className="shop-banner__actions">
            <Button onClick={scrollToPremium} variant="secondary" size="sm">
              خرید کارت تاکتیکی
            </Button>
          </div>
        </div>
      </GameCard>

      <div className="shop-tabs mx-5 mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("tactics")}
          className={`shop-tabs__btn ${tab === "tactics" ? "shop-tabs__btn--active" : ""}`}
        >
          <span className="shop-tabs__title">تاکتیک</span>
          <span className="shop-tabs__sub">پاورآپ · فقط دوئل دوستانه</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("collection")}
          className={`shop-tabs__btn ${tab === "collection" ? "shop-tabs__btn--active" : ""}`}
        >
          <span className="shop-tabs__title">کلکسیون باشگاه</span>
          <span className="shop-tabs__sub">cosmetic · prestige · اقتصاد</span>
        </button>
      </div>

      {tab === "tactics" && (
        <>
      {affordable.length > 0 && firstAffordable && (
        <section className="mx-5 mt-4">
          <GameCard variant="asset" highlight className="shop-ready-banner">
            <div className="shop-ready-banner__row">
              <div className="shop-ready-banner__copy">
                <p className="shop-ready-banner__title">
                  {faNum(affordable.length)} از {faNum(POWERUPS.length)} سوپرپاور قابل خرید
                </p>
                <p className="shop-ready-banner__sub">
                  با {faNum(firstAffordable.price)} کارت، «{firstAffordable.name}» را بخر.
                </p>
              </div>
              <Button onClick={() => buy(firstAffordable.id)} variant="primary" size="sm">
                خرید با {faNum(firstAffordable.price)} کارت
              </Button>
            </div>
          </GameCard>
        </section>
      )}

      {/* power-up shelf */}
      <section className="mx-5 mt-6">
        <GameCard variant="asset" className="shop-shelf shop-shelf--ingame">
          <div className="shop-shelf__head">
            <div className="text-right flex-1">
              <p className="shop-shelf__eyebrow">با کارت تاکتیکی</p>
              <h2 className="shop-shelf__title">سوپرپاورها</h2>
            </div>
            <span className="shop-shelf__count">
              {faNum(affordable.length)} از {faNum(POWERUPS.length)}
            </span>
            <span className="shop-shelf__icon" aria-hidden>
              🛒
            </span>
          </div>

          <div className="shop-grid">
            {POWERUPS.map((p) => {
              const owned = powerUpCount(powerups, p.id);
              const enough = cards >= p.price;
              return (
                <PowerUpItem
                  key={p.id}
                  powerup={p}
                  owned={owned}
                  enough={enough}
                  missing={Math.max(0, p.price - cards)}
                  shaking={shakeId === p.id}
                  onBuy={() => buy(p.id)}
                />
              );
            })}
          </div>
        </GameCard>
      </section>

      {/* premium offers */}
      <section id="shop-premium" className="shop-premium mx-5 mt-8">
        <div className="shop-premium__divider">
          <span className="shop-premium__divider-line" aria-hidden />
          <span className="shop-premium__divider-label">خرید با پول واقعی</span>
          <span className="shop-premium__divider-line" aria-hidden />
        </div>

        <GameCard variant="asset" className="shop-premium__panel">
          <div className="shop-premium__head">
            <span className="shop-premium__icon" aria-hidden>
              💎
            </span>
            <div className="text-right flex-1">
              <h2 className="shop-premium__title">بسته‌های ویژه</h2>
              <p className="shop-premium__sub">
                کارت تاکتیکی و مزایا — جدا از خرید درون‌بازی
              </p>
            </div>
            <span className="shop-premium__badge">به‌زودی</span>
          </div>

          <div className="shop-premium__list space-y-3">
            {BUNDLES.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                onTap={() => showToast("خرید با پول واقعی به‌زودی فعال می‌شود")}
              />
            ))}
          </div>

          <p className="shop-footnote mt-4 text-center text-xs leading-6">
            pay-to-skip، نه pay-to-win — در رنکد هیچ پاورآپی فعال نیست
          </p>
        </GameCard>
      </section>
        </>
      )}

      {tab === "collection" && (
        <>
          <section className="mx-5 mt-4">
            <GameCard variant="asset" className="shop-guardrail rounded-2xl p-4 text-right">
              <p className="shop-guardrail__title">قانون مارکت</p>
              <p className="shop-guardrail__sub">
                کلکسیون فقط هویت، prestige و راحتی اقتصادی می‌دهد — accuracy، زمان پاسخ و
                fairness رنکد را دست نمی‌زند.
              </p>
            </GameCard>
          </section>

          {affordableCollectibles.length > 0 && (
            <section className="mx-5 mt-4">
              <GameCard variant="asset" highlight className="shop-ready-banner">
                <div className="shop-ready-banner__row">
                  <div className="shop-ready-banner__copy">
                    <p className="shop-ready-banner__title">
                      {faNum(affordableCollectibles.length)} آیتم کلکسیونی آمادهٔ خرید
                    </p>
                    <p className="shop-ready-banner__sub">
                      از «{affordableCollectibles[0]!.name}» شروع کن و باشگاهت را متمایز کن.
                    </p>
                  </div>
                  <Button
                    onClick={() => buyItem(affordableCollectibles[0]!.id)}
                    variant="primary"
                    size="sm"
                  >
                    خرید
                  </Button>
                </div>
              </GameCard>
            </section>
          )}

          {COLLECTIBLE_CATEGORIES.map((cat) => {
            const items = COLLECTIBLES.filter((c) => c.category === cat.id);
            return (
              <section key={cat.id} className="mx-5 mt-6">
                <GameCard variant="asset" className="shop-shelf shop-shelf--collection">
                  <div className="shop-shelf__head">
                    <div className="text-right flex-1">
                      <p className="shop-shelf__eyebrow">{cat.detail}</p>
                      <h2 className="shop-shelf__title">{cat.label}</h2>
                    </div>
                    <span className="shop-shelf__count">
                      {faNum(items.filter((i) => ownedCollectibles[i.id]).length)} / {faNum(items.length)}
                    </span>
                  </div>
                  <div className="shop-grid">
                    {items.map((item) => {
                      const owned = !!ownedCollectibles[item.id];
                      const equipped = isEquipped(item.id, equippedCosmetics);
                      const balance = item.currency === "cards" ? cards : budget;
                      const canBuy = !owned && balance >= item.price;
                      const missing = Math.max(0, item.price - balance);
                      return (
                        <CollectibleItem
                          key={item.id}
                          item={item}
                          owned={owned}
                          equipped={equipped}
                          canBuy={canBuy}
                          missing={missing}
                          shaking={shakeId === item.id}
                          onBuy={() => buyItem(item.id)}
                          onEquip={() => equipItem(item.id)}
                        />
                      );
                    })}
                  </div>
                </GameCard>
              </section>
            );
          })}
        </>
      )}

      {toast && <div className="shop-toast animate-pop">{toast}</div>}
    </div>
  );
}
