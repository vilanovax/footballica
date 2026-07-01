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

## ساختار

```
mobile/
├─ app/                       # expo-router
│  ├─ _layout.tsx             # RTL، فونتِ لوکال، providerها (Query/SafeArea)
│  ├─ index.tsx               # خانه (لابی) — از روی ماک‌آپ
│  └─ play/
│     ├─ [matchId].tsx        # صفحهٔ سؤال + تایمر/بمب
│     └─ result.tsx           # نتیجهٔ مَچ
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
