// ============================================================
//  Auth — ورود با شماره (OTP → JWT) و پروفایل. آینهٔ قراردادِ بک‌اند.
// ============================================================

import { api } from './client';

export interface PublicUser {
  id: string;
  phone: string;
  name: string | null;
  avatar: string | null;
  level: number;
  xp: number;
  coins: number;
  lives: number;
}

export interface RequestOtpResult {
  sent: boolean;
  ttl: number;
  devCode?: string; // فقط در محیطِ توسعهٔ بک‌اند
}

export interface VerifyOtpResult {
  token: string;
  user: PublicUser;
}

export function requestOtp(phone: string): Promise<RequestOtpResult> {
  return api.post<RequestOtpResult>('/auth/request-otp', { phone });
}

export function verifyOtp(
  phone: string,
  code: string,
): Promise<VerifyOtpResult> {
  return api.post<VerifyOtpResult>('/auth/verify-otp', { phone, code });
}

export function getMe(): Promise<PublicUser> {
  return api.get<PublicUser>('/auth/me');
}
