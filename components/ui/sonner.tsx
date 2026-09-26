"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/lib/utils";

type AppToasterProps = ToasterProps & {
  /** `admin` = light CMS; `arena` = dark player pitch */
  tone?: "admin" | "arena";
};

/**
 * Toast host — admin stays light; player arena uses pitch chrome + display type.
 */
export function Toaster({
  tone = "admin",
  className,
  toastOptions,
  ...props
}: AppToasterProps) {
  if (tone === "arena") {
    const arenaClasses = toastOptions?.classNames;
    return (
      <Sonner
        theme="dark"
        className={cn("toaster toaster-arena group", className)}
        position="top-center"
        closeButton
        dir="auto"
        gap={10}
        offset={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        mobileOffset={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        toastOptions={{
          duration: 6_000,
          ...toastOptions,
          classNames: {
            toast: cn(
              "group toast-arena !flex !items-center !gap-3 !rounded-2xl !border-0",
              // Font comes from toaster CSS (Fredoka LTR / Vazirmatn RTL) — don't force Fredoka.
              "!bg-[hsl(var(--arena-mid))] !text-white",
              "!shadow-[0_0_0_1px_hsl(var(--arena-ring-amber)/0.45),0_6px_0_0_rgba(0,0,0,0.4)]",
              "!px-3.5 !py-3 !min-h-14",
              arenaClasses?.toast,
            ),
            title: cn(
              "!text-[15px] !font-extrabold !leading-snug !text-white",
              arenaClasses?.title,
            ),
            description: cn(
              "!text-xs !font-bold !leading-snug !text-white/70",
              arenaClasses?.description,
            ),
            content: cn("!flex-1 !min-w-0", arenaClasses?.content),
            actionButton: cn(
              "!shrink-0 !rounded-xl !h-auto !min-h-10 !px-3 !py-2",
              "!bg-[hsl(var(--accent))] !text-[hsl(var(--accent-foreground))]",
              "!text-[12px] !font-extrabold !leading-none",
              "!shadow-[0_3px_0_0_hsl(var(--accent-deep))]",
              "active:!translate-y-px active:!shadow-[0_2px_0_0_hsl(var(--accent-deep))]",
              arenaClasses?.actionButton,
            ),
            closeButton: cn(
              "!border-white/20 !bg-black/45 !text-white/85",
              "hover:!bg-black/60 hover:!text-white",
              arenaClasses?.closeButton,
            ),
            success: arenaClasses?.success,
            error: arenaClasses?.error,
            info: arenaClasses?.info,
            warning: arenaClasses?.warning,
            loading: arenaClasses?.loading,
            default: arenaClasses?.default,
            icon: arenaClasses?.icon,
            loader: arenaClasses?.loader,
            cancelButton: arenaClasses?.cancelButton,
          },
        }}
        {...props}
      />
    );
  }

  return (
    <Sonner
      theme="light"
      className={cn("toaster group", className)}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={toastOptions}
      {...props}
    />
  );
}
