// ============================================================
//  تعریفِ اچیومنت‌ها — در کد (نه DB) تا نسخه‌بندی و بازبینی ساده باشد.
//  «باز شدن»ِ هرکدام در جدولِ user_achievements ثبت می‌شود.
// ============================================================

export type Metric =
  | 'totalCorrect' // مجموعِ پاسخ‌های درست (تک‌نفره + دوئل)
  | 'duelsPlayed'
  | 'duelWins'
  | 'bestStreak';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  metric: Metric;
  threshold: number;
  reward: { cards?: number; coins?: number };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'first_win',
    title: 'اولین برد',
    description: 'اولین دوئلت را ببر',
    icon: '🥇',
    metric: 'duelWins',
    threshold: 1,
    reward: { cards: 1 },
  },
  {
    key: 'correct_50',
    title: '۵۰ گلِ درست',
    description: '۵۰ پاسخِ درست بده',
    icon: '⚽',
    metric: 'totalCorrect',
    threshold: 50,
    reward: { cards: 1, coins: 50 },
  },
  {
    key: 'correct_100',
    title: 'صدتایی',
    description: '۱۰۰ پاسخِ درست بده',
    icon: '💯',
    metric: 'totalCorrect',
    threshold: 100,
    reward: { cards: 2, coins: 100 },
  },
  {
    key: 'duel_10',
    title: 'دوئل‌باز',
    description: '۱۰ دوئل بازی کن',
    icon: '⚔️',
    metric: 'duelsPlayed',
    threshold: 10,
    reward: { cards: 1 },
  },
  {
    key: 'streak_7',
    title: 'هفتهٔ کامل',
    description: 'استریکِ ۷ روزه بگیر',
    icon: '🔥',
    metric: 'bestStreak',
    threshold: 7,
    reward: { cards: 2 },
  },
];
