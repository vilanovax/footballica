import { Matches, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'نامِ دسته خیلی کوتاه است' })
  name!: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug فقط حروفِ کوچکِ انگلیسی، عدد و خط‌تیره',
  })
  slug!: string;
}
