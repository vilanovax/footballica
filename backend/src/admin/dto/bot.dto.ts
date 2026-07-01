import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { BotDifficulty } from '@prisma/client';

export class CreateBotDto {
  @IsString()
  @MinLength(2, { message: 'نامِ ربات خیلی کوتاه است' })
  name!: string;

  @IsEnum(BotDifficulty, { message: 'درجهٔ سختی باید EASY/MEDIUM/HARD باشد' })
  difficulty!: BotDifficulty;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateBotDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(BotDifficulty)
  difficulty?: BotDifficulty;

  @IsOptional()
  @IsString()
  avatar?: string;
}
