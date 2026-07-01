import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum DifficultyDto {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class QuestionOptionDto {
  @IsString()
  @MinLength(1, { message: 'متنِ گزینه خالی است' })
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @MinLength(3, { message: 'متنِ سؤال خیلی کوتاه است' })
  text!: string;

  @IsEnum(DifficultyDto)
  difficulty!: DifficultyDto;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'حداقل ۲ گزینه لازم است' })
  @ArrayMaxSize(6, { message: 'حداکثر ۶ گزینه مجاز است' })
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  // اگر ست نشود، پیش‌فرض تأییدنشده است.
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
