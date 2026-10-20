import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "جدولي | خطة حضور أذكى",
    template: "%s | جدولي",
  },
  description:
    "اختار سكشنك والأسبوع واليوم، واحصل على أفضل خطة حضور بأقل وقت في الجامعة مع الحفاظ على نفس المعيد.",
  manifest: "/manifest.webmanifest",
  applicationName: "Venx Smart Table",
  appleWebApp: {
    capable: true,
    title: "Venx",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f3d2e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
