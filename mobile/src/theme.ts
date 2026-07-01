// ============================================================
//  فوتبالیکا — Design Tokens  (theme.ts)
//  زبان بصری استخراج‌شده از ماک‌آپ‌ها. این فایل منبعِ یگانهٔ
//  حقیقت برای رنگ، تایپ، فاصله و سایه در کل اپ است.
// ============================================================

export const colors = {
  // پس‌زمینهٔ چمنِ شب‌بازی
  pitchDeep:   '#07160F',   // زمینهٔ اصلی صفحه
  pitch:       '#0E4D2A',   // راه‌راه چمن تیره
  pitchLight:  '#14622F',   // راه‌راه چمن روشن
  pitchBtn:    '#1D6E3A',   // دکمهٔ گزینه (بالا)
  pitchBtnLow: '#155029',   // دکمهٔ گزینه (پایین گرادیان)
  pitchBtnSh:  '#0C3A1D',   // سایهٔ زیر دکمهٔ گزینه

  // چرم / کارت روشن
  leather:     '#F4EFE4',
  leatherLow:  '#EBE4D4',
  leatherSh:   '#D6CCB7',
  ink:         '#0A1A12',   // متن تیره روی کارت روشن

  // نور پروژکتور / اکشن اصلی (با احتیاط خرج شود)
  amber:       '#FFC23C',
  amberDeep:   '#E89A1C',
  amberShadow: '#C9851A',

  // حالت‌ها
  correct:     '#3DD66E',
  wrong:       '#F0413E',
  fuse:        '#FF7A1A',

  // متن روی زمینهٔ تیره
  chalk:       '#EAF2EC',
  chalkDim:    '#9DB4A6',

  // آواتار تیم‌ها
  teamBlue:    '#1450C4',
  teamBlueHi:  '#3AA0FF',
  teamRed:     '#C1272D',
  teamRedHi:   '#FF5A5A',
  teamPurple:  '#6D23B6',
  teamPurpleHi:'#A855F7',

  // سطوح شیشه‌ای روی چمن
  glass:       'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.12)',
  overlay:     'rgba(4,12,8,0.92)',
} as const;

// شعاع گوشه‌ها (از ماک‌آپ: کارت ۱۸–۲۰، دکمه ۱۴، تراشه ۱۰–۱۲)
export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 22,
  pill: 999,
} as const;

// فاصله‌گذاری ۴pt
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const;

// تایپوگرافی — وزیرمتن. روی RN باید فونت را لوکال بارگذاری کنی
// (expo-font) چون CDN گوگل در ایران قابل‌اتکا نیست.
export const font = {
  family: {
    regular: 'Vazirmatn-Regular',
    medium:  'Vazirmatn-Medium',
    bold:    'Vazirmatn-Bold',
    black:   'Vazirmatn-Black',   // دیسپلی: تایمر، عنوان‌ها، امتیاز
  },
  size: {
    caption: 11,
    body:    13,
    label:   15,
    title:   18,
    h2:      24,
    h1:      30,
    timer:   44,   // عدد تایمر/بمب
  },
} as const;

// سایه‌ها. توجه: دکمه‌های چرمیِ برجسته در RN با سایهٔ معمولی
// در نمی‌آیند؛ افکتِ "۵px پایین‌تر" را باید با یک View زیرین یا
// border-bottom-width شبیه‌سازی کنی (در کامپوننت AnswerButton دیده می‌شود).
export const shadow = {
  card:   { shadowColor:'#000', shadowOpacity:0.45, shadowRadius:28, shadowOffset:{width:0,height:16}, elevation:12 },
  raised: { shadowColor:'#000', shadowOpacity:0.35, shadowRadius:18, shadowOffset:{width:0,height:8},  elevation:8 },
  glow:   (c:string)=>({ shadowColor:c, shadowOpacity:0.6, shadowRadius:10, shadowOffset:{width:0,height:0}, elevation:6 }),
} as const;

export const timing = {
  press: 80,        // مدت انیمیشن فشردن دکمه
  reveal: 250,      // نمایش درست/غلط
  bombTotal: 8,     // ثانیهٔ حالت بمب
  normalTotal: 15,  // ثانیهٔ حالت عادی
} as const;

export const theme = { colors, radius, spacing, font, shadow, timing };
export type Theme = typeof theme;
export default theme;
