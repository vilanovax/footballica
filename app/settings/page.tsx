"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSound } from "@/lib/audio/useSound";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { logout } from "@/actions/auth";
import { haptic, HAPTIC } from "@/lib/audio/haptics";
import { PushOptIn } from "@/components/pwa/PushOptIn";
import { TelegramOptIn } from "@/components/pwa/TelegramOptIn";
import { GameChip } from "@/components/ui/game/GameChip";
import { GameCta } from "@/components/ui/game/GameCta";
import { GameIconWell } from "@/components/ui/game/GameIconWell";
import { GamePanel } from "@/components/ui/game/GamePanel";
import { GameTile } from "@/components/ui/game/GameTile";
import { cn } from "@/lib/utils";

type Theme = "day" | "dark";

function getTheme(): Theme {
  if (typeof document === "undefined") return "day";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "day";
}

const LOCALE_LABEL: Record<Locale, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  fa: { native: "فارسی", flag: "🇮🇷" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.04 * i,
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 font-display text-[11px] font-black uppercase tracking-widest text-arena-muted">
      {children}
    </h2>
  );
}

function SettingHead({
  iconSrc,
  title,
  desc,
}: {
  iconSrc: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <GameIconWell size="md" src={iconSrc} />
      <div className="min-w-0 pt-0.5">
        <p className="font-display text-base font-black text-white drop-shadow-sm">
          {title}
        </p>
        <p className="mt-0.5 font-display text-[11px] font-bold leading-snug text-white/60">
          {desc}
        </p>
      </div>
    </div>
  );
}

function OptionTile({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="min-h-touch text-start"
    >
      <GameTile
        tone={selected ? "amber" : "default"}
        className="relative flex h-full min-h-14 items-center gap-2.5 px-3 py-2.5"
      >
        <span className="text-xl leading-none" aria-hidden>
          {icon}
        </span>
        <span
          className={cn(
            "flex-1 font-display text-sm font-black",
            selected ? "text-white" : "text-white/70",
          )}
        >
          {label}
        </span>
        {selected && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 24 }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/35"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/done.png"
              alt=""
              draggable={false}
              className="h-3.5 w-3.5 object-contain"
            />
          </motion.span>
        )}
      </GameTile>
    </button>
  );
}

function SoundSwitch({
  on,
  onToggle,
  title,
  desc,
  onLabel,
  offLabel,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  desc: string;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="w-full text-start"
    >
      <GameTile
        tone={on ? "amber" : "default"}
        className="flex min-h-14 items-center gap-3 px-3 py-2.5"
      >
        <GameIconWell size="sm" src="/icons/energy.png" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-black text-white">{title}</p>
          <p className="mt-0.5 font-display text-[11px] font-bold text-white/55">
            {desc}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <GameChip tone={on ? "amber" : "default"} className="uppercase">
            {on ? onLabel : offLabel}
          </GameChip>
          <span
            className={cn(
              "relative flex h-8 w-14 items-center rounded-full px-0.5 transition-colors",
              on ? "justify-end bg-accent" : "justify-start bg-black/40",
            )}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
              className="h-7 w-7 rounded-full bg-white shadow"
            />
          </span>
        </div>
      </GameTile>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("day");
  const { isMuted, toggleMute, play } = useSound();
  const { t, locale, setLocale } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loggingOut, startLogout] = useTransition();

  useEffect(() => {
    setTheme(getTheme());
    setMounted(true);
  }, []);

  function handleLogout() {
    if (loggingOut) return;
    startLogout(async () => {
      play("click");
      haptic(HAPTIC.light);
      await logout();
      router.replace("/login");
      router.refresh();
    });
  }

  function handleToggleMute() {
    const willUnmute = isMuted;
    toggleMute();
    haptic(HAPTIC.light);
    if (willUnmute) play("click");
  }

  function handleSetLocale(next: Locale) {
    if (next !== locale) {
      play("click");
      haptic(HAPTIC.tap);
    }
    setLocale(next);
    router.refresh();
  }

  const soundOn = mounted ? !isMuted : true;

  function applyTheme(next: Theme) {
    if (next !== theme) {
      play("click");
      haptic(HAPTIC.tap);
    }
    setTheme(next);
    try {
      localStorage.setItem("footballica:theme", next);
    } catch {
      /* ignore quota / private mode */
    }
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-3.5 pb-6">
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <GamePanel tone="emerald" pinstripe className="relative overflow-hidden px-4 py-3.5">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-e-10 -top-6 h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl"
          />
          <div className="relative flex items-center gap-3">
            <GameIconWell size="lg" amber src="/icons/hub-settings.png" />
            <div className="min-w-0">
              <p className="font-display text-[10px] font-black uppercase tracking-widest text-emerald-200/80">
                {t("settings.eyebrow")}
              </p>
              <h1 className="mt-0.5 font-display text-2xl font-black text-white drop-shadow-sm">
                {t("settings.title")}
              </h1>
            </div>
          </div>
        </GamePanel>
      </motion.div>

      {/* Match feel — language, lights, sound */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="hub-deck flex flex-col gap-2.5"
      >
        <SectionLabel>{t("settings.groupFeel")}</SectionLabel>

        <GamePanel tone="emerald" className="p-3.5">
          <SettingHead
            iconSrc="/icons/hub-settings.png"
            title={t("settings.language")}
            desc={t("settings.languageDesc")}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {LOCALES.map((code) => (
              <OptionTile
                key={code}
                selected={locale === code}
                onClick={() => handleSetLocale(code)}
                icon={LOCALE_LABEL[code].flag}
                label={LOCALE_LABEL[code].native}
              />
            ))}
          </div>
        </GamePanel>

        <GamePanel tone="amber" className="p-3.5">
          <SettingHead
            iconSrc="/icons/stadium.png"
            title={t("settings.theme")}
            desc={t("settings.themeDesc")}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <OptionTile
              selected={theme === "day"}
              onClick={() => applyTheme("day")}
              icon="☀️"
              label={t("settings.day")}
            />
            <OptionTile
              selected={theme === "dark"}
              onClick={() => applyTheme("dark")}
              icon="🌙"
              label={t("settings.night")}
            />
          </div>
        </GamePanel>

        <SoundSwitch
          on={soundOn}
          onToggle={handleToggleMute}
          title={t("settings.sound")}
          desc={t("settings.soundDesc")}
          onLabel={t("settings.on")}
          offLabel={t("settings.off")}
        />
      </motion.div>

      {/* Alerts — push + telegram */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="hub-deck flex flex-col gap-2.5"
      >
        <SectionLabel>{t("settings.groupAlerts")}</SectionLabel>

        <GamePanel tone="sky" className="p-3.5">
          <SettingHead
            iconSrc="/icons/hub-news.png"
            title={t("settings.push")}
            desc={t("settings.pushDesc")}
          />
          <PushOptIn />
        </GamePanel>

        <GamePanel tone="sky" className="p-3.5">
          <SettingHead
            iconSrc="/icons/fans.png"
            title={t("settings.telegram")}
            desc={t("settings.telegramDesc")}
          />
          <TelegramOptIn />
        </GamePanel>
      </motion.div>

      {/* Account */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <GamePanel tone="rose" className="p-3.5">
          <SettingHead
            iconSrc="/icons/close-arena.png"
            title={t("settings.account")}
            desc={t("settings.accountDesc")}
          />
          <GameCta
            variant="danger"
            block
            disabled={loggingOut}
            onClick={handleLogout}
            className="mt-3"
          >
            {loggingOut ? t("settings.loggingOut") : t("settings.logout")}
          </GameCta>
        </GamePanel>
      </motion.div>

      <footer className="pt-1 text-center">
        <p className="font-display text-base font-black tracking-wide text-arena-fg/90">
          Footballica
        </p>
        <p className="mt-0.5 font-display text-[11px] font-bold text-arena-muted">
          {t("settings.tagline")}
        </p>
        <p className="mt-1 font-display text-[10px] font-bold tabular-nums text-arena-muted/70">
          v0.1.0
        </p>
      </footer>
    </section>
  );
}
