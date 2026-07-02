"use client";

import { useState } from "react";
import { useGame } from "@/lib/store";

interface ReportButtonProps {
  questionId: string;
  /** رنگِ آیکون را با پس‌زمینهٔ کارت هماهنگ کن */
  tone?: "onLight" | "onDark";
}

const REASONS = [
  "جوابِ درست اشتباه است",
  "سؤال یا گزینه‌ها مبهم است",
  "غلط املایی/نگارشی",
  "نامناسب یا بی‌ربط",
];

export function ReportButton({ questionId, tone = "onLight" }: ReportButtonProps) {
  const reportQuestion = useGame((s) => s.reportQuestion);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(reason: string) {
    reportQuestion(questionId, reason);
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
    }, 1200);
  }

  const iconColor =
    tone === "onLight" ? "text-pitch-800/40" : "text-white/45";

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="گزارشِ سؤال"
        className={`grid h-7 w-7 place-items-center rounded-lg text-base active:scale-90 transition ${iconColor}`}
      >
        ⚑
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] mx-auto flex max-w-[460px] flex-col justify-end bg-black/60"
          onClick={() => !sent && setOpen(false)}
        >
          <div
            className="animate-rise rounded-t-3xl bg-pitch-800 p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {sent ? (
              <div className="py-8 text-center">
                <div className="text-5xl animate-pop">✓</div>
                <p className="mt-3 font-extrabold text-grass-400">
                  گزارش ثبت شد
                </p>
                <p className="mt-1 text-sm text-white/55">
                  ممنون — بررسی می‌کنیم
                </p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => setOpen(false)}
                    className="text-sm font-bold text-white/50"
                  >
                    انصراف
                  </button>
                  <h3 className="text-lg font-extrabold">مشکلِ این سؤال چیست؟</h3>
                </div>
                <div className="space-y-2.5">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => submit(r)}
                      className="w-full rounded-2xl bg-white/8 px-4 py-3.5 text-right font-bold active:scale-[0.98] transition hover:bg-white/12"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
