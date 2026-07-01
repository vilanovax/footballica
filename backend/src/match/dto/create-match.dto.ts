import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * فقط مودهای تک‌نفرهٔ فاز ۰ مجازند. DUEL در فاز ۲ باز می‌شود.
 */
export enum SinglePlayerMode {
  QUICK = 'QUICK',
  BOMB = 'BOMB',
}

export class CreateMatchDto {
  @IsString()
  userId!: string;

  @IsEnum(SinglePlayerMode, { message: 'مود باید QUICK یا BOMB باشد' })
  mode!: SinglePlayerMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  totalRounds?: number;
}
