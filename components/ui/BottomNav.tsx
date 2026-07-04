"use client";

import { useGame } from "@/lib/store";
import type { Tab } from "@/lib/types";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "خانه" },
  { id: "games", icon: "⚔️", label: "بازی‌ها" },
  { id: "leaderboard", icon: "🏆", label: "رده‌بندی" },
  { id: "shop", icon: "🛍️", label: "فروشگاه" },
  { id: "profile", icon: "👤", label: "پروفایل" },
];

interface BottomNavItem {
  id: Tab;
  icon: string;
  label: string;
  destination: Tab | "club";
  emphasis: boolean;
}

interface BottomNavProps {
  active: Tab | "club";
  onNavigate: (tab: Tab) => void;
  onOpenClub?: () => void;
}

export function BottomNav({ active, onNavigate, onOpenClub }: BottomNavProps) {
  const playerFocus = useGame((s) => s.playerFocus);

  const tabs: BottomNavItem[] = TABS.map((tab) => {
    if (playerFocus === "club" && tab.id === "profile") {
      return {
        ...tab,
        icon: "🏟️",
        label: "باشگاه",
        destination: "club" as const,
        emphasis: true,
      };
    }
    if (playerFocus === "club" && tab.id === "shop") {
      return {
        ...tab,
        destination: tab.id,
        emphasis: true,
      };
    }
    return {
      ...tab,
      destination: tab.id,
      emphasis: false,
    };
  });

  return (
    <nav className="bottom-nav">
      {tabs.map((t) => {
        const isActive =
          active === t.id || (t.destination === "club" && active === "club");
        return (
          <button
            key={t.id}
            data-active={isActive}
            data-emphasis={t.emphasis ? "true" : undefined}
            onClick={() =>
              t.destination === "club" ? onOpenClub?.() : onNavigate(t.destination)
            }
            className="bottom-nav-item"
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
