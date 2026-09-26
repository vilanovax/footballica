import type { BotDifficulty } from "@/generated/prisma/client";
import type { GameConfig } from "@/lib/game/economy";
import { DEFAULT_GAME_CONFIG } from "@/lib/game/economy";

export type { BotDifficulty };

export const BOT_DIFFICULTIES: readonly BotDifficulty[] = [
  "EASY",
  "MEDIUM",
  "HARD",
] as const;

export const BOT_DIFFICULTY_META: Record<
  BotDifficulty,
  { label: string; labelFa: string; hint: string }
> = {
  EASY: {
    label: "Easy",
    labelFa: "آسان",
    hint: "Low accuracy — softer rival",
  },
  MEDIUM: {
    label: "Medium",
    labelFa: "متوسط",
    hint: "Default cold-start band",
  },
  HARD: {
    label: "Hard",
    labelFa: "سخت",
    hint: "High accuracy — tough rival",
  },
};

export function isBotDifficulty(value: string): value is BotDifficulty {
  return (BOT_DIFFICULTIES as readonly string[]).includes(value);
}

/** Probability the bot picks the correct answer, by difficulty band. */
export function botAccuracy(
  difficulty: BotDifficulty | null | undefined,
  botsConfig: GameConfig["bots"] = DEFAULT_GAME_CONFIG.bots,
): number {
  switch (difficulty) {
    case "EASY":
      return botsConfig.accuracyEasy;
    case "HARD":
      return botsConfig.accuracyHard;
    case "MEDIUM":
    default:
      return botsConfig.accuracyMedium;
  }
}

/** Weighted roll for matchmaking bot assignment. */
export function rollMatchmakingDifficulty(
  botsConfig: GameConfig["bots"] = DEFAULT_GAME_CONFIG.bots,
): BotDifficulty {
  const e = Math.max(0, botsConfig.matchmakingWeightEasy);
  const m = Math.max(0, botsConfig.matchmakingWeightMedium);
  const h = Math.max(0, botsConfig.matchmakingWeightHard);
  const total = e + m + h;
  if (total <= 0) return "MEDIUM";
  const roll = Math.random() * total;
  if (roll < e) return "EASY";
  if (roll < e + m) return "MEDIUM";
  return "HARD";
}
