import { IsString } from 'class-validator';

/**
 * شروع راندِ بعد. سرور خودش roundIndex بعدی را از روی تعداد راندهای
 * موجود تعیین می‌کند؛ کلاینت فقط کاربر را مشخص می‌کند.
 */
export class NextRoundDto {
  @IsString()
  userId!: string;
}
