"use client";

import type { ReactNode } from "react";

interface BottomSheetProps {
  open?: boolean;
  onClose: () => void;
  children: ReactNode;
  backdropClassName?: string;
  panelClassName?: string;
  dir?: "rtl" | "ltr";
}

interface BottomSheetSectionProps {
  children?: ReactNode;
  className?: string;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function BottomSheet({
  open = true,
  onClose,
  children,
  backdropClassName,
  panelClassName,
  dir = "rtl",
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="ui-sheet" role="dialog" aria-modal="true">
      <button
        type="button"
        className={cx("ui-sheet__backdrop", backdropClassName)}
        onClick={onClose}
        aria-label="بستن"
      />
      <div
        className={cx("ui-sheet__panel", panelClassName)}
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {children}
      </div>
    </div>
  );
}

export function BottomSheetHandle({ className }: BottomSheetSectionProps) {
  return <div className={cx("ui-sheet__handle", className)} aria-hidden />;
}

export function BottomSheetHeader({ children, className }: BottomSheetSectionProps) {
  return <div className={cx("ui-sheet__header", className)}>{children}</div>;
}
