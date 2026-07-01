import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  userId!: string;

  /**
   * گزینهٔ انتخابیِ کاربر. اگر زمان تمام شده یا کاربر جواب نداده،
   * می‌تواند null باشد (سرور آن را «دیر/بی‌پاسخ» می‌گیرد).
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  optionId: string | null = null;
}
