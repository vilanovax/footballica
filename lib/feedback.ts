import { useGame } from "./store";

export type FeedbackSound = "correct" | "wrong" | "win" | "tap" | "reward";

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.07,
  startDelay = 0,
) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const start = ctx.currentTime + startDelay;

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playSequence(
  notes: { freq: number; duration: number; type?: OscillatorType; gain?: number }[],
) {
  let delay = 0;
  for (const note of notes) {
    playTone(note.freq, note.duration, note.type ?? "sine", note.gain ?? 0.07, delay);
    delay += note.duration * 0.85;
  }
}

/** لرزش کوتاه — فقط وقتی تنظیمات فعال باشد */
export function playHaptic(pattern: number | number[] = 12) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (!useGame.getState().hapticEnabled) return;
  navigator.vibrate(pattern);
}

export function playSound(id: FeedbackSound) {
  if (!useGame.getState().soundEnabled) return;

  switch (id) {
    case "correct":
      playSequence([
        { freq: 523, duration: 0.08 },
        { freq: 659, duration: 0.1, gain: 0.06 },
      ]);
      break;
    case "wrong":
      playTone(180, 0.14, "square", 0.045);
      break;
    case "win":
      playSequence([
        { freq: 523, duration: 0.09 },
        { freq: 659, duration: 0.09 },
        { freq: 784, duration: 0.14, gain: 0.08 },
      ]);
      break;
    case "reward":
      playSequence([
        { freq: 440, duration: 0.07 },
        { freq: 554, duration: 0.07 },
        { freq: 659, duration: 0.12, gain: 0.075 },
      ]);
      break;
    case "tap":
      playTone(880, 0.04, "triangle", 0.035);
      break;
  }
}

export function feedbackCorrect() {
  playSound("correct");
  playHaptic(10);
}

export function feedbackWrong() {
  playSound("wrong");
  playHaptic([18, 40, 18]);
}

export function feedbackWin() {
  playSound("win");
  playHaptic([12, 45, 12, 45, 18]);
}

export function feedbackLoss() {
  playSound("wrong");
  playHaptic([24, 60, 24]);
}

export function feedbackReward() {
  playSound("reward");
  playHaptic([10, 35, 10]);
}

export function feedbackTap() {
  playSound("tap");
  playHaptic(6);
}
