# فوتبالیکا — بک‌اند (NestJS)

بک‌اندِ فاز ۰: حلقهٔ اصلی تک‌نفره + تایمرِ **server-authoritative** + مود بمب.

## استک
NestJS · Prisma · PostgreSQL · Redis (ioredis) · TypeScript سخت‌گیرانه.

## راه‌اندازی

```bash
cd backend
cp .env.example .env          # مقادیر را در صورت نیاز ویرایش کن
npm install

# Postgres + Redis محلی
docker compose up -d          # یا سرویس‌های native خودت

npx prisma migrate dev        # ساخت جداول
npm run db:seed               # ۲۰ سؤال نمونهٔ فارسی + کاربر دمو
npm run start:dev             # سرور روی http://localhost:3000
```

## endpointها (فاز ۰)

| متد | مسیر | کار |
|---|---|---|
| POST | `/matches` | ساخت مَچ تک‌نفره (`QUICK` یا `BOMB`) + شروع راند اول |
| POST | `/rounds/:id/answer` | ثبت پاسخِ راند (درستی/زمان سمت سرور) |
| POST | `/matches/:id/next-round` | راند بعد، یا پایان مَچ |

### فاز ۱ و ۲ (خلاصه)
- **Auth:** `POST /auth/request-otp` · `verify-otp` · `GET /auth/me` (ورود با شماره → JWT)
- **لیدربورد:** `GET /leaderboard` · `/leaderboard/me`
- **ادمین (هدرِ `x-admin-key`):** `/admin/questions*` (CMS سؤال) · `/admin/bots*` (ربات‌ها)
- **دوئل async (پشتِ JWT):** `/duels/find` · `/duels/:id/next-round` ·
  `/duels/rounds/:id/answer` · `GET /duels/:id` · `GET /duels`

> جزئیاتِ دوئل و سیستمِ ربات در **`../docs/DUEL-AND-BOTS.md`**.

نمونه:

```bash
# ساخت مَچ
curl -X POST localhost:3000/matches \
  -H 'Content-Type: application/json' \
  -d '{"userId":"demo-1","mode":"QUICK","totalRounds":5}'

# پاسخ به راند (roundId و optionId را از پاسخ بالا بردار)
curl -X POST localhost:3000/rounds/<roundId>/answer \
  -H 'Content-Type: application/json' \
  -d '{"userId":"demo-1","optionId":"<optionId>"}'
```

## دو قانونِ غیرقابل‌نقض (پیاده‌سازی‌شده)

1. **Server-authoritative:** پاسخِ `POST /matches` و `next-round` **هرگز** `isCorrect`
   ندارد؛ گزینه‌ها بدونِ فیلدِ درستی می‌روند. `deadlineAt`/`serverNow` از سرور
   می‌آید و درستی فقط در `submitAnswer` سنجیده می‌شود. (`match-engine.service.ts`)
2. **async-first:** بدون Socket.IO؛ فقط REST. (فاز ۳ اضافه می‌شود.)

## امتیازدهی
- **QUICK:** جواب درست = ۱۰۰ + تا ۵۰ جایزهٔ سرعت (خطی، نزولی). غلط = ۰.
- **BOMB:** درست = +۱۲۰ (خنثی)، غلط/دیر = −۱۵۰ (انفجار).
- لیدربورد در Redis Sorted Set (`leaderboard:global`).

## نکتهٔ محیطِ محدود (بدون دسترسیِ آزادِ اینترنت)

اگر postinstall پکیجِ `@prisma/engines` به‌خاطر پروکسی شکست خورد، باینری‌های موتور
را دستی بگیر و به Prisma معرفی کن (نمونه برای `debian-openssl-3.0.x`):

```bash
HASH=$(node -e "console.log(require('@prisma/engines-version').enginesVersion)")
TARGET=debian-openssl-3.0.x
BASE=https://binaries.prisma.sh/all_commits/$HASH/$TARGET
mkdir -p engines
curl -sSL -o engines/libquery_engine.so.node.gz "$BASE/libquery_engine.so.node.gz"
curl -sSL -o engines/schema-engine.gz "$BASE/schema-engine.gz"
gunzip -f engines/*.gz
mv engines/libquery_engine.so.node "engines/libquery_engine-$TARGET.so.node"
mv engines/schema-engine "engines/schema-engine-$TARGET"; chmod +x "engines/schema-engine-$TARGET"

export PRISMA_QUERY_ENGINE_LIBRARY="$PWD/engines/libquery_engine-$TARGET.so.node"
export PRISMA_SCHEMA_ENGINE_BINARY="$PWD/engines/schema-engine-$TARGET"
export CHECKPOINT_DISABLE=1
```

پوشهٔ `engines/` در `.gitignore` است (محیط‌محور و حجیم).
