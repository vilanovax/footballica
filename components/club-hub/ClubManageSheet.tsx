"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NextGoalCard } from "@/components/club-hub/NextGoalCard";
import { UpgradeCard } from "@/components/club-hub/UpgradeCard";
import {
  UPGRADE_LIST,
  getClubLevel,
  getUpgradeCost,
  type ClubSnapshot,
  type UpgradeKey,
} from "@/lib/club/upgrades";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";

const BusinessPanel = dynamic(() =>
  import("@/components/club-hub/BusinessPanel").then((m) => m.BusinessPanel),
);

type ClubManageSheetProps = {
  open: boolean;
  onClose: () => void;
  /** FTUE step 1 keeps the sheet up until the first stadium buy. */
  dismissible: boolean;
  club: ClubSnapshot;
  coinsPerWin: number;
  pendingKey: UpgradeKey | null;
  goalSpotlightKey: UpgradeKey | null;
  error: string | null;
  showBusiness: boolean;
  tutorialStep: number;
  onUpgrade: (key: UpgradeKey) => void;
  onFocusUpgrade: (key: UpgradeKey) => void;
  onClubUpdate: (club: ClubSnapshot) => void;
  coach?: React.ReactNode;
};

/**
 * Coin upgrades and club business, behind the stadium — not the first scroll.
 */
export function ClubManageSheet({
  open,
  onClose,
  dismissible,
  club,
  coinsPerWin,
  pendingKey,
  goalSpotlightKey,
  error,
  showBusiness,
  tutorialStep,
  onUpgrade,
  onFocusUpgrade,
  onClubUpdate,
  coach,
}: ClubManageSheetProps) {
  const { t, locale } = useTranslation();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissible={dismissible}
      title={t("club.upgrades")}
      subtitle={`${t("stadium.lvl")} ${toLocaleDigits(club.stadiumLevel, locale)}`}
      closeLabel={t("common.close")}
      tone="dark"
    >
      <div className="flex flex-col gap-2">
        {coach}
        {showBusiness && (
          <NextGoalCard
            coinsPerWin={coinsPerWin}
            milestoneInput={{
              coins: club.coins,
              stadiumLevel: club.stadiumLevel,
              medicalLevel: club.medicalLevel,
              trainingGroundLevel: club.trainingGroundLevel,
            }}
            onFocusUpgrade={onFocusUpgrade}
          />
        )}
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-display text-xs font-bold text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {UPGRADE_LIST.map((def) => {
          const level = getClubLevel(club, def.key);
          const cost = getUpgradeCost(def.key, level);
          const canAfford = cost !== null && club.coins >= cost;
          const isForcedStadium =
            tutorialStep === 1 && def.key === "STADIUM";
          const locked =
            tutorialStep === 0 ||
            (tutorialStep === 1 && def.key !== "STADIUM");
          return (
            <UpgradeCard
              key={def.key}
              id={`club-upgrade-${def.key}`}
              def={def}
              level={level}
              maxStamina={club.maxStamina}
              cost={cost}
              canAfford={canAfford}
              pending={pendingKey === def.key}
              locked={locked}
              spotlight={isForcedStadium || goalSpotlightKey === def.key}
              onUpgrade={() => onUpgrade(def.key)}
            />
          );
        })}

        {showBusiness && (
          <div className="mt-2">
            <BusinessPanel club={club} onClubUpdate={onClubUpdate} />
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
