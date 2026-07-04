"use client";

import { BottomSheet, BottomSheetHandle } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { promotionCelebrationForTier } from "@/lib/promotion";

interface PromotionCelebrationSheetProps {
  open: boolean;
  onClose: () => void;
  tierId: string;
  clubName: string;
  rewardText?: string;
}

export function PromotionCelebrationSheet({
  open,
  onClose,
  tierId,
  clubName,
  rewardText,
}: PromotionCelebrationSheetProps) {
  const celebration = promotionCelebrationForTier(tierId);
  if (!celebration) return null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      backdropClassName="promotion-celebration-backdrop"
      panelClassName="promotion-celebration animate-rise"
    >
      <BottomSheetHandle className="promotion-celebration__handle" />

      <div className="promotion-celebration__hero">
        <span className="promotion-celebration__badge animate-pop">⬆️ صعود</span>
        <p className="promotion-celebration__eyebrow">{celebration.eyebrow}</p>
        <h2 className="promotion-celebration__title">{celebration.title}</h2>
        <p className="promotion-celebration__club">{clubName}</p>
        <p className="promotion-celebration__detail">{celebration.detail}</p>
      </div>

      <div className="promotion-celebration__division">
        <span className="promotion-celebration__division-from">
          {celebration.divisionFrom}
        </span>
        <span className="promotion-celebration__division-arrow" aria-hidden>
          ←
        </span>
        <span className="promotion-celebration__division-to">
          {celebration.divisionTo}
        </span>
      </div>

      {rewardText && (
        <GameCard variant="asset" className="promotion-celebration__reward mx-5 rounded-2xl px-4 py-3">
          <p className="promotion-celebration__reward-label">پاداش صعود</p>
          <p className="promotion-celebration__reward-value">{rewardText}</p>
        </GameCard>
      )}

      <div className="promotion-celebration__section px-5">
        <p className="promotion-celebration__section-eyebrow">
          {celebration.nextSeasonTitle}
        </p>
        <p className="promotion-celebration__section-title">حالا تمرکز روی این‌هاست</p>
        <div className="promotion-celebration__unlocks">
          {celebration.unlocks.map((item) => (
            <div key={item.label} className="promotion-celebration__unlock">
              <span className="promotion-celebration__unlock-emoji">{item.emoji}</span>
              <div className="min-w-0 text-right">
                <p className="promotion-celebration__unlock-label">{item.label}</p>
                <p className="promotion-celebration__unlock-hint">{item.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="promotion-celebration__actions px-5 pb-6">
        <Button onClick={onClose} variant="primary" size="lg" fullWidth>
          شروع {celebration.nextSeasonTitle}
        </Button>
      </div>
    </BottomSheet>
  );
}
