"use client";

import type { CSSProperties, ReactNode } from "react";

type GameCardVariant = "hero" | "asset" | "locked";

interface GameCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: GameCardVariant;
  as?: "div" | "button";
  disabled?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function GameCard({
  children,
  className,
  style,
  variant = "asset",
  as = "div",
  disabled = false,
  highlight = false,
  onClick,
}: GameCardProps) {
  const sharedClassName = cx(
    "ui-game-card",
    `ui-game-card--${variant}`,
    (as === "button" || onClick) && "ui-game-card--interactive",
    disabled && "ui-game-card--disabled",
    highlight && "ui-game-card--highlight",
    className,
  );

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={sharedClassName}
        style={style}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={sharedClassName} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
