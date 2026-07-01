'use client';

// ============================================================
//  کلاینتِ ادمین — همهٔ درخواست‌ها هدرِ x-admin-key را از localStorage
//  می‌گیرند. کلید فقط سمتِ مرورگر نگه‌داری می‌شود.
// ============================================================

import type {
  AdminQuestion,
  Category,
  NewQuestionInput,
  Overview,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const KEY_STORAGE = 'footballica.adminKey';

export function getAdminKey(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(KEY_STORAGE) ?? '';
}

export function setAdminKey(key: string): void {
  window.localStorage.setItem(KEY_STORAGE, key);
}

export function clearAdminKey(): void {
  window.localStorage.removeItem(KEY_STORAGE);
}

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function req<T>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': getAdminKey(),
    },
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const m = (data as { message?: string | string[] } | null)?.message;
    throw new AdminApiError(
      res.status,
      Array.isArray(m) ? m.join('، ') : (m ?? 'خطای ناشناخته'),
    );
  }
  return data as T;
}

export const adminApi = {
  overview: () => req<Overview>('/admin/overview'),
  listQuestions: (filter?: { approved?: boolean; category?: string }) => {
    const p = new URLSearchParams();
    if (filter?.approved !== undefined) p.set('approved', String(filter.approved));
    if (filter?.category) p.set('category', filter.category);
    const qs = p.toString();
    return req<AdminQuestion[]>(`/admin/questions${qs ? `?${qs}` : ''}`);
  },
  createQuestion: (input: NewQuestionInput) =>
    req<AdminQuestion>('/admin/questions', { method: 'POST', body: input }),
  approve: (id: string) =>
    req<AdminQuestion>(`/admin/questions/${id}/approve`, { method: 'PATCH' }),
  unapprove: (id: string) =>
    req<AdminQuestion>(`/admin/questions/${id}/unapprove`, { method: 'PATCH' }),
  remove: (id: string) =>
    req<{ deleted: boolean }>(`/admin/questions/${id}`, { method: 'DELETE' }),
  categories: () => req<Category[]>('/admin/categories'),
};
