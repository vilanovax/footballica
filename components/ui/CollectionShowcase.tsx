"use client";

import { useMemo } from "react";
import { GameCard } from "@/components/ui/GameCard";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/lib/store";
import { faNum } from "@/lib/format";
import {
  COLLECTIBLES,
  categoryLabel,
  collectibleDef,
  isEquipped,
  ownedCollectibleCount,
  ownedCollectibleItems,
  sortCollectiblesByRarity,
  type CollectibleDef,
  type CollectibleId,
} from "@/lib/collectibles";

interface CollectionShowcaseProps {
  onOpenShop?: () => void;
}

function EquippedSlot({
  label,
  emoji,
  name,
  fallback,
  active,
}: {
  label: string;
  emoji: string;
  name: string;
  fallback: string;
  active: boolean;
}) {
  return (
    <div className={`collection-slot ${active ? "collection-slot--active" : ""}`}>
      <p className="collection-slot__label">{label}</p>
      <span className="collection-slot__emoji" aria-hidden>
        {emoji}
      </span>
      <p className="collection-slot__name">{name}</p>
      {!active && <p className="collection-slot__fallback">{fallback}</p>}
    </div>
  );
}

function CollectionChip({
  item,
  equipped,
  onEquip,
}: {
  item: CollectibleDef;
  equipped: boolean;
  onEquip: () => void;
}) {
  const interactive = item.equippable;

  if (!interactive) {
    return (
      <div className={`collection-chip collection-chip--${item.rarity}`}>
        <span className="collection-chip__emoji" aria-hidden>
          {item.emoji}
        </span>
        <p className="collection-chip__name">{item.name}</p>
        <p className="collection-chip__meta">{categoryLabel(item.category)}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEquip}
      className={`collection-chip collection-chip--${item.rarity} ${
        equipped ? "collection-chip--equipped" : ""
      }`}
    >
      <span className="collection-chip__emoji" aria-hidden>
        {item.emoji}
      </span>
      <p className="collection-chip__name">{item.name}</p>
      <p className="collection-chip__meta">
        {equipped ? "فعال ✓" : "فعال‌سازی"}
      </p>
    </button>
  );
}

export function CollectionShowcase({ onOpenShop }: CollectionShowcaseProps) {
  const club = useGame((s) => s.club);
  const owned = useGame((s) => s.ownedCollectibles);
  const equipped = useGame((s) => s.equippedCosmetics);
  const equipCollectible = useGame((s) => s.equipCollectible);

  const count = ownedCollectibleCount(owned);
  const total = COLLECTIBLES.length;
  const items = useMemo(
    () => sortCollectiblesByRarity(ownedCollectibleItems(owned)),
    [owned],
  );

  const crest = equipped.crestId ? collectibleDef(equipped.crestId) : null;
  const kit = equipped.kitId ? collectibleDef(equipped.kitId) : null;

  function handleEquip(id: CollectibleId) {
    equipCollectible(id);
  }

  return (
    <GameCard variant="asset" className="collection-showcase rounded-3xl p-4">
      <div className="collection-showcase__head">
        <div className="text-right flex-1">
          <p className="collection-showcase__eyebrow">ویترین باشگاه</p>
          <h2 className="collection-showcase__title">کلکسیون من</h2>
          <p className="collection-showcase__sub">
            cosmetic و prestige — بدون اثر رنکد
          </p>
        </div>
        <span className="collection-showcase__count">
          {faNum(count)} / {faNum(total)}
        </span>
      </div>

      <div className="collection-showcase__slots mt-4 grid grid-cols-2 gap-2">
        <EquippedSlot
          label="نشان فعال"
          emoji={crest?.emoji ?? club.crest}
          name={crest?.name ?? "نشان پیش‌فرض"}
          fallback={crest ? "" : "از فروشگاه نشان بخر"}
          active={!!crest}
        />
        <EquippedSlot
          label="لباس فعال"
          emoji={kit?.emoji ?? "👕"}
          name={kit?.name ?? "رنگ باشگاه"}
          fallback={kit ? "" : "از فروشگاه لباس بخر"}
          active={!!kit}
        />
      </div>

      {count === 0 ? (
        <div className="collection-showcase__empty mt-4 text-right">
          <p className="collection-showcase__empty-title">ویترین خالی است</p>
          <p className="collection-showcase__empty-sub">
            نشان، لباس، بنر و کارت آکادمی را از تب کلکسیون فروشگاه جمع کن.
          </p>
          {onOpenShop && (
            <Button onClick={onOpenShop} variant="secondary" size="sm" className="mt-3">
              رفتن به فروشگاه
            </Button>
          )}
        </div>
      ) : (
        <div className="collection-showcase__grid mt-4">
          <p className="collection-showcase__grid-label">آیتم‌های جمع‌شده</p>
          <div className="collection-showcase__scroll no-scrollbar">
            {items.map((item) => (
              <CollectionChip
                key={item.id}
                item={item}
                equipped={isEquipped(item.id, equipped)}
                onEquip={() => handleEquip(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {count > 0 && count < total && onOpenShop && (
        <button
          type="button"
          onClick={onOpenShop}
          className="collection-showcase__link mt-3"
        >
          {faNum(total - count)} آیتم دیگر در فروشگاه · مشاهده
        </button>
      )}
    </GameCard>
  );
}
