import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FindDuelDto {
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  totalRounds?: number;
}
