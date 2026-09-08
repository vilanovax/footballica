"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { unlockRecordChallenge } from "@/actions/challenge/recordChallenge";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { playSound } from "@/lib/audio/SoundManager";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";

export type PlayChallengeCard = {
  id: string;
  slug: string;
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
  unlockCostCoins: number;
  targetScore: number;
  rewardBadgeSlug: string | null;
  rewardBadgeEmoji: string | null;
  themeKey?: string | null;
  categoryIds: string[];
  expiresAt: Date | string | null;
  unlocked: boolean;
  bestScore: number;
  conquered: boolean;
};

type PremiumChallengesProps = {
  challenges: PlayChallengeCard[];
  coins: number;
  variant?: "lobby" | "play";
};

/**
 * Live-Ops challenge cards — chip meta, big trophy, single CTA (Game UI).
 */
export function PremiumChallenges({
  challenges,
  coins,
  variant = "lobby",
}: PremiumChallengesProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (challenges.length === 0) return null;

  function playChallenge(c: PlayChallengeCard) {
    playSound("click");
    haptic(HAPTIC.tap);
    const qs = new URLSearchParams();
    qs.set("challenge", c.id);
    if (c.categoryIds.length === 1) {
      qs.set("category", c.categoryIds[0]!);
    }
    router.push(`/play/survival?${qs.toString()}`);
  }

  function unlock(c: PlayChallengeCard) {
    if (coins < c.unlockCostCoins) {
      toast.error(t("play.challengeNeedCoins"));
      return;
    }
    setPendingId(c.id);
    startTransition(async () => {
      const res = await unlockRecordChallenge(c.id);
      setPendingId(null);
      if (!res.ok) {
        const msg =
          res.error === "not_enough_coins"
            ? t("play.challengeNeedCoins")
            : res.error === "already_unlocked"
              ? t("play.challengeAlready")
              : t("play.challengeUnlockFail");
        toast.error(msg);
        return;
      }
      playSound("upgrade");
      haptic(HAPTIC.goal);
      toast.success(t("play.challengeUnlocked"));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xs font-black text-arena-muted">
        {variant === "lobby"
          ? t("survival.lobbyChallenges")
          : t("play.groupChallenges")}
      </h2>

      <ul className="flex flex-col gap-3">
        {challenges.map((c) => {
          const title = locale === "fa" ? c.titleFa : c.titleEn;
          const busy = pendingId === c.id;
          const expires =
            c.expiresAt != null ? new Date(c.expiresAt) : null;
          const badge = c.rewardBadgeEmoji ?? "🏆";

          return (
            <motion.li
              key={c.id}
              id={`challenge-${c.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="scroll-mt-24"
            >
              <GamePanel
                tone={c.conquered ? "emerald" : "amber"}
                className="p-3.5"
              >
              <div className="relative flex items-center gap-3">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/30 text-4xl shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_3px_0_0_rgba(0,0,0,0.28)]"
                  aria-hidden
                >
                  {badge}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-display text-xl font-extrabold leading-tight text-white">
                      {title}
                    </h3>
                    {c.conquered ? (
                      <GameChip tone="emerald">
                        {t("play.challengeDone")}
                      </GameChip>
                    ) : null}
                    {c.unlocked && !c.conquered ? (
                      <GameChip tone="amber">
                        {t("play.challengeUnlockedBadge")}
                      </GameChip>
                    ) : null}
                    {c.themeKey ? (
                      <GameChip tone="amber">{t("play.themeWeek")}</GameChip>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 font-display text-xs font-bold text-white/70">
                    <GameIconWell
                      size="sm"
                      src="/icons/target.png"
                      className="h-5 w-5"
                      iconClassName="h-3.5 w-3.5"
                    />
                    {toLocaleDigits(c.targetScore, locale)}
                    {c.bestScore > 0
                      ? ` · ${t("play.challengeBest", {
                          n: toLocaleDigits(c.bestScore, locale),
                        })}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="relative mt-3 flex flex-wrap items-center gap-3">
                {expires ? (
                  <MetaStat
                    icon="/icons/timer.png"
                    label={expires.toLocaleDateString(
                      locale === "fa" ? "fa-IR" : "en-GB",
                      { month: "short", day: "numeric" },
                    )}
                    tone="muted"
                  />
                ) : null}
                <MetaStat
                  icon="/icons/energy.png"
                  label={toLocaleDigits(1, locale)}
                />
                <MetaStat
                  icon="/icons/crown.png"
                  label={toLocaleDigits(c.targetScore, locale)}
                  tone="gold"
                  glow
                />
                {!c.unlocked ? (
                  <MetaStat
                    icon="/icons/coin.png"
                    label={toLocaleDigits(c.unlockCostCoins, locale)}
                    tone="gold"
                  />
                ) : (
                  <MetaStat
                    icon="/icons/done.png"
                    label={t("play.challengeUnlockedBadge")}
                    tone={c.conquered ? "mint" : "muted"}
                  />
                )}
              </div>

              <div className="relative mt-3.5">
                {c.unlocked ? (
                  <GameCta
                    variant="accent"
                    block
                    className="text-sm"
                    onClick={() => playChallenge(c)}
                  >
                    {c.conquered
                      ? t("play.challengeReplay")
                      : t("play.challengePlay")}
                  </GameCta>
                ) : (
                  <GameCta
                    variant="accent"
                    block
                    className="text-sm"
                    disabled={busy}
                    onClick={() => unlock(c)}
                  >
                    {busy
                      ? t("play.challengeUnlocking")
                      : t("play.challengeUnlockCta", {
                          n: toLocaleDigits(c.unlockCostCoins, locale),
                        })}
                  </GameCta>
                )}
              </div>
              </GamePanel>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function MetaStat({
  icon,
  label,
  tone = "default",
  glow,
}: {
  icon: string;
  label: string;
  tone?: "default" | "gold" | "mint" | "muted";
  glow?: boolean;
}) {
  const text =
    tone === "gold"
      ? "text-amber-200"
      : tone === "mint"
        ? "text-emerald-200"
        : tone === "muted"
          ? "text-white/60"
          : "text-white";

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1 font-display text-xs font-extrabold tabular-nums ${text}`}
    >
      <Image
        src={icon}
        alt=""
        width={22}
        height={22}
        className={`h-[22px] w-[22px] object-contain drop-shadow-sm ${
          glow ? "drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]" : ""
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}
