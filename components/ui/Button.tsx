"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "muted" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  shake?: boolean;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  variant = "secondary",
  size = "md",
  fullWidth = false,
  shake = false,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(
        "ui-btn",
        `ui-btn--${disabled ? "disabled" : variant}`,
        `ui-btn--${size}`,
        fullWidth && "ui-btn--full",
        shake && "animate-shake",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
