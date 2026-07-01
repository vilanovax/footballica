// ============================================================
//  کلاینتِ REST — لایهٔ نازک روی fetch.
//  آدرس پایه از app.json → expo.extra.apiBaseUrl خوانده می‌شود.
// ============================================================

import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const message =
      (data as { message?: string | string[] } | null)?.message ??
      'خطای ناشناخته';
    throw new ApiError(res.status, Array.isArray(message) ? message[0] : message);
  }
  return data as T;
}

export const api = {
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  get: <T>(path: string) => request<T>(path),
};
