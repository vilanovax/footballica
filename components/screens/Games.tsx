"use client";

import { GameCard } from "@/components/ui/GameCard";
import { OngoingRow, ONGOING_GAMES } from "@/components/ui/OngoingRow";
import { MODE_THEME_MAP } from "@/lib/designSystem";
import { faNum } from "@/lib/format";

interface GamesProps {
  onPlayQuick: () => void;
  onPlayBomb: () => void;
  onPlayDuel: () => void;
  onPlayPenalty: () => void;
  onPlaySurvival: () => void;
}

export function Games({
  onPlayQuick,
  onPlayBomb,
  onPlayDuel,
  onPlayPenalty,
  onPlaySurvival,
}: GamesProps) {
  const yourTurns = ONGOING_GAMES.filter((g) => g.statusGold).length;
  const modeCards: Array<{
    id: string;
    title: string;
    detail: string;
    badge: string;
    featured?: boolean;
    theme: (typeof MODE_THEME_MAP)[keyof typeof MODE_THEME_MAP];
    onClick: () => void;
  }> = [
    {
      id: "quick",
      title: "بازی سریع",
      detail: "بدون جان · شروع فوری",
      badge: "بهترین warm-up",
      featured: true,
      theme: MODE_THEME_MAP.quick,
      onClick: onPlayQuick,
    },
    {
      id: "duel",
      title: "دوئل",
      detail: "رقابت مستقیم با حریف",
      badge: "XP بیشتر",
      theme: MODE_THEME_MAP.duel,
      onClick: onPlayDuel,
    },
    {
      id: "bomb",
      title: "بمب",
      detail: "پرریسک، پرپاداش",
      badge: "سرعتی",
      theme: MODE_THEME_MAP.bomb,
      onClick: onPlayBomb,
    },
    {
      id: "survival",
      title: "بقا",
      detail: "تا جایی که می‌توانی ادامه بده",
      badge: "رکوردی",
      theme: MODE_THEME_MAP.survival,
      onClick: onPlaySurvival,
    },
    {
      id: "penalty",
      title: "پنالتی",
      detail: "پنج ضربه، بدون مصرف جان",
      badge: "کم‌فشار",
      theme: MODE_THEME_MAP.penalty,
      onClick: onPlayPenalty,
    },
  ] as const;

  return (
    <div className="games-screen pitch-stripes min-h-dvh pb-32" dir="rtl">
      <header className="px-5 pt-6 text-right">
        <h1 className="text-2xl font-extrabold">بازی‌ها</h1>
        <p className="mt-1 text-sm text-white/50">
          mode مناسب را انتخاب کن و از همین‌جا امتیاز فصلت را بالا ببر.
        </p>
      </header>

      <GameCard variant="hero" className="games-hero mx-5 mt-5 rounded-3xl p-4">
        <div className="games-hero__glow" aria-hidden />
        <div className="games-hero__copy">
          <p className="games-hero__eyebrow">اتاق بازی</p>
          <h2 className="games-hero__title">الان وقت امتیاز گرفتن است</h2>
          <p className="games-hero__sub">
            از بازی سریع برای گرم‌شدن شروع کن، یا برو سراغ دوئل‌هایی که منتظر تصمیم تو هستند.
          </p>
        </div>
        <div className="games-hero__stats">
          <span className="games-hero__pill">{faNum(modeCards.length)} حالت بازی</span>
          <span className="games-hero__pill games-hero__pill--accent">
            {faNum(yourTurns)} نوبتِ تو
          </span>
        </div>
      </GameCard>

      <section className="px-5 mt-5">
        <div className="games-section__head">
          <div className="games-section__copy">
            <h3 className="games-section__title">انتخاب حالت</h3>
            <p className="games-section__sub">هر mode لحن و پاداش خودش را دارد.</p>
          </div>
        </div>
        <div className="games-mode-grid">
          {modeCards.map((mode) => (
            <GameCard
              key={mode.id}
              as="button"
              onClick={mode.onClick}
              variant={mode.featured ? "hero" : "asset"}
              className={`games-mode-card ${mode.featured ? "games-mode-card--featured" : ""}`}
              style={{
                background: `linear-gradient(155deg, ${mode.theme.from}, ${mode.theme.to})`,
              }}
            >
              <div className="games-mode-card__content">
                <span className="games-mode-card__icon" aria-hidden>
                  {mode.theme.emoji}
                </span>
                <div className="games-mode-card__copy">
                  <p className="games-mode-card__badge">{mode.badge}</p>
                  <h4 className="games-mode-card__title">{mode.title}</h4>
                  <p className="games-mode-card__detail">{mode.detail}</p>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      </section>

      <section className="px-5 mt-7">
        <div className="games-section__head">
          <span className="games-section__count">{faNum(yourTurns)} نوبتِ تو</span>
          <div className="games-section__copy">
            <h3 className="games-section__title">در جریان</h3>
            <p className="games-section__sub">حریف‌ها منتظر حرکت بعدی تو هستند.</p>
          </div>
        </div>
        <div className="mt-3 space-y-2.5">
          {ONGOING_GAMES.map((g) => (
            <OngoingRow key={g.name} {...g} />
          ))}
        </div>
      </section>
    </div>
  );
}
