"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import {
  POWERUPS,
  powerUpCount,
  type PowerUpDef,
  type PowerUpId,
  type PowerUpMode,
} from "@/lib/powerups";
import { faNum, faCount } from "@/lib/format";

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
    sub: "جایزهٔ پلکانیِ فصل",
    emoji: "🎟️",
    toman: 79000,
    highlight: true,
  },
] as const;

function PowerUpItem({
  powerup,
  owned,
  enough,
  shaking,
  onBuy,
}: {
  powerup: PowerUpDef;
  owned: number;
  enough: boolean;
  shaking: boolean;
  onBuy: () => void;
}) {
  const tier = ITEM_TIER[powerup.id];

  return (
    <article
      className={`shop-item shop-item--${tier} ${
        enough ? "" : "shop-item--locked"
      } ${shaking ? "animate-shake" : ""}`}
    >
      <div className="shop-item__stage">
        <span className="shop-item__emoji" aria-hidden>
          {powerup.emoji}
        </span>
        {owned > 0 && (
          <span className="shop-item__stock">×{faNum(owned)}</span>
        )}
        <span className={`shop-item__tier shop-item__tier--${tier}`}>
          {tier === "epic" ? "افسانه" : tier === "rare" ? "نادر" : "معمولی"}
        </span>
      </div>

      <div className="shop-item__body">
        <h3 className="shop-item__name">{powerup.name}</h3>
        <p className="shop-item__desc">{powerup.desc}</p>
        <div className="shop-item__modes">
          {powerup.modes.map((mode) => (
            <span key={mode} className="shop-item__mode">
              {MODE_LABELS[mode]}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onBuy}
        className={`shop-item__buy ${enough ? "btn-gold" : "shop-item__buy--dim"}`}
      >
        {enough ? (
          <>
            خرید
            <span className="shop-item__buy-price">
              ⚡ {faNum(powerup.price)}
            </span>
          </>
        ) : (
          <>نیاز: ⚡ {faNum(powerup.price)}</>
        )}
      </button>

      {!enough && (
        <div className="shop-item__lock-overlay" aria-hidden>
          🔒
        </div>
      )}
    </article>
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
      <button type="button" onClick={onTap} className="shop-offer-hero">
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
      </button>
    );
  }

  return (
    <button
      type="button"
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
    </button>
  );
}

export function Shop() {
  const cards = useGame((s) => s.cards);
  const powerups = useGame((s) => s.powerups);
  const buyPowerUp = useGame((s) => s.buyPowerUp);

  const [toast, setToast] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const totalOwned = useMemo(
    () => POWERUPS.reduce((n, p) => n + powerUpCount(powerups, p.id), 0),
    [powerups],
  );

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

  return (
    <div className="shop-screen pitch-stripes min-h-dvh pb-32">
      {/* store banner */}
      <header className="shop-banner mx-5 mt-5 rounded-3xl overflow-hidden">
        <div className="shop-banner__glow" aria-hidden />
        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-right flex-1">
              <p className="shop-banner__eyebrow">بازار تاکتیک</p>
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
            سوپرپاور بخر · در مسابقه، پنالتی و بمب استفاده کن
          </p>
          {totalOwned > 0 && (
            <p className="shop-banner__owned mt-2">
              موجودی تو: {faNum(totalOwned)} پاورآپ
            </p>
          )}
        </div>
      </header>

      {/* power-up shelf */}
      <section className="mx-5 mt-6">
        <div className="shop-shelf">
          <div className="shop-shelf__head">
            <span className="shop-shelf__icon" aria-hidden>
              🛒
            </span>
            <div className="text-right">
              <h2 className="shop-shelf__title">سوپرپاورها</h2>
              <p className="shop-shelf__sub">با کارت تاکتیکی ⚡</p>
            </div>
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
                  shaking={shakeId === p.id}
                  onBuy={() => buy(p.id)}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* premium offers */}
      <section className="mx-5 mt-7">
        <div className="shop-shelf__head mb-3 px-1">
          <span className="shop-shelf__icon" aria-hidden>
            💎
          </span>
          <div className="text-right">
            <h2 className="shop-shelf__title">بسته‌های ویژه</h2>
            <p className="shop-shelf__sub">پول واقعی · به‌زودی</p>
          </div>
        </div>

        <div className="space-y-3">
          {BUNDLES.map((b) => (
            <BundleCard
              key={b.id}
              bundle={b}
              onTap={() => showToast("خرید با پول واقعی به‌زودی فعال می‌شود")}
            />
          ))}
        </div>

        <p className="shop-footnote mt-4 text-center text-xs leading-6">
          pay-to-skip، نه pay-to-win
        </p>
      </section>

      {toast && <div className="shop-toast animate-pop">{toast}</div>}
    </div>
  );
}
