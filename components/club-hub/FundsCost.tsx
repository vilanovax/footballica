"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { toLocaleDigits } from "@/lib/i18n/format";

type FundsCostProps = {
  amount: number;
  /** Compact pill (default) vs plain inline. */
  variant?: "pill" | "plain";
  className?: string;
};

/**
 * Club Funds cost — Bank currency only (never coins / gems).
 */
export function FundsCost({
  amount,
  variant = "pill",
  className,
}: FundsCostProps) {
  const { t, locale } = useTranslation();
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/stadium.png"
        alt=""
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 object-contain opacity-90"
      />
      <span className="tabular-nums">{toLocaleDigits(amount, locale)}</span>
      <span className="sr-only">{t("club.biz.funds")}</span>
    </>
  );

  if (variant === "plain") {
    return (
      <span
        dir="ltr"
        title={t("club.biz.funds")}
        className={["inline-flex items-center gap-1", className ?? ""].join(
          " ",
        )}
      >
        {body}
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      title={t("club.biz.funds")}
      className={[
        "inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-0.5 text-sm",
        className ?? "",
      ].join(" ")}
    >
      {body}
    </span>
  );
}
