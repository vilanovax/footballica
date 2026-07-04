/**
 * پارامترهای اقتصادِ بازی — تنها منبعِ حقیقت برای بالانس (Economy v2).
 */
export const ECONOMY = {
  lives: { max: 5, regenMinutes: 20, refillCost: 50 },
  fans: { duelWin: 100 },
  upgrade: { costMultiplier: 1.6 },
  promotion: { fansNeeded: [1000, 3000, 8000, 20000] },
  /** حداکثر ساعاتِ درآمدِ آفلاین */
  offlineCapHours: 8,
} as const;

/** سقفِ ثانیه برای محاسبهٔ درآمدِ idle (جلوگیری از inflation بعد از غیبت طولانی) */
export function offlineCapSeconds(): number {
  return ECONOMY.offlineCapHours * 3600;
}

/** ضریبِ درآمدِ واحدهای تجاری بر اساس هوادار */
export function fanIncomeMultiplier(fans: number): number {
  if (fans >= 100_000) return 1.4;
  if (fans >= 20_000) return 1.25;
  if (fans >= 5_000) return 1.12;
  if (fans >= 1_000) return 1.05;
  return 1.0;
}

export interface ActivityReward {
  xp: number;
  fans: number;
  vaultMoney: number;
  cards: number;
}

/** باخت/برد کوییز سریع */
export function rewardQuickQuiz(
  won: boolean,
  correctCount: number,
): ActivityReward {
  if (!won) {
    return {
      xp: Math.min(40, 20 + correctCount * 4),
      fans: 0,
      vaultMoney: 0,
      cards: 0,
    };
  }
  return {
    xp: Math.min(80, 60 + correctCount * 4),
    fans: Math.min(20, 10 + correctCount * 2),
    vaultMoney: 400_000,
    cards: Math.random() < 0.1 ? 1 : 0,
  };
}

/** باخت/برد دوئل دوستانه */
export function rewardFriendlyDuel(
  won: boolean,
  correctCount: number,
): ActivityReward {
  if (!won) {
    return {
      xp: Math.min(40, 20 + correctCount * 4),
      fans: 0,
      vaultMoney: 0,
      cards: 0,
    };
  }
  return {
    xp: Math.min(120, 80 + correctCount * 8),
    fans: ECONOMY.fans.duelWin,
    vaultMoney: 1_000_000,
    cards: Math.random() < 0.25 ? 1 : 0,
  };
}

/** @deprecated از rewardFriendlyDuel استفاده کن */
export function rewardDuel(won: boolean, correctCount: number): ActivityReward {
  return rewardFriendlyDuel(won, correctCount);
}

/** تغییر رتبه Arena در دوئل رنکد — بدون پاداش اقتصادی باشگاه */
export function rankedDuelArenaDelta(
  won: boolean,
  correctCount: number,
  youScore: number,
  foeScore: number,
): number {
  const margin = Math.max(0, youScore - foeScore);
  if (won) {
    return 24 + correctCount * 4 + Math.min(12, Math.floor(margin / 20));
  }
  return -16 + correctCount * 2;
}

/** پنالتی — پاداشِ کامل فقط با ۵/۵ */
export function rewardPenalty(goals: number, kicks = 5): ActivityReward {
  if (goals >= kicks) {
    return { xp: 70, fans: 15, vaultMoney: 300_000, cards: 1 };
  }
  return {
    xp: goals * 10 + 10,
    fans: 0,
    vaultMoney: 0,
    cards: 0,
  };
}

/** حالت بمب — بستهٔ کامل با حداقل ۵ جواب */
export function rewardBomb(score: number): ActivityReward {
  if (score >= 5) {
    return { xp: 60, fans: 10, vaultMoney: 200_000, cards: 1 };
  }
  return { xp: score * 4, fans: 0, vaultMoney: 0, cards: 0 };
}

/** بقا — فقط XP */
export function rewardSurvival(score: number): ActivityReward {
  return { xp: score * 5, fans: 0, vaultMoney: 0, cards: 0 };
}

// امتیازدهیِ کوییز: سریع و درست = امتیازِ بیشتر (پاداشِ سرعت)
export const SCORING = {
  timePerQuestion: 10,
  basePoints: 60,
  speedBonusMax: 40,
} as const;

export function scoreAnswer(correct: boolean, secondsLeft: number): number {
  if (!correct) return 0;
  const ratio = Math.max(0, secondsLeft) / SCORING.timePerQuestion;
  return Math.round(SCORING.basePoints + SCORING.speedBonusMax * ratio);
}
