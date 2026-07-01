import { Matches } from 'class-validator';

export class RequestOtpDto {
  // موبایلِ ایران: 09xxxxxxxxx
  @Matches(/^09\d{9}$/, { message: 'شمارهٔ موبایل معتبر نیست (۰۹xxxxxxxxx)' })
  phone!: string;
}
