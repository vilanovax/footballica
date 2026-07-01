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
import { DifficultyDto, QuestionOptionDto } from './create-question.dto';

/**
 * ویرایشِ سؤال — همهٔ فیلدها اختیاری‌اند.
 * اگر options بیاید، کاملاً جایگزینِ گزینه‌های قبلی می‌شود.
 */
export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'متنِ سؤال خیلی کوتاه است' })
  text?: string;

  @IsOptional()
  @IsEnum(DifficultyDto)
  difficulty?: DifficultyDto;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2, { message: 'حداقل ۲ گزینه لازم است' })
  @ArrayMaxSize(6, { message: 'حداکثر ۶ گزینه مجاز است' })
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
