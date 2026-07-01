#!/usr/bin/env bash
# ============================================================
#  push-to-github.sh — این ریپو را به گیت‌هابِ خودت پوش می‌کند.
#  استفاده:  bash push-to-github.sh
# ============================================================
set -e

REMOTE="https://github.com/vilanovax/footballica.git"

echo "→ اتصال به ریموت: $REMOTE"

# اگر ریپوی گیت نیست، بسازش
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "seed: طراحی، ماک‌آپ‌ها، و بذرِ کد فوتبالیکا"
fi

git branch -M main

# ریموت را اضافه یا به‌روز کن
if git remote | grep -q origin; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

echo "→ در حال پوش... (گیت‌هاب یوزرنیم و توکن می‌خواهد)"
git push -u origin main

echo "✓ تمام شد. به https://github.com/vilanovax/footballica سر بزن."
