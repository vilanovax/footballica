import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS — پنلِ ادمین (Next.js، مبدأ دیگر) از مرورگر به API می‌زند.
  // در dev همه‌چیز مجاز؛ در prod فقط مبدأهای CORS_ORIGINS (کاما-جدا).
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins && origins.length > 0 ? origins : true,
    credentials: true,
  });

  // اعتبارسنجی سراسری ورودی‌ها (DTO + class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // فیلدهای ناشناخته حذف می‌شوند
      forbidNonWhitelisted: true, // فیلد اضافه → خطا
      transform: true, // تبدیل payload به نمونهٔ DTO
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`⚽ فوتبالیکا بک‌اند روی پورت ${port} بالا آمد`);
}

void bootstrap();
