# Footballica

`Footballica` یک بازی مدیریتی/کوئیزی فوتبال با UI موبایل‌محور، RTL فارسی، اقتصاد باشگاهی، مأموریت روزانه و چند mode مختلف بازی است.

## Core Loop

loop اصلی بازی این است:

1. بازی کردن در modeهای مختلف مثل `quiz`, `duel`, `bomb`, `penalty`, `survival`
2. گرفتن پاداش مثل `XP`, `fans`, `cards`, `treasury money`
3. خرج کردن درآمد در بخش `Club`
4. ارتقای ساختمان‌ها، خزانه و مدیرها
5. تکمیل مأموریت‌ها و باز کردن progression بیشتر

## Tech Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind 4`
- `Zustand` برای state و persistence

## App Structure

نقطهٔ ورود UI در `app/page.tsx` است و screenها داخل `components/screens` رندر می‌شوند.

بخش‌های اصلی:

- `components/screens`: screen-level UI
- `components/ui`: reusable UI pieces
- `lib/store.ts`: state و اکشن‌های اصلی بازی
- `lib/designSystem.ts`: mapهای مرکزی برای mode/rarity/theme
- `app/globals.css`: theme tokens و screen styling

## Design System Docs

برای جزئیات rollout طراحی و primitiveهای مشترک این سند را ببین:

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

این سند توضیح می‌دهد:

- چه tokenهایی اضافه شده‌اند
- چه primitiveهایی ساخته شده‌اند
- کدام screenها migrate شده‌اند
- قواعد استفاده از `Button`, `GameCard`, `ProgressBar`, `BottomSheet`

## Recent Implemented Changes

تغییرات نهایی این rollout فقط روی primitiveها نماند و به یک پاس polish روی screenهای اصلی هم رسید:

- ساده‌سازی اقتصاد باشگاه با مدل `treasury as spendable money`
- اضافه شدن `lib/designSystem.ts` برای mode/rarity/theme maps
- اضافه شدن primitiveهای مشترک:
  - `components/ui/Button.tsx`
  - `components/ui/GameCard.tsx`
  - `components/ui/ProgressBar.tsx`
  - `components/ui/BottomSheet.tsx`
- migration screenهای اصلی روی design system جدید:
  - `Home`
  - `Club`
  - `Missions`
  - `Profile`
  - `Shop`
  - `Result`
  - `UnitCard`
  - `ManagerPanel`
  - `ClubBankSheet`
  - `HomeFeaturedMode`
  - `HomeMissionBanner`
  - `HomeStreakBar`
  - `ClubHomeBanner`
  - `ProfileIdentitySheet`
- آخرین پاس UX/UI:
  - `Home` به فرم command-center با quick-play hero، featured mode، mission banner و tournament teaser
  - `Club` با next-action strip، next-build hero و CTAهای روشن‌تر برای collect / upgrade / unlock
  - `Profile` با identity CTA واضح‌تر، نوار XP ضخیم‌تر، reward سطح بعد و بخش `آمار فصل`
  - `Shop` با CTAهای مبتنی بر کارت تاکتیکی، شمارش دقیق affordability و جداسازی واضح خرید درون‌بازی از خرید با پول واقعی

## Development

برای اجرای پروژه:

```bash
npm run dev
```

برای بررسی type safety:

```bash
npx tsc --noEmit
```

برای lint:

```bash
npm run lint
```

سپس اپ را در `http://localhost:3000` باز کن.
