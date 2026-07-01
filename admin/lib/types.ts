export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface QuestionStats {
  answered: number;
  correct: number;
  correctRate: number | null;
}

export interface AdminQuestion {
  id: string;
  text: string;
  difficulty: Difficulty;
  isApproved: boolean;
  category: Category | null;
  options: QuestionOption[];
  metadata: Record<string, unknown>;
  createdAt: string;
  stats?: QuestionStats;
}

export interface Overview {
  questions: { total: number; approved: number; pending: number };
  categories: number;
  answers: number;
}

export interface NewQuestionInput {
  text: string;
  difficulty: Difficulty;
  categorySlug?: string;
  options: { text: string; isCorrect: boolean }[];
}

export const DIFF_FA: Record<Difficulty, string> = {
  EASY: 'آسان',
  MEDIUM: 'متوسط',
  HARD: 'سخت',
};
