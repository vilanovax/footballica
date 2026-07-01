// ============================================================
//  نشستِ کاربر — تا فاز ۱ (Auth) یک هویتِ مهمانِ پایدار نگه می‌داریم.
//  بک‌اند اگر این userId را نشناسد، کاربرِ مهمان می‌سازد (ensureUser).
// ============================================================

import { create } from 'zustand';

function makeGuestId(): string {
  // شناسهٔ شبه‌یکتا برای مهمان (بدون وابستگی خارجی)
  const rand = Math.random().toString(36).slice(2, 10);
  return `guest-${rand}`;
}

interface SessionState {
  userId: string;
  displayName: string;
}

export const useSession = create<SessionState>(() => ({
  userId: makeGuestId(),
  displayName: 'مهمان',
}));
