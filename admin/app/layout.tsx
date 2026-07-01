import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const vazirmatn = localFont({
  src: [
    { path: '../public/fonts/Vazirmatn-Regular.ttf', weight: '400' },
    { path: '../public/fonts/Vazirmatn-Bold.ttf', weight: '700' },
  ],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'فوتبالیکا — پنل ادمین',
  description: 'مدیریت سؤال‌ها و محتوای بازی کوییز فوتبالیکا',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body>{children}</body>
    </html>
  );
}
