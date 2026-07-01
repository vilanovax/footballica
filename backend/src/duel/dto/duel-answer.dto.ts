import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class DuelAnswerDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  optionId: string | null = null;
}
