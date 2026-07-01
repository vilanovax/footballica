// ============================================================
//  نشستِ کاربر — احراز هویت با شماره (JWT) + فالبکِ مهمان.
//  توکن به‌صورت امن در expo-secure-store نگه‌داری می‌شود.
// ============================================================

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getMe, type PublicUser } from '../api/auth';
import { setToken } from '../api/authToken';

const TOKEN_KEY = 'footballica.token';

function makeGuestId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `guest-${rand}`;
}

type Status = 'loading' | 'anonymous' | 'authed';

interface SessionState {
  status: Status;
  user: PublicUser | null;
  guestId: string;

  /** شناسه‌ای که برای بازی استفاده می‌شود (کاربرِ واقعی یا مهمان). */
  userId: string;
  displayName: string;

  hydrate: () => Promise<void>;
  setAuth: (token: string, user: PublicUser) => Promise<void>;
  logout: () => Promise<void>;
}

function nameOf(user: PublicUser | null, fallback = 'مهمان'): string {
  if (!user) return fallback;
  return user.name?.trim() || user.phone;
}

export const useSession = create<SessionState>((set, get) => {
  const guestId = makeGuestId();

  return {
    status: 'loading',
    user: null,
    guestId,
    userId: guestId,
    displayName: 'مهمان',

    // در استارتِ اپ صدا زده می‌شود: اگر توکنِ ذخیره‌شده معتبر بود، وارد شو.
    async hydrate() {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!saved) {
          set({ status: 'anonymous' });
          return;
        }
        setToken(saved);
        const user = await getMe();
        set({
          status: 'authed',
          user,
          userId: user.id,
          displayName: nameOf(user),
        });
      } catch {
        // توکنِ نامعتبر/منقضی → پاک کن
        setToken(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
        set({ status: 'anonymous', user: null, userId: get().guestId });
      }
    },

    async setAuth(token, user) {
      setToken(token);
      await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => undefined);
      set({
        status: 'authed',
        user,
        userId: user.id,
        displayName: nameOf(user),
      });
    },

    async logout() {
      setToken(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
      set({
        status: 'anonymous',
        user: null,
        userId: get().guestId,
        displayName: 'مهمان',
      });
    },
  };
});
