import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "فوتبالیکا",
  description: "با دانشِ فوتبالی‌ات، باشگاهت را به قهرمانی برسان.",
};

export const viewport: Viewport = {
  themeColor: "#0a1410",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} antialiased`}>
        {/* قابِ گوشی: روی موبایل تمام‌عرض، روی دسکتاپ وسط‌چین */}
        <div className="phone-frame">{children}</div>
      </body>
    </html>
  );
}
