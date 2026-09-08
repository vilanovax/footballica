"use client";

import { motion } from "framer-motion";
import type { GameConfig } from "@/lib/game/economy";
import { HELPER_KEYS, HELPER_META, type HelperKey } from "@/lib/game/helpers";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { ResourceIcon } from "@/components/common/ResourceIcon";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GameTile } from "@/components/ui/game/GameTile";

type HelperDockProps = {
  /** Live helper costs. */
  helpers: GameConfig["helpers"];
  /** Coins still spendable (startingCoins − coinsSpent). */
  coinsLeft: number;
  /** Helpers already used on the current question. */
  usedThisQuestion: HelperKey[];
  /** Wrong options already removed on the current question. */
  eliminatedCount: number;
  /** Total options in the question (usually 4). */
  optionCount: number;
  /** Spare questions left for Substitution. */
  benchLeft: number;
  /** Disable the whole dock (reveal / paused). */
  disabled: boolean;
  onUse: (key: HelperKey) => void;
};

/**
 * Row of coin-spend helpers shown under the answer options during a match.
 * Each helper is affordable-gated and usable once per question; option-removing
 * helpers also disable when no wrong options remain to remove.
 */
export function HelperDock({
  helpers,
  coinsLeft,
  usedThisQuestion,
  eliminatedCount,
  optionCount,
  benchLeft,
  disabled,
  onUse,
}: HelperDockProps) {
  const { t, locale } = useTranslation();
  const wrongsRemaining = Math.max(0, optionCount - 1 - eliminatedCount);

  return (
    <GameTile className="relative mt-1 p-2.5">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="font-display text-xs font-black text-white/70">
          {t("quiz.helpers.title")}
        </span>
        <GameChip tone="amber" className="gap-1 px-2 py-0.5 text-[11px]">
          <ResourceIcon kind="coin" size="sm" className="h-3.5 w-3.5" />
          {toLocaleDigits(coinsLeft, locale)}
        </GameChip>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {HELPER_KEYS.map((key) => {
          const meta = HELPER_META[key];
          const cost = helpers[key];
          const used = usedThisQuestion.includes(key);
          const tooPoor = coinsLeft < cost;
          const noWrongsLeft =
            meta.removes > 0 && wrongsRemaining < meta.removes;
          const noBench = key === "reroll" && benchLeft <= 0;
          const isDisabled =
            disabled || used || tooPoor || noWrongsLeft || noBench;

          return (
            <motion.button
              key={key}
              type="button"
              disabled={isDisabled}
              whileTap={isDisabled ? undefined : { scale: 0.92, y: 2 }}
              onClick={() => onUse(key)}
              aria-label={`${t(meta.labelKey)} — ${cost}`}
              className={[
                "relative flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring",
                used
                  ? "bg-emerald-500/20 shadow-[0_0_0_1px_rgba(52,211,153,0.4)]"
                  : isDisabled
                    ? "bg-white/5 opacity-45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "bg-black/40 shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_3px_0_0_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.3)]",
              ].join(" ")}
            >
              <GameIconWell
                size="sm"
                amber={!isDisabled && !used}
                src={meta.iconSrc}
                className="h-8 w-8"
                iconClassName="h-5 w-5"
              />
              <span className="line-clamp-1 w-full text-center font-display text-[10px] font-black text-white/85">
                {t(meta.labelKey)}
              </span>
              {used ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/icons/done.png"
                  alt=""
                  aria-hidden
                  className="h-3.5 w-3.5 object-contain"
                />
              ) : (
                <span className="inline-flex items-center gap-0.5 font-display text-[10px] font-black text-amber-200">
                  <ResourceIcon kind="coin" size="sm" className="h-3 w-3" />
                  {toLocaleDigits(cost, locale)}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </GameTile>
  );
}
