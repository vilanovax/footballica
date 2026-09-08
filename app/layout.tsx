import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fredoka, Nunito, Vazirmatn } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getDirection } from "@/lib/i18n/config";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/localeCookie";
import "./globals.css";

const fontDisplay = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const fontBody = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const fontFa = Vazirmatn({
  variable: "--font-fa",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Footballica | فوتبالیکا",
  description:
    "The Ultimate Fantasy Football Trivia Game | بازی جذاب اطلاعات فوتبالی",
  applicationName: "Footballica",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Footballica",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#07130D" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1524" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontFa.variable} player-pitch h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("footballica:theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full overflow-x-hidden font-body text-foreground">
        <LanguageProvider seedLocale={locale}>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
