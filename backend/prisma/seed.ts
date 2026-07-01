// ============================================================
//  فوتبالیکا — اسکریپت seed
//  ۲۰ سؤالِ نمونهٔ فوتبالیِ فارسی + چند دسته‌بندی + کاربرِ دمو.
//  اجرا:  npm run db:seed
// ============================================================

import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedOption {
  text: string;
  correct?: boolean;
}
interface SeedQuestion {
  text: string;
  difficulty: Difficulty;
  category: string; // slug
  options: SeedOption[];
  metadata?: Record<string, unknown>;
}

const CATEGORIES: { name: string; slug: string }[] = [
  { name: 'جام جهانی', slug: 'world-cup' },
  { name: 'لیگ قهرمانان اروپا', slug: 'ucl' },
  { name: 'فوتبال ایران', slug: 'iran' },
  { name: 'بازیکنان', slug: 'players' },
  { name: 'قوانین فوتبال', slug: 'rules' },
];

const QUESTIONS: SeedQuestion[] = [
  {
    text: 'میزبان جام جهانی ۲۰۲۲ کدام کشور بود؟',
    difficulty: Difficulty.EASY,
    category: 'world-cup',
    options: [
      { text: 'قطر', correct: true },
      { text: 'روسیه' },
      { text: 'برزیل' },
      { text: 'آلمان' },
    ],
  },
  {
    text: 'پرافتخارترین باشگاه تاریخ لیگ قهرمانان اروپا کدام است؟',
    difficulty: Difficulty.MEDIUM,
    category: 'ucl',
    options: [
      { text: 'رئال مادرید', correct: true },
      { text: 'آ.ث میلان' },
      { text: 'بایرن مونیخ' },
      { text: 'لیورپول' },
    ],
  },
  {
    text: 'لیونل مسی اهل کدام کشور است؟',
    difficulty: Difficulty.EASY,
    category: 'players',
    options: [
      { text: 'آرژانتین', correct: true },
      { text: 'برزیل' },
      { text: 'اسپانیا' },
      { text: 'اروگوئه' },
    ],
  },
  {
    text: 'رکورددار گلزنی در تاریخ جام جهانی (تا ۲۰۲۲) کیست؟',
    difficulty: Difficulty.HARD,
    category: 'world-cup',
    options: [
      { text: 'میروسلاو کلوزه', correct: true },
      { text: 'رونالدو نازاریو' },
      { text: 'گرد مولر' },
      { text: 'لیونل مسی' },
    ],
  },
  {
    text: 'تیم ملی فوتبال ایران تا جام جهانی ۲۰۲۲ چند بار به این رقابت‌ها راه یافته است؟',
    difficulty: Difficulty.MEDIUM,
    category: 'iran',
    options: [
      { text: '۶ بار', correct: true },
      { text: '۴ بار' },
      { text: '۵ بار' },
      { text: '۸ بار' },
    ],
  },
  {
    text: 'رنگ سنتی پیراهن باشگاه پرسپولیس چیست؟',
    difficulty: Difficulty.EASY,
    category: 'iran',
    options: [
      { text: 'قرمز', correct: true },
      { text: 'آبی' },
      { text: 'سبز' },
      { text: 'زرد' },
    ],
  },
  {
    text: 'کریستیانو رونالدو در کدام باشگاه پرتغالی به فوتبال حرفه‌ای رسید؟',
    difficulty: Difficulty.MEDIUM,
    category: 'players',
    options: [
      { text: 'اسپورتینگ لیسبون', correct: true },
      { text: 'بنفیکا' },
      { text: 'پورتو' },
      { text: 'براگا' },
    ],
  },
  {
    text: 'جام جهانی ۲۰۱۸ در کدام کشور برگزار شد؟',
    difficulty: Difficulty.EASY,
    category: 'world-cup',
    options: [
      { text: 'روسیه', correct: true },
      { text: 'برزیل' },
      { text: 'آفریقای جنوبی' },
      { text: 'قطر' },
    ],
  },
  {
    text: 'قهرمان جام جهانی ۲۰۱۴ کدام تیم بود؟',
    difficulty: Difficulty.MEDIUM,
    category: 'world-cup',
    options: [
      { text: 'آلمان', correct: true },
      { text: 'آرژانتین' },
      { text: 'برزیل' },
      { text: 'هلند' },
    ],
  },
  {
    text: 'دیدار «ال‌کلاسیکو» بین کدام دو تیم برگزار می‌شود؟',
    difficulty: Difficulty.EASY,
    category: 'players',
    options: [
      { text: 'رئال مادرید و بارسلونا', correct: true },
      { text: 'میلان و اینتر' },
      { text: 'منچستر یونایتد و سیتی' },
      { text: 'بایرن و دورتموند' },
    ],
  },
  {
    text: 'علی دایی به‌عنوان رکورددار سابقِ گلزنی ملی، چند گل ملی به ثمر رساند؟',
    difficulty: Difficulty.HARD,
    category: 'iran',
    options: [
      { text: '۱۰۹ گل', correct: true },
      { text: '۸۵ گل' },
      { text: '۱۲۰ گل' },
      { text: '۹۵ گل' },
    ],
  },
  {
    text: 'هر تیم در شروع یک بازی فوتبال چند بازیکن در زمین دارد؟',
    difficulty: Difficulty.EASY,
    category: 'rules',
    options: [
      { text: '۱۱ نفر', correct: true },
      { text: '۱۰ نفر' },
      { text: '۱۲ نفر' },
      { text: '۹ نفر' },
    ],
  },
  {
    text: 'کدام کشور بیشترین تعداد قهرمانی جام جهانی را در اختیار دارد؟',
    difficulty: Difficulty.MEDIUM,
    category: 'world-cup',
    options: [
      { text: 'برزیل', correct: true },
      { text: 'آلمان' },
      { text: 'ایتالیا' },
      { text: 'آرژانتین' },
    ],
  },
  {
    text: 'باشگاه بارسلونا در کدام شهر اسپانیا قرار دارد؟',
    difficulty: Difficulty.EASY,
    category: 'players',
    options: [
      { text: 'بارسلونا', correct: true },
      { text: 'مادرید' },
      { text: 'سویا' },
      { text: 'والنسیا' },
    ],
  },
  {
    text: 'سرمربی تیم ملی ایران در جام‌های جهانی ۲۰۱۴ و ۲۰۱۸ چه کسی بود؟',
    difficulty: Difficulty.MEDIUM,
    category: 'iran',
    options: [
      { text: 'کارلوس کی‌روش', correct: true },
      { text: 'افشین قطبی' },
      { text: 'امیر قلعه‌نویی' },
      { text: 'برانکو ایوانکوویچ' },
    ],
  },
  {
    text: 'کدام باشگاه انگلیسی به «شیاطین سرخ» معروف است؟',
    difficulty: Difficulty.EASY,
    category: 'players',
    options: [
      { text: 'منچستر یونایتد', correct: true },
      { text: 'لیورپول' },
      { text: 'آرسنال' },
      { text: 'چلسی' },
    ],
  },
  {
    text: 'مدت زمان قانونی هر نیمهٔ یک بازی فوتبال چند دقیقه است؟',
    difficulty: Difficulty.EASY,
    category: 'rules',
    options: [
      { text: '۴۵ دقیقه', correct: true },
      { text: '۴۰ دقیقه' },
      { text: '۳۰ دقیقه' },
      { text: '۶۰ دقیقه' },
    ],
  },
  {
    text: 'جایزهٔ «توپ طلا» (Ballon d’Or) به چه کسی اهدا می‌شود؟',
    difficulty: Difficulty.MEDIUM,
    category: 'players',
    options: [
      { text: 'بهترین بازیکن سال', correct: true },
      { text: 'بهترین گلزن لیگ' },
      { text: 'بهترین دروازه‌بان' },
      { text: 'بهترین مربی' },
    ],
  },
  {
    text: 'برای اخراج یک بازیکن، داور چه کارتی نشان می‌دهد؟',
    difficulty: Difficulty.EASY,
    category: 'rules',
    options: [
      { text: 'کارت قرمز', correct: true },
      { text: 'کارت زرد' },
      { text: 'کارت آبی' },
      { text: 'کارت سبز' },
    ],
  },
  {
    text: 'مهدی طارمی، مهاجم ملی‌پوش ایران، پیش از انتقال به اروپا بیشتر در کدام باشگاه پرتغالی درخشید؟',
    difficulty: Difficulty.HARD,
    category: 'iran',
    options: [
      { text: 'پورتو', correct: true },
      { text: 'بنفیکا' },
      { text: 'اسپورتینگ' },
      { text: 'براگا' },
    ],
  },
];

async function main(): Promise<void> {
  console.log('🌱 شروع seed فوتبالیکا...');

  // ۱) دسته‌بندی‌ها
  const categoryIdBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
    categoryIdBySlug.set(c.slug, cat.id);
  }
  console.log(`✓ ${CATEGORIES.length} دسته‌بندی`);

  // ۲) کاربرِ دمو (برای تستِ حلقهٔ تک‌نفره بدون Auth)
  await prisma.user.upsert({
    where: { phone: '09120000000' },
    update: {},
    create: { phone: '09120000000', name: 'بازیکن دمو', coins: 100, lives: 5 },
  });
  console.log('✓ کاربر دمو (شماره 09120000000)');

  // ۳) سؤال‌ها — برای idempotent بودن، اول سؤال‌های تکراری را حذف می‌کنیم
  for (const q of QUESTIONS) {
    const existing = await prisma.question.findFirst({
      where: { text: q.text },
      select: { id: true },
    });
    if (existing) {
      await prisma.question.delete({ where: { id: existing.id } });
    }

    await prisma.question.create({
      data: {
        text: q.text,
        difficulty: q.difficulty,
        isApproved: true,
        categoryId: categoryIdBySlug.get(q.category),
        metadata: { source: 'seed', ...(q.metadata ?? {}) },
        options: {
          create: q.options.map((o, index) => ({
            text: o.text,
            isCorrect: o.correct ?? false,
            order: index,
          })),
        },
      },
    });
  }
  console.log(`✓ ${QUESTIONS.length} سؤال (همه تأییدشده)`);
  console.log('🌱 seed کامل شد.');
}

main()
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
