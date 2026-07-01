// ============================================================
//  نگه‌دارندهٔ توکن در حافظه — تا client بتواند بدونِ وابستگیِ حلقه‌ای
//  به store، هدرِ Authorization را ضمیمه کند.
// ============================================================

let token: string | null = null;

export function getToken(): string | null {
  return token;
}

export function setToken(value: string | null): void {
  token = value;
}
