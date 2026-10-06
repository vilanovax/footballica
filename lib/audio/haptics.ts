/**
 * Safe haptic feedback. iOS Safari/WebViews don't implement the Vibration API,
 * so we feature-detect and swallow errors — callers never need to guard.
 *
 * Chrome also blocks vibrate until the document has had a user gesture
 * (https://chromestatus.com/feature/5644273861001216). We gate on that so
 * background polls / toasts never trip the Intervention console spam.
 */

let gestureUnlocked = false;

function ensureGestureListeners() {
  if (typeof window === "undefined" || gestureUnlocked) return;
  const unlock = () => {
    gestureUnlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true, passive: true });
}

ensureGestureListeners();

function canVibrate(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("vibrate" in navigator)) return false;
  // Chromium User Activation API — sticky after first tap/key.
  const activation = (
    navigator as Navigator & {
      userActivation?: { hasBeenActive: boolean };
    }
  ).userActivation;
  if (activation) return activation.hasBeenActive;
  return gestureUnlocked;
}

export function haptic(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* vibration unsupported / blocked — ignore */
  }
}

// Shared feel constants so every trigger stays consistent across the app.
export const HAPTIC = {
  light: 30,
  tap: 40,
  goal: 50,
  miss: [100, 50, 100] as number[],
} as const;
