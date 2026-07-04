"use client";

import { Button } from "@/components/ui/Button";
import { GameCard } from "@/components/ui/GameCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ClubBankSheet } from "@/components/ui/ClubBankSheet";
import { UnitCard, LockedUnitRow } from "@/components/ui/UnitCard";
import { UNITS } from "@/lib/units";
import { CLUB } from "@/lib/club";
import { fanIncomeMultiplier } from "@/lib/economy";
import { isUnitUnlocked, unitIncomeSnapshot } from "@/lib/clubEconomy";
import { levelInfo, leagueForXp } from "@/lib/player";
import { vaultCapacity, vaultUpgradeCost, VAULT_MAX, isBank } from "@/lib/vault";
import { useGame } from "@/lib/store";
import { faNum, faShort, faCount, faMoney, faTreasuryShort, faVaultM } from "@/lib/format";

interface ClubProps {
  onBack: () => void;
}

function PromotionBar() {
  const fans = useGame((s) => s.fans);
  const { promotion } = CLUB;
  const pct = Math.min(100, (fans / promotion.need) * 100);
  const remaining = Math.max(0, promotion.need - fans);

  return (
    <GameCard
      variant="hero"
      className="club-season-goal mx-5 mt-6 rounded-3xl px-4 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-left shrink-0">
          <p className="text-lg font-black text-gold-400 tabular-nums">
            {faCount(fans)} / {faCount(promotion.need)}
          </p>
          <p className="text-[10px] font-bold text-white/40">هوادار برای صعود</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[10px] font-bold tracking-wide text-gold-400/75">
            هدف فصل
          </p>
          <p className="mt-1 text-lg font-extrabold text-white">
            صعود به {promotion.target}
          </p>
          <p className="mt-1 text-[11px] text-white/55 leading-5">
            باشگاهت را بساز و هوادار جمع کن تا از این لیگ عبور کنی.
          </p>
        </div>
      </div>
      <ProgressBar
        value={fans}
        max={promotion.need}
        tone="success"
        className="mt-3"
        trackClassName="h-2"
      />
      {remaining > 0 && (
        <p className="mt-2 text-[11px] text-white/42 text-right">
          هنوز {faCount(remaining)} هوادار تا صعود باقی مانده.
        </p>
      )}
    </GameCard>
  );
}

export function Club({ onBack }: ClubProps) {
  const [now, setNow] = useState(() => Date.now());
  const [bankOpen, setBankOpen] = useState(false);
  const [flashCollect, setFlashCollect] = useState(false);
  const [floatAmt, setFloatAmt] = useState<number | null>(null);
  const [shakeUpgrade, setShakeUpgrade] = useState(false);

  const cards = useGame((s) => s.cards);
  const fans = useGame((s) => s.fans);
  const budget = useGame((s) => s.budget);
  const vaultLevel = useGame((s) => s.vaultLevel);
  const units = useGame((s) => s.units);
  const itemLevels = useGame((s) => s.itemLevels);
  const assign = useGame((s) => s.assign);
  const xp = useGame((s) => s.xp);
  const club = useGame((s) => s.club);
  const showVaultTutorial = useGame((s) => s.showVaultTutorial);
  const collectAllUnits = useGame((s) => s.collectAllUnits);
  const upgradeVault = useGame((s) => s.upgradeVault);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  const safeBudget = Number.isFinite(budget) ? budget : 0;
  const snap = unitIncomeSnapshot({
    units,
    itemLevels,
    assign,
    xp,
    fans,
    vaultLevel,
    budget: safeBudget,
    now,
  });

  const bank = isBank(vaultLevel);
  const { level } = levelInfo(xp);
  const league = leagueForXp(xp);
  const fanMult = fanIncomeMultiplier(fans);
  const vaultCap = vaultCapacity(vaultLevel);
  const unlockedUnits = UNITS.filter((u) => isUnitUnlocked(u.id, xp));
  const lockedUnits = UNITS.filter((u) => !isUnitUnlocked(u.id, xp));
  const nextLockedUnit = lockedUnits[0] ?? null;
  const laterLockedUnits = lockedUnits.slice(1);
  const canCollectAll =
    snap.readyCount > 0 && snap.vaultFree > 0 && !bank && snap.totalPending > 0;
  const vaultFull = snap.vaultFull && !bank;
  const upgradeCost = vaultUpgradeCost(vaultLevel);
  const canUpgradeVault = vaultLevel < VAULT_MAX && safeBudget >= upgradeCost;
  const nextLockedNeed = nextLockedUnit ? Math.max(0, nextLockedUnit.requiresLevel - level) : 0;

  const economyAction = canCollectAll
    ? {
        tone: "collect" as const,
        eyebrow: "حرکت بعدی",
        title: `${faTreasuryShort(snap.totalPending)} آماده انتقال به خزانه`,
        detail: "الان جمع‌آوری کن تا پول برای ارتقا و استخدام آزاد شود.",
        cta: "جمع‌آوری",
        onClick: collectAll,
      }
    : vaultFull
      ? {
          tone: "alert" as const,
          eyebrow: "هشدار",
          title: "خزانه پر شده است",
          detail: "خرج کن یا آن را بزرگ‌تر کن تا درآمد جدید هدر نرود.",
          cta: "جزئیات خزانه",
          onClick: () => setBankOpen(true),
        }
      : canUpgradeVault
        ? {
            tone: "upgrade" as const,
            eyebrow: "فرصت ارتقا",
            title: "ارتقای خزانه باز شده",
            detail: "ظرفیت بیشتر یعنی فضای امن‌تر برای جمع‌کردن درآمد واحدها.",
            cta: "ارتقای خزانه",
            onClick: tryUpgradeVault,
          }
        : nextLockedUnit
          ? {
              tone: "build" as const,
              eyebrow: "مسیر ساخت",
              title: `${nextLockedUnit.name} هدف بعدی باشگاه است`,
              detail: `برای باز شدنش ${faNum(nextLockedNeed)} سطح دیگر لازم داری.`,
              cta: "دیدن برنامه ساخت",
              onClick: () =>
                document
                  .getElementById("club-next-build")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            }
          : {
              tone: "calm" as const,
              eyebrow: "پیشروی باشگاه",
              title: "همه‌چیز تحت کنترل است",
              detail: "واحدها را ارتقا بده و برای صعود هوادار بیشتری جمع کن.",
              cta: "جزئیات خزانه",
              onClick: () => setBankOpen(true),
            };

  function collectAll() {
    const got = collectAllUnits();
    if (got > 0) {
      setFloatAmt(got);
      setFlashCollect(true);
      setTimeout(() => setFlashCollect(false), 650);
      setTimeout(() => setFloatAmt(null), 1100);
    }
  }

  function tryUpgradeVault() {
    if (upgradeVault() === "ok") {
      setFlashCollect(true);
      setTimeout(() => setFlashCollect(false), 650);
      return;
    }
    setShakeUpgrade(true);
    setTimeout(() => setShakeUpgrade(false), 400);
    setBankOpen(true);
  }

  return (
    <div className="pitch-stripes min-h-dvh pb-12">
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="glass grid h-10 w-10 place-items-center rounded-2xl text-xl font-bold active:scale-95 transition"
          aria-label="بازگشت"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0 text-right">
          <h1 className="text-lg font-extrabold leading-tight truncate">
            {club.name}
          </h1>
          <p className="text-[11px] font-bold text-gold-400/90">
            سطح {faNum(level)} · {league}
          </p>
        </div>
        <Avatar label={club.crest} color={club.color} size={48} />
      </header>

      <div className="club-economy-panel mx-5 mt-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setBankOpen(true)}
            className="club-bank-icon-btn shrink-0"
            aria-label="جزئیات خزانه"
          >
            {bank ? "🏦" : "🔐"}
          </button>
          <div className="flex flex-wrap justify-end gap-2">
            <div className="club-stat-chip">
              <span className="text-sm font-extrabold">{faShort(fans)}</span>
              <span className="text-[10px] text-white/45">هوادار</span>
            </div>
            <div className="club-stat-chip">
              <span className="text-sm font-extrabold">{faNum(cards)}</span>
              <span className="text-[10px] text-white/45">کارت</span>
            </div>
            {fanMult > 1 && (
              <div className="club-stat-chip text-grass-400">
                <span className="text-xs font-extrabold">
                  ×{fanMult.toFixed(2).replace(".", "٫")}
                </span>
                <span className="text-[10px] text-white/45">ضریب</span>
              </div>
            )}
          </div>
        </div>

        <GameCard
          variant="asset"
          className={`club-next-action-strip club-next-action-strip--${economyAction.tone} mt-4 rounded-2xl p-3.5`}
        >
          <div className="flex items-center gap-3">
            <Button
              onClick={economyAction.onClick}
              variant={
                economyAction.tone === "collect"
                  ? "primary"
                  : economyAction.tone === "upgrade"
                    ? "accent"
                    : "secondary"
              }
              size="sm"
              className="shrink-0 px-3"
            >
              {economyAction.cta}
            </Button>
            <div className="flex-1 min-w-0 text-right">
              <p className="club-next-action-strip__eyebrow">{economyAction.eyebrow}</p>
              <p className="club-next-action-strip__title">{economyAction.title}</p>
              <p className="club-next-action-strip__sub">{economyAction.detail}</p>
            </div>
          </div>
        </GameCard>

        <GameCard
          variant="hero"
          highlight={snap.totalPending > 0}
          className={`club-treasury-hero mt-4 rounded-3xl p-4 ${
            flashCollect ? "flash-green" : ""
          } ${snap.totalPending > 0 ? "club-treasury-hero--ready" : ""} ${
            vaultFull ? "club-treasury-hero--full" : ""
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="club-treasury-hero__safe shrink-0">{bank ? "🏦" : "🔐"}</div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[11px] font-bold text-white/45">خزانهٔ باشگاه</p>
              <p className="mt-1 text-[1.9rem] font-extrabold leading-none text-gold-400 tabular-nums">
                خزانه: {faVaultM(safeBudget)}
                {!bank && <span className="text-white/35"> / {faVaultM(vaultCap)}</span>}
                <span className="mr-2 text-sm text-gold-400/80">میلیون</span>
              </p>
              <p className="mt-2 text-xs text-white/58 leading-5">
                {bank
                  ? `${faTreasuryShort(safeBudget)} پول آمادهٔ خرج در بانک اسپانسر`
                  : vaultFull
                    ? "خزانه پر است — خرج کن یا آن را بزرگ‌تر کن"
                    : safeBudget > 0
                      ? "پول آمادهٔ خرج برای ارتقاها و استخدام مدیر"
                      : "ساختمان‌ها در حال پول‌سازی هستند؛ آماده که شد جمع‌آوری کن."}
              </p>
            </div>
          </div>

          {!bank && (
            <>
              <ProgressBar
                value={safeBudget}
                max={vaultCap}
                tone={vaultFull ? "money" : "success"}
                className="mt-4"
                trackClassName="h-2"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="font-bold text-white/40">
                  {vaultFull ? "ظرفیت کامل" : "در حال پر شدن"}
                </span>
                <span className="font-extrabold text-white/65 tabular-nums">
                  {faVaultM(safeBudget)} از {faVaultM(vaultCap)} میلیون
                </span>
              </div>
            </>
          )}

          <div className="mt-4 rounded-2xl bg-black/16 px-4 py-3 text-right">
            {snap.totalPending > 0 ? (
              <>
                <p className="text-xs font-extrabold text-white/85">
                  🏪 درآمد آمادهٔ جمع‌آوری
                </p>
                <p className="mt-1 text-sm font-bold text-gold-400">
                  {faTreasuryShort(snap.totalPending)}
                  {snap.topReady && (
                    <span className="text-white/45 mr-1">
                      · {snap.topReady.emoji} {snap.topReady.name}
                    </span>
                  )}
                </p>
              </>
            ) : showVaultTutorial ? (
              <p className="text-[11px] text-white/58 leading-6">
                درآمد واحدها را جمع کن تا وارد خزانه شود. از خزانه برای ارتقا خرج
                می‌کنی.
              </p>
            ) : (
              <p className="text-[11px] text-white/50 leading-6">
                ساختمان‌ها آرام‌آرام درآمد می‌سازند. هر وقت آماده شدند، جمع‌آوری کن.
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="relative">
              {floatAmt !== null && (
                <span className="float-up pointer-events-none absolute -top-3 left-1/2 z-10 whitespace-nowrap text-xs font-extrabold text-gold-400">
                  +{faTreasuryShort(floatAmt)}
                </span>
              )}
              <Button
                onClick={canCollectAll ? collectAll : () => setBankOpen(true)}
                variant={canCollectAll ? "primary" : "muted"}
                size="md"
                fullWidth
              >
                {canCollectAll
                  ? `جمع‌آوری ${faTreasuryShort(snap.totalPending)}`
                  : snap.totalPending > 0
                    ? "درآمد آماده در واحدها"
                    : "جزئیات خزانه"}
              </Button>
            </div>
            {!bank ? (
              <Button
                onClick={tryUpgradeVault}
                variant={canUpgradeVault ? "accent" : "muted"}
                size="md"
                fullWidth
                shake={shakeUpgrade}
              >
                {canUpgradeVault
                  ? `ارتقای خزانه · ${faMoney(upgradeCost)}`
                  : "ارتقای خزانه"}
              </Button>
            ) : (
              <Button
                onClick={() => setBankOpen(true)}
                variant="muted"
                size="md"
                fullWidth
              >
                جزئیات بانک
              </Button>
            )}
          </div>
        </GameCard>
      </div>

      <ClubBankSheet
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        unitsPending={snap.totalPending}
      />

      <div className="mt-6">
        <div className="club-section-head px-5 mb-3">
          <span className="club-section-head__eyebrow">
            {faNum(snap.readyCount)} آماده · {faNum(unlockedUnits.length)} فعال
          </span>
          <h2 className="club-section-head__title">
            ساختمان‌های باشگاه
            <span className="mr-2 text-xs font-bold text-grass-400">
              {faNum(unlockedUnits.length)} فعال
            </span>
          </h2>
        </div>
        <div className="space-y-3">
          {unlockedUnits.map((u) => (
            <UnitCard key={u.id} id={u.id} vaultFull={snap.vaultFull && !bank} />
          ))}
        </div>
      </div>

      {nextLockedUnit && (
        <div id="club-next-build" className="mx-5 mt-6">
          <GameCard variant="asset" className="club-next-build-hero rounded-3xl p-4">
            <div className="flex items-start gap-3">
              <div className="club-next-build-hero__icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[1.9rem]">
                {nextLockedUnit.emoji}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <span className="club-next-build-hero__badge">بعدی</span>
                  <h3 className="club-next-build-hero__title">{nextLockedUnit.name}</h3>
                </div>
                <p className="club-next-build-hero__sub">{nextLockedUnit.flavor}</p>
              </div>
            </div>
            <ProgressBar
              value={level}
              max={nextLockedUnit.requiresLevel}
              tone="info"
              className="mt-4"
              trackClassName="h-2"
            />
            <div className="club-next-build-hero__meta">
              <span>سطح {faNum(level)} از {faNum(nextLockedUnit.requiresLevel)}</span>
              <span>{faNum(nextLockedNeed)} سطح تا باز شدن</span>
            </div>
          </GameCard>
        </div>
      )}

      {laterLockedUnits.length > 0 && (
        <div className="mx-5 mt-4 rounded-2xl bg-black/20 px-4 py-3 border border-white/5">
          <p className="club-section-head__eyebrow text-right mb-2">بعد از این</p>
          {laterLockedUnits.map((u) => (
            <LockedUnitRow key={u.id} id={u.id} />
          ))}
        </div>
      )}

      <PromotionBar />
    </div>
  );
}
