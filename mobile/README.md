# فوتبالیکا — کلاینت موبایل (Expo)

اپ موبایلِ فاز ۰: خانه + حلقهٔ سؤالِ تک‌نفره با تایمرِ **server-authoritative** و حالت بمب.

## استک
Expo + expo-router + TypeScript · Zustand · TanStack Query · Reanimated · react-native-svg · expo-linear-gradient · expo-haptics.
فونت: **وزیرمتن** (لوکال، `assets/fonts/`). چیدمان RTL و فارسی.

## راه‌اندازی

```bash
cd mobile
npm install
npm start           # سپس روی دستگاه/امولاتور باز کن (Expo Go یا dev build)
npm run typecheck   # بررسی نوع‌ها
```

اول **بک‌اند** را بالا بیاور (پوشهٔ `../backend`). آدرسِ API در `app.json` →
`expo.extra.apiBaseUrl` است (پیش‌فرض `http://localhost:3000`). روی دستگاه واقعی،
به‌جای localhost آی‌پیِ محلیِ کامپیوترت را بگذار.

## پیش‌نمایش و خروجیِ اندروید

سه راه (از سریع به کامل):

### ۱) سریع‌ترین: Expo Go (بدونِ اندروید استودیو)
```bash
npm start          # یک QR نشان می‌دهد
```
اپِ **Expo Go** را روی گوشی نصب کن و QR را اسکن کن — اپ زنده اجرا می‌شود
(hot-reload). برای امولاتور: `npm run android` (اگر امولاتور بالا باشد).

### ۲) اندروید استودیو (پروژهٔ native)
اپ managed-Expo است؛ پروژهٔ `android/` را «تولید» می‌کنیم (CNG):
```bash
npx expo prebuild --platform android   # پوشهٔ android/ را می‌سازد
```
سپس در **Android Studio** پوشهٔ `mobile/android` را `Open` کن و روی
امولاتور/دستگاه Run بزن. (توجه: RN «پیش‌نمایشِ استاتیکِ layout» ندارد؛ روی
امولاتور اجرا می‌شود، نه پنلِ Preview.)
> پوشهٔ `android/` تولیدشده است و در `.gitignore` است؛ با هر `prebuild` بازساخته می‌شود.

### ۳) خروجیِ APK (لوکال، ایران‌محور)
چون **EAS Build** (بیلدِ ابریِ Expo) ممکن است در ایران مسدود باشد، بیلدِ لوکال
با Gradle توصیه می‌شود:
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease   # خروجی: app/build/outputs/apk/release/
```
APK را روی **کافه‌بازار/مایکت** منتشر کن (طبق `CLAUDE.md`).

> پیش‌نیازِ راه ۲ و ۳: JDK 17 + Android SDK (که اندروید استودیو نصب می‌کند).

## ساختار

```
mobile/
├─ app/                       # expo-router
│  ├─ _layout.tsx             # RTL، فونتِ لوکال، providerها (Query/SafeArea)
│  ├─ index.tsx               # خانه (لابی) — از روی ماک‌آپ
│  ├─ login.tsx               # ورود با شماره (OTP)
│  ├─ leaderboard.tsx         # رده‌بندی
│  ├─ play/
│  │  ├─ [matchId].tsx        # صفحهٔ سؤالِ تک‌نفره + تایمر/بمب
│  │  └─ result.tsx           # نتیجهٔ مَچ
│  └─ duel/
│     └─ [matchId].tsx        # صفحهٔ دوئل async (حریفِ انسان/ربات)
├─ src/
│  ├─ theme.ts                # توکن‌های دیزاین (منبع یگانه)
│  ├─ api/                    # client + قراردادِ مَچ (آینهٔ بک‌اند)
│  ├─ store/                  # zustand: useSession, useMatch
│  ├─ lib/                    # اعداد فارسی، تاریخ جلالی، useCountdown
│  └─ components/             # AnswerButton, TimerRing, BombTimer
└─ assets/fonts/              # Vazirmatn-*.ttf
```

## قانون طلایی در کلاینت
- تایمر از `deadlineAt`/`serverNow`ِ سرور محاسبه می‌شود (`toClientDeadline`)، نه
  یک شمارندهٔ محلیِ مستقل.
- `RoundView` هیچ `isCorrect` ندارد؛ درستی فقط از پاسخِ `submitAnswer` می‌آید و
  همان لحظه گزینهٔ درست/غلط رنگ می‌گیرد.
- وقتی تایمر صفر شد، کلاینت پاسخِ `null` می‌فرستد و سرور «دیر» را قطعی می‌کند.
