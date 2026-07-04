# Footballica Design System

این سند وضعیت فعلی design system فوتبالیکا، تغییرات پیاده‌سازی‌شده، و قواعد استفاده از primitiveهای مشترک را توضیح می‌دهد.

## Goal

هدف این rollout این بود که UI بازی از حالت screen-by-screen styling به یک grammar مشترک برسد:

- tokenهای مرکزی برای رنگ، سطح، rarity و mode
- primitiveهای reusable برای CTA، card، progress و sheet
- migration تدریجی screenهای اصلی بدون شکستن حس فعلی بازی

## What Changed

دو فاز اصلی پیاده‌سازی شد.

### 1. Token Foundation

لایهٔ tokenها در `app/globals.css` و `lib/designSystem.ts` اضافه و یکپارچه شد.

در `app/globals.css` این گروه‌ها تعریف شدند:

- `surface-*`
- `text-*`
- `status-*`
- `resource-*`
- `rarity-*`
- `mode-*`
- spacing / radius / shadow vars

در `lib/designSystem.ts` این mapهای مرکزی ساخته شدند:

- `MODE_THEME_MAP`
- `CLUB_COLOR_OPTIONS`
- `RARITY_ORDER`
- `RARITY_COLOR`
- `RARITY_THEME`

هدف این لایه این است که رنگ و meaning دیگر در چند فایل مختلف تکرار نشود.

### 2. Shared UI Primitives

چهار primitive جدید اضافه شد:

- `components/ui/Button.tsx`
- `components/ui/GameCard.tsx`
- `components/ui/ProgressBar.tsx`
- `components/ui/BottomSheet.tsx`

این‌ها روی tokenهای جدید سوار هستند و قرار است نقطهٔ ورود استاندارد برای UIهای جدید باشند.

## Primitive Reference

### `Button`

فایل: `components/ui/Button.tsx`

قابلیت‌ها:

- variant: `primary | secondary | accent | muted | success`
- size: `sm | md | lg`
- `fullWidth`
- `shake`

استفادهٔ پیشنهادی:

- `primary`: CTA اصلی مثل claim, collect, replay
- `accent`: اکشن ثانویهٔ مهم مثل upgrade/assign
- `secondary`: دکمهٔ خنثی ولی فعال
- `muted`: دکمه‌های informational یا disabled-like
- `success`: state مثبت/active

### `GameCard`

فایل: `components/ui/GameCard.tsx`

قابلیت‌ها:

- variant: `hero | asset | locked`
- رندر به صورت `div` یا `button`
- `highlight`
- `disabled`

استفادهٔ پیشنهادی:

- `hero`: بخش‌های high-priority مثل خزانه، result hero، shop hero
- `asset`: کارت‌های اصلی قابل تعامل مثل building, mission, manager, reward
- `locked`: آیتم‌های قفل یا completed/disabled-looking surfaces

### `ProgressBar`

فایل: `components/ui/ProgressBar.tsx`

قابلیت‌ها:

- tone: `money | success | danger | info`
- سفارشی‌سازی track/fill class

استفادهٔ پیشنهادی:

- `money`: affordability, treasury, claimable value
- `success`: progress مثبت/رشد
- `danger`: loss/risk/negative performance
- `info`: آموزشی، level gate، neutral progress

### `BottomSheet`

فایل: `components/ui/BottomSheet.tsx`

بخش‌ها:

- `BottomSheet`
- `BottomSheetHandle`
- `BottomSheetHeader`

هدف:

- حذف duplication در sheetهای مدیریتی/اقتصادی
- یکسان‌سازی backdrop, panel, sticky header, close behavior

## Rollout Coverage

primitiveهای جدید در این نواحی adopt شده‌اند:

- `components/screens/Home.tsx`
- `components/screens/Club.tsx`
- `components/screens/Missions.tsx`
- `components/screens/Result.tsx`
- `components/screens/Shop.tsx`
- `components/ui/ClubBankSheet.tsx`
- `components/ui/ClubHomeBanner.tsx`
- `components/ui/HomeFeaturedMode.tsx`
- `components/ui/HomeMissionBanner.tsx`
- `components/ui/HomeStreakBar.tsx`
- `components/ui/ManagerPanel.tsx`
- `components/ui/UnitCard.tsx`

## Structural Changes by Area

### Home

- quick-play hero به `GameCard + Button`
- featured mode card به `GameCard`
- mission banner به `GameCard + Button`
- streak panel به `GameCard`

### Club

- treasury hero به `GameCard + ProgressBar + Button`
- season goal به `GameCard + ProgressBar`
- building cards به `GameCard + ProgressBar + Button`
- locked build rows به `GameCard`

### Economy Sheets

- `ClubBankSheet` به `BottomSheet + ProgressBar + Button`
- `ManagerPanel` به `BottomSheet + GameCard + ProgressBar + Button`

### Result

- result hero به `GameCard + ProgressBar`
- reward containerها به `GameCard`
- review rowها به `GameCard`
- action area به `Button`

### Missions

- mission cards به `GameCard + Button + ProgressBar`
- onboarding path progress به `GameCard + ProgressBar`

### Shop

- shop banner و shelf به `GameCard`
- power-up cards به `GameCard + Button`
- premium offers به `GameCard`

## Usage Rules

برای توسعهٔ بعدی این قواعد را نگه دارید:

1. برای CTA جدید، اول `Button` را استفاده کن؛ فقط اگر واقعاً لازم بود class اختصاصی اضافه کن.
2. برای card جدید، اول تصمیم بگیر `hero` است یا `asset` یا `locked`.
3. برای هر progress جدید، از `ProgressBar` استفاده کن و صرفاً tone و size را تغییر بده.
4. برای sheet جدید، از `BottomSheet` استفاده کن؛ backdrop و panel جداگانه نساز.
5. اگر رنگ یا gradient جدید لازم شد، اول بررسی کن آیا باید token جدید باشد یا صرفاً مصرف یکی از tokenهای موجود.
6. mapهای `mode`, `rarity`, `club color` فقط در `lib/designSystem.ts` نگه داشته شوند.

## Verification

بعد از rollout، این‌ها پاس شده‌اند:

- `npx tsc --noEmit`
- lint diagnostics روی فایل‌های تغییرکرده

## Recommended Next Steps

برای ادامهٔ تمیزکاری، این کارها منطقی‌اند:

1. حذف تدریجی CSSهای قدیمی که primitiveها جایگزینشان کرده‌اند.
2. استخراج resource pill مشترک برای `cards / lives / treasury / fans`.
3. تعریف naming rule برای classهای legacy تا migration تدریجی واضح بماند.
4. در صورت رشد بیشتر پروژه، شکستن `app/globals.css` به لایه‌های theme/components/screens.
