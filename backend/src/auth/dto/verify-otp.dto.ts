import { Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @Matches(/^09\d{9}$/, { message: 'شمارهٔ موبایل معتبر نیست (۰۹xxxxxxxxx)' })
  phone!: string;

  @Length(6, 6, { message: 'کدِ تأیید باید ۶ رقم باشد' })
  @Matches(/^\d{6}$/, { message: 'کدِ تأیید باید عددی باشد' })
  code!: string;
}
