export const MODE_THEME_MAP = {
  quick: {
    id: "quick",
    emoji: "⚡",
    from: "var(--color-mode-quick-from)",
    to: "var(--color-mode-quick-to)",
  },
  bomb: {
    id: "bomb",
    emoji: "💣",
    from: "var(--color-mode-bomb-from)",
    to: "var(--color-mode-bomb-to)",
  },
  duel: {
    id: "duel",
    emoji: "⚔️",
    from: "var(--color-mode-duel-from)",
    to: "var(--color-mode-duel-to)",
  },
  penalty: {
    id: "penalty",
    emoji: "🥅",
    from: "var(--color-mode-penalty-from)",
    to: "var(--color-mode-penalty-to)",
  },
  survival: {
    id: "survival",
    emoji: "💪",
    from: "var(--color-mode-survival-from)",
    to: "var(--color-mode-survival-to)",
  },
} as const;

export const CLUB_COLOR_OPTIONS = [
  "var(--color-club-blue)",
  "var(--color-club-red)",
  "var(--color-club-green)",
  "var(--color-club-purple)",
  "var(--color-club-orange)",
  "var(--color-club-ink)",
] as const;

export const RARITY_ORDER = ["معمولی", "حرفه‌ای", "ستاره", "افسانه‌ای"] as const;

export const RARITY_COLOR = {
  معمولی: "var(--color-rarity-common)",
  حرفه‌ای: "var(--color-rarity-pro)",
  ستاره: "var(--color-rarity-star)",
  افسانه‌ای: "var(--color-rarity-legend)",
} as const;

export const RARITY_THEME = {
  معمولی: {
    color: "var(--color-rarity-common)",
    soft: "var(--color-rarity-common-soft)",
    border: "var(--color-rarity-common-border)",
  },
  حرفه‌ای: {
    color: "var(--color-rarity-pro)",
    soft: "var(--color-rarity-pro-soft)",
    border: "var(--color-rarity-pro-border)",
  },
  ستاره: {
    color: "var(--color-rarity-star)",
    soft: "var(--color-rarity-star-soft)",
    border: "var(--color-rarity-star-border)",
  },
  افسانه‌ای: {
    color: "var(--color-rarity-legend)",
    soft: "var(--color-rarity-legend-soft)",
    border: "var(--color-rarity-legend-border)",
  },
} as const;
