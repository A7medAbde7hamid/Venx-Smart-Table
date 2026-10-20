import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
