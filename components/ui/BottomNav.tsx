"use client";

import type { Tab } from "@/lib/types";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "home", icon: "🏠", label: "خانه" },
  { id: "games", icon: "⚔️", label: "بازی‌ها" },
  { id: "leaderboard", icon: "🏆", label: "رده‌بندی" },
  { id: "shop", icon: "🛍️", label: "فروشگاه" },
  { id: "profile", icon: "👤", label: "پروفایل" },
];

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          data-active={active === t.id}
          onClick={() => onNavigate(t.id)}
          className="bottom-nav-item"
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
