# فوتبالیکا (Footballica) ⚽

بازیِ کوییز فوتبالیِ موبایل — RTL، فارسی، بازار هدف ایران.
**هویت:** «با دانشِ فوتبالی‌ات، باشگاهت را از دستهٔ سه به قهرمانی برسان.»

این ریپو فعلاً **پکیجِ طراحی و بذرِ کد** است؛ کدِ کاملِ اپ را Claude Code / Cursor
از روی همین فایل‌ها می‌سازد.

## ساختار

```
footballica/
├─ CLAUDE.md / .cursorrules     # قوانین ایجنت (غیرقابل‌نقض)
├─ docs/
│  ├─ ARCHITECTURE.md           # معماری، استک، نقشهٔ راه، ملاحظات ایران
│  ├─ GAME-DESIGN.md            # گیم‌پلی، متا-گیم، اقتصاد، پاورآپ‌ها
│  ├─ ECONOMY.md                # اعداد اقتصاد (اگر موجود)
│  └─ START-PROMPT.md           # پرامپت سه‌مرحله‌ای برای Claude Code
├─ design-mockups/             # ۵ ماک‌آپ HTML (مرجع بصری)
│  ├─ footbalika-home.html
│  ├─ footbalika-question-screen.html
│  ├─ footbalika-round-result.html
│  ├─ footbalika-club.html
│  └─ footbalika-economy.html
└─ _seed/                      # کدِ بذر (ایجنت سرِ جایش می‌نشاند)
   ├─ backend/  schema.prisma, match-engine.service.ts
   └─ mobile/   theme.ts, AnswerButton.tsx
```

## شروع
۱. ماک‌آپ‌ها را در مرورگر باز کن تا حسِ بصری را ببینی.
۲. Claude Code را در ریشه باز کن و **پیام اولِ** `docs/START-PROMPT.md` را بده.
۳. مرحله‌به‌مرحله جلو برو (اول بک‌اند، بعد کلاینت).

## استک (مقصد)
React Native + Expo · NestJS · PostgreSQL (Prisma) · Redis · BullMQ · Next.js (ادمین)

## دو قانون غیرقابل‌نقض
- **Server-authoritative:** درستی و زمان فقط سمت سرور. `isCorrect` هرگز به کلاینت نرود.
- **async-first:** دوئل نوبتی است؛ Socket.IO تا فاز ۳ نه.
