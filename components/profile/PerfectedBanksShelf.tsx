"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { PerfectedBank } from "@/lib/dev/dummyClub";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { playSound } from "@/lib/audio/SoundManager";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";

type PerfectedBanksShelfProps = {
  banks: PerfectedBank[];
};

/**
 * Profile shelf of category-locked Penalty Perfects — collection vanity +
 * deep-link back into the chase. Empty state stays compact; filled state
 * expands into a horizontal showcase (UI grows with progression).
 */
export function PerfectedBanksShelf({ banks }: PerfectedBanksShelfProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  return (
    <GamePanel
      tone="amber"
      className={banks.length === 0 ? "px-3 py-2.5" : "p-3"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-e-10 top-0 h-28 w-28 rounded-full bg-emerald-300/15 blur-3xl"
      />
      <div className="relative mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/target.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-5 w-5 shrink-0 object-contain"
          />
          <h2 className="truncate font-display text-sm font-black text-white drop-shadow-sm">
            {t("profile.perfectedBanks")}
          </h2>
        </div>
        <GameChip tone="amber" className="shrink-0 tabular-nums text-[11px]">
          {t("profile.perfectedBanksCount", {
            n: toLocaleDigits(banks.length, locale),
          })}
        </GameChip>
      </div>

      {banks.length === 0 ? (
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 font-display text-xs font-bold text-white/65">
            {t("profile.perfectedBanksEmpty")}
          </p>
          <GameCta
            variant="accent"
            className="min-h-10 shrink-0 px-4 text-sm"
            onClick={() => {
              playSound("click");
              haptic(HAPTIC.tap);
              router.push("/play/penalty");
            }}
          >
            {t("profile.perfectedBanksCta")}
          </GameCta>
        </div>
      ) : (
        <ul className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden">
          {banks.map((b, i) => {
            const name = locale === "fa" ? b.nameFa : b.nameEn;
            return (
              <motion.li
                key={b.categoryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.04,
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                }}
                className="w-[42%] min-w-34 shrink-0 snap-start"
              >
                <Link
                  href="/play/penalty"
                  onClick={() => {
                    playSound("click");
                    haptic(HAPTIC.tap);
                  }}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-ring"
                >
                  <GameTile className="flex min-h-18 flex-col items-center gap-1.5 bg-arena/90 px-2.5 py-2.5 text-center text-white shadow-arena-ring ring-1 ring-emerald-400/40">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      {b.icon || "⚽"}
                    </span>
                    <span className="line-clamp-1 w-full font-display text-xs font-black text-white">
                      {name}
                    </span>
                    <GameChip
                      tone="emerald"
                      className="gap-1 text-[10px] tabular-nums"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/icons/trophy.png"
                        alt=""
                        draggable={false}
                        className="h-3 w-3 object-contain"
                      />
                      {t("profile.perfectedBanksTimes", {
                        n: toLocaleDigits(b.perfectCount, locale),
                      })}
                    </GameChip>
                  </GameTile>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </GamePanel>
  );
}
