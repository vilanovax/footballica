"use client";

interface ProgressBarProps {
  value: number;
  max: number;
  tone?: "money" | "success" | "danger" | "info";
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ProgressBar({
  value,
  max,
  tone = "success",
  className,
  trackClassName,
  fillClassName,
}: ProgressBarProps) {
  const pct =
    max <= 0 ? 0 : Math.max(0, Math.min(100, (Math.max(0, value) / max) * 100));

  return (
    <div className={cx("ui-progress", className)}>
      <div className={cx("ui-progress__track", trackClassName)}>
        <div
          className={cx("ui-progress__fill", `ui-progress__fill--${tone}`, fillClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
